import { PlusGlyph } from '../../core/glyphs.js';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from '../../../test/field-fixtures.js';
import type { FieldMenuEntry } from './field.js';

const menu: FieldMenuEntry[] = [
  { id: 'copy', label: 'Copy name', icon: PlusGlyph },
  'clear',
  'reset',
  'set-default',
  'help',
];

/** Opens the field menu from its control with Shift+F10, as a keyboard reader does. */
async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('textbox'));
  await user.keyboard('{Shift>}{F10}{/Shift}');
  return screen.findByRole('menu', { name: 'Fruit actions' });
}

const names = (menuElement: HTMLElement) =>
  within(menuElement)
    .getAllByRole('menuitem')
    .map((item) => item.textContent);

describe('Field menu', () => {
  it('UIC-FIELD-6.1 lists built-in and custom entries in the caller order', async () => {
    const user = userEvent.setup();
    render(
      <TextField
        options={{ committedValue: 'Fig', defaultValue: 'Apple', emptyValue: '' }}
        menu={menu}
      />,
    );
    const opened = await openMenu(user);
    expect(names(opened)).toEqual(['Copy name', 'Clear', 'Reset', 'Set to default', 'Help']);
    const glyphs = within(opened)
      .getAllByRole('menuitem')
      .map((item) => item.querySelector('[data-glyph]')?.getAttribute('data-glyph'));
    expect(glyphs).toEqual(['plus', 'close', 'restore', 'refresh', 'help']);
  });

  it('UIC-FIELD-6.1 offers Clear and Reset by default, and no menu button', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<TextField options={{ emptyValue: '' }} />);
    expect(screen.queryByRole('button', { name: 'Fruit actions' })).not.toBeInTheDocument();
    expect(container.querySelector('.ui-dropdown-menu')).toBeNull();
    expect(names(await openMenu(user))).toEqual(['Clear', 'Reset']);
    await user.keyboard('{Escape}');
    // A field that can never be cleared leaves Clear out.
    rerender(<TextField options={{ emptyValue: '', isRequired: true }} />);
    expect(names(await openMenu(user))).toEqual(['Reset']);
    await user.keyboard('{Escape}');
    rerender(<TextField />);
    expect(names(await openMenu(user))).toEqual(['Reset']);
  });

  it('UIC-FIELD-6.2 disables Clear, Reset and Set to default when they have nothing to do', async () => {
    const user = userEvent.setup();
    render(
      <TextField
        options={{ committedValue: 'Apple', defaultValue: 'Apple', emptyValue: '' }}
        menu={['clear', 'reset', 'set-default', 'help']}
      />,
    );
    let opened = await openMenu(user);
    const disabled = (name: string) =>
      within(opened).getByRole('menuitem', { name }).getAttribute('aria-disabled');
    expect(disabled('Clear')).toBeNull();
    expect(disabled('Reset')).toBe('true');
    expect(disabled('Set to default')).toBe('true');
    expect(disabled('Help')).toBeNull();
    await user.keyboard('{Escape}');
    await user.clear(screen.getByRole('textbox'));
    opened = await openMenu(user);
    expect(disabled('Clear')).toBe('true');
    expect(disabled('Reset')).toBeNull();
  });

  it('UIC-FIELD-6.2 draws no menu for an empty list and keeps the browser menu', () => {
    const { container } = render(<TextField description="Seasonal" menu={[]} />);
    expect(fireEvent.contextMenu(screen.getByRole('textbox'))).toBe(true);
    expect(fireEvent.contextMenu(screen.getByText('Seasonal'))).toBe(true);
    // The field renders its root alone: no menu machinery beside it.
    expect(container.children).toHaveLength(1);
  });

  it('UIC-FIELD-1.7 keeps a read-only menu with value actions disabled and refuses a disabled one', async () => {
    const user = userEvent.setup();
    const options = { value: 'Fig', committedValue: 'Pear', defaultValue: 'Apple', emptyValue: '' };
    const { rerender } = render(
      <TextField options={{ ...options, isReadOnly: true }} menu={menu} />,
    );
    const opened = await openMenu(user);
    for (const name of ['Clear', 'Reset', 'Set to default']) {
      expect(within(opened).getByRole('menuitem', { name })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    }
    expect(within(opened).getByRole('menuitem', { name: 'Help' })).not.toHaveAttribute(
      'aria-disabled',
    );
    await user.keyboard('{Escape}');
    rerender(<TextField options={{ ...options, isDisabled: true }} menu={menu} />);
    expect(fireEvent.contextMenu(screen.getByText('Fruit'))).toBe(true);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('UIC-FIELD-6.3 opens as the context menu of the whole field and from the keyboard', async () => {
    const user = userEvent.setup();
    render(<TextField options={{ defaultValue: 'Fig' }} menu={menu} description="Seasonal" />);
    expect(fireEvent.contextMenu(screen.getByText('Seasonal'), { clientX: 20, clientY: 30 })).toBe(
      false,
    );
    expect(screen.getByRole('menu', { name: 'Fruit actions' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Shift>}{F10}{/Shift}');
    expect(await screen.findByRole('menuitem', { name: 'Copy name' })).toHaveFocus();
  });

  it('UIC-FIELD-6.3 keeps the browser menu on the text of its control', async () => {
    const user = userEvent.setup();
    const { container } = render(<TextField options={{ defaultValue: 'Fig' }} menu={menu} />);
    const input = screen.getByRole('textbox');
    expect(fireEvent.contextMenu(input)).toBe(true);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(container.children).toHaveLength(1);
    await user.click(input);
    await user.keyboard('{Shift>}{F10}{/Shift}');
    expect(await screen.findByRole('menuitem', { name: 'Copy name' })).toHaveFocus();
  });

  it('UIC-FIELD-6.4 applies Clear, Reset and Set to default, keeps focus on the control and reports every entry', async () => {
    const user = userEvent.setup();
    const onMenuAction = vi.fn();
    render(
      <TextField
        options={{ committedValue: 'Fig', defaultValue: 'Apple', emptyValue: '' }}
        menu={menu}
        onMenuAction={onMenuAction}
      />,
    );
    const input = screen.getByRole('textbox');
    const choose = async (name: string) =>
      user.click(within(await openMenu(user)).getByRole('menuitem', { name }));
    // Opened from outside the field, the menu returns focus to the control.
    fireEvent.contextMenu(screen.getByText('Fruit'));
    await user.click(await screen.findByRole('menuitem', { name: 'Clear' }));
    expect(input).toHaveValue('');
    await waitFor(() => expect(input).toHaveFocus());
    expect(onMenuAction).toHaveBeenLastCalledWith('clear');
    // Reset puts back the committed value, which differs from the default.
    await choose('Reset');
    expect(input).toHaveValue('Fig');
    await waitFor(() => expect(input).toHaveFocus());
    expect(onMenuAction).toHaveBeenLastCalledWith('reset');
    await choose('Set to default');
    expect(input).toHaveValue('Apple');
    expect(onMenuAction).toHaveBeenLastCalledWith('set-default');
    await choose('Help');
    expect(onMenuAction).toHaveBeenLastCalledWith('help');
    await choose('Copy name');
    expect(onMenuAction).toHaveBeenLastCalledWith('copy');
    expect(input).toHaveValue('Apple');
  });
});
