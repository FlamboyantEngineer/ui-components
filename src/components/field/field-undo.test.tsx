import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TextField } from '../../../test/field-fixtures.js';
import { getFieldUndo, registerFieldUndo, type FieldUndo } from './field-undo.js';

function TwoFields() {
  return (
    <>
      <TextField label="Fruit" options={{ defaultValue: 'Fig' }} menu={['clear']} />
      <TextField label="City" options={{ defaultValue: 'Oslo' }} />
    </>
  );
}

type User = ReturnType<typeof userEvent.setup>;

/** Presses `keys` and reports whether the `z` keydown they produced was left to the browser. */
async function pressUnhandled(user: User, keys: string): Promise<boolean> {
  let pressed: KeyboardEvent | undefined;
  const listen = (event: KeyboardEvent) => {
    if (event.key.toLowerCase() === 'z') pressed = event;
  };
  window.addEventListener('keydown', listen, true);
  await user.keyboard(keys);
  window.removeEventListener('keydown', listen, true);
  if (!pressed) throw new Error(`No z keydown for ${keys}`);
  return !pressed.defaultPrevented;
}

function fakeUndo(log: string[], name: string): FieldUndo {
  return {
    canUndo: true,
    canRedo: false,
    undo: () => log.push(`${name}:undo`),
    redo: () => log.push(`${name}:redo`),
  };
}

describe('Field undo and redo', () => {
  it('UIC-FIELD-5.2 applies undo and redo chords to the focused field only', async () => {
    const user = userEvent.setup();
    render(<TwoFields />);
    const fruit = screen.getByRole('textbox', { name: 'Fruit' });
    const city = screen.getByRole('textbox', { name: 'City' });
    await user.type(fruit, 's');
    await user.type(city, 'x');
    await user.click(fruit);
    await user.keyboard('{Control>}z{/Control}');
    expect(fruit).toHaveValue('Fig');
    expect(city).toHaveValue('Oslox');
    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
    expect(fruit).toHaveValue('Figs');
    await user.keyboard('{Meta>}z{/Meta}');
    expect(fruit).toHaveValue('Fig');
    await user.keyboard('{Control>}y{/Control}');
    expect(fruit).toHaveValue('Figs');
    expect(city).toHaveValue('Oslox');
  });

  it('UIC-FIELD-5.2 leaves chords it cannot apply to the browser and other handlers', async () => {
    const user = userEvent.setup();
    render(<TwoFields />);
    const fruit = screen.getByRole('textbox', { name: 'Fruit' });
    await user.click(fruit);
    expect(await pressUnhandled(user, '{Control>}z{/Control}')).toBe(true);
    await user.keyboard('s');
    expect(fruit).toHaveValue('Figs');
    expect(await pressUnhandled(user, '{Control>}{Alt>}z{/Alt}{/Control}')).toBe(true);
    expect(fruit).toHaveValue('Figs');
    expect(await pressUnhandled(user, 'z')).toBe(true);
    expect(fruit).toHaveValue('Figsz');
    const handled = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true });
    handled.preventDefault();
    fruit.dispatchEvent(handled);
    expect(fruit).toHaveValue('Figsz');
    expect(await pressUnhandled(user, '{Control>}z{/Control}')).toBe(false);
    expect(fruit).toHaveValue('Fig');
  });

  it('UIC-FIELD-5.2 ignores chords pressed in the menu the field opened', async () => {
    const user = userEvent.setup();
    render(<TwoFields />);
    const fruit = screen.getByRole('textbox', { name: 'Fruit' });
    await user.type(fruit, 's');
    await user.click(screen.getByRole('button', { name: 'Fruit actions' }));
    const item = await screen.findByRole('menuitem', { name: 'Clear' });
    const menu = screen.getByRole('menu');
    expect(menu).toContainElement(item);
    expect(menu.contains(document.activeElement)).toBe(true);
    await user.keyboard('{Control>}z{/Control}');
    expect(fruit).toHaveValue('Figs');
  });

  it('UIC-FIELD-5.3 finds the undo of the nearest field for a host shortcut handler', async () => {
    const user = userEvent.setup();
    render(
      <>
        <TwoFields />
        <p>Outside</p>
      </>,
    );
    const fruit = screen.getByRole('textbox', { name: 'Fruit' });
    const city = screen.getByRole('textbox', { name: 'City' });
    await user.type(fruit, 's');
    await user.type(city, 'x');
    expect(getFieldUndo(screen.queryByText('Outside'))).toBeNull();
    expect(getFieldUndo(null)).toBeNull();
    const undo = getFieldUndo(document.activeElement);
    expect(undo?.canUndo).toBe(true);
    expect(undo?.canRedo).toBe(false);
    act(() => undo?.undo());
    expect(city).toHaveValue('Oslo');
    expect(fruit).toHaveValue('Figs');
    expect(getFieldUndo(screen.getByText('City'))?.canRedo).toBe(true);
    act(() => getFieldUndo(city)?.redo());
    expect(city).toHaveValue('Oslox');
    expect(fruit).toHaveValue('Figs');
  });

  it('UIC-FIELD-5.3 resolves the nearest registered root among nested elements', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    const leaf = document.createElement('span');
    outer.append(inner);
    inner.append(leaf);
    const log: string[] = [];
    const stopOuter = registerFieldUndo(outer, fakeUndo(log, 'outer'));
    const stopInner = registerFieldUndo(inner, fakeUndo(log, 'inner'));
    getFieldUndo(leaf)?.undo();
    expect(log).toEqual(['inner:undo']);
    stopInner();
    getFieldUndo(leaf)?.redo();
    expect(log).toEqual(['inner:undo', 'outer:redo']);
    stopOuter();
    expect(getFieldUndo(leaf)).toBeNull();
  });

  it('UIC-FIELD-5.4 removes an unmounted field and keeps a later registration of an element', () => {
    const { unmount } = render(<TwoFields />);
    const fruit = screen.getByRole('textbox', { name: 'Fruit' });
    expect(getFieldUndo(fruit)).not.toBeNull();
    unmount();
    expect(getFieldUndo(fruit)).toBeNull();

    const root = document.createElement('div');
    const log: string[] = [];
    const stopFirst = registerFieldUndo(root, fakeUndo(log, 'first'));
    const stopSecond = registerFieldUndo(root, fakeUndo(log, 'second'));
    stopFirst();
    getFieldUndo(root)?.undo();
    expect(log).toEqual(['second:undo']);
    stopSecond();
    expect(getFieldUndo(root)).toBeNull();
  });
});
