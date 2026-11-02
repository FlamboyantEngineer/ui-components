import { PlusGlyph, StarGlyph } from '../../core/glyphs.js';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from '../../../test/field-fixtures.js';
import { readMenuIcons } from '../../../test/menu-fixtures.js';
import type { FieldState } from './field-state.js';
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

/** The help tooltip, shown visually only: the help already describes its button or control. */
const helpTooltip = () => document.querySelector<HTMLElement>('.ui-field__help-tooltip');
const findHelpTooltip = () =>
  waitFor(() => {
    const tooltip = helpTooltip();
    if (!tooltip) throw new Error('no help tooltip');
    return tooltip;
  });

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

  it('UIC-FIELD-6.3 opens on the text of its control, keeping the caret and the draft', async () => {
    const user = userEvent.setup();
    const onState = vi.fn<(state: FieldState<string>) => void>();
    render(
      <TextField
        options={{ committedValue: 'Fig', defaultValue: 'Fig', emptyValue: '' }}
        menu={menu}
        onState={onState}
      />,
    );
    const input = screen.getByRole<HTMLInputElement>('textbox');
    await user.click(input);
    await user.keyboard('{End}s');
    input.setSelectionRange(1, 2);
    // A secondary click on the input's text opens the field menu, not the browser's.
    expect(fireEvent.contextMenu(input)).toBe(false);
    const opened = await screen.findByRole('menu', { name: 'Fruit actions' });
    expect(onState.mock.lastCall?.[0].isDirty).toBe(true);
    await user.keyboard('{Escape}');
    expect(opened).not.toBeInTheDocument();
    await waitFor(() => expect(input).toHaveFocus());
    expect(input).toHaveValue('Figs');
    expect([input.selectionStart, input.selectionEnd]).toEqual([1, 2]);
    // The unfinished draft stays uncommitted, so Reset still puts back the saved value.
    fireEvent.contextMenu(input);
    await user.click(await screen.findByRole('menuitem', { name: 'Reset' }));
    expect(input).toHaveValue('Fig');
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

  it('UIC-FIELD-6.5 offers Help once whenever the field has help, in default and custom menus', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TextField options={{ emptyValue: '' }} help="Pick a fruit" />);
    expect(names(await openMenu(user))).toEqual(['Clear', 'Reset', 'Help']);
    await user.keyboard('{Escape}');
    rerender(<TextField options={{ emptyValue: '' }} help="Pick a fruit" menu={menu} />);
    expect(names(await openMenu(user))).toEqual([
      'Copy name',
      'Clear',
      'Reset',
      'Set to default',
      'Help',
    ]);
    await user.keyboard('{Escape}');
    // A caller's own entry with the id `help` is Help: it is not added again.
    const ownHelp: FieldMenuEntry[] = [{ id: 'help', label: 'About this field' }];
    rerender(<TextField help="Pick a fruit" menu={ownHelp} />);
    expect(names(await openMenu(user))).toEqual(['About this field']);
    await user.keyboard('{Escape}');
    // An empty menu still offers the help.
    rerender(<TextField help="Pick a fruit" menu={[]} />);
    expect(names(await openMenu(user))).toEqual(['Help']);
    await user.keyboard('{Escape}');
    rerender(<TextField help="" menu={[]} />);
    await user.keyboard('{Shift>}{F10}{/Shift}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('UIC-FIELD-6.5 shows the help in a tooltip from Help by keyboard, until Escape', async () => {
    const user = userEvent.setup();
    const onMenuAction = vi.fn();
    render(<TextField help="Pick a fruit" onMenuAction={onMenuAction} />);
    const input = screen.getByRole('textbox');
    await openMenu(user);
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Help' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(input).toHaveFocus());
    // The focus coming back from the menu keeps it.
    expect(await findHelpTooltip()).toHaveTextContent('Pick a fruit');
    expect(onMenuAction).toHaveBeenLastCalledWith('help');
    await user.type(input, 'F');
    expect(helpTooltip()).not.toBeInTheDocument();
    await openMenu(user);
    await user.keyboard('{ArrowUp}{Enter}');
    await waitFor(() => expect(input).toHaveFocus());
    await findHelpTooltip();
    // Escape hides it and goes no further: the typed value stays.
    await user.keyboard('{Escape}');
    expect(helpTooltip()).not.toBeInTheDocument();
    expect(input).toHaveValue('F');
  });

  it('UIC-FIELD-6.5 shows the help from a pointer, against the control without a help button', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <>
        <TextField help="Pick a fruit" showHelpButton={false} />
        <button type="button">Elsewhere</button>
      </>,
    );
    const input = screen.getByRole('textbox');
    expect(screen.queryByRole('button', { name: /help/i })).not.toBeInTheDocument();
    // The help describes the control instead of a button.
    expect(input).toHaveAccessibleDescription('Pick a fruit');
    fireEvent.contextMenu(input);
    await user.click(await screen.findByRole('menuitem', { name: 'Help' }));
    const tooltip = await findHelpTooltip();
    expect(tooltip).toHaveTextContent('Pick a fruit');
    // New help shows in the open tooltip; help going away closes it and leaves the menu.
    rerender(
      <>
        <TextField help="Pick a ripe fruit" showHelpButton={false} />
        <button type="button">Elsewhere</button>
      </>,
    );
    expect(helpTooltip()).toHaveTextContent('Pick a ripe fruit');
    rerender(
      <>
        <TextField showHelpButton={false} />
        <button type="button">Elsewhere</button>
      </>,
    );
    expect(helpTooltip()).not.toBeInTheDocument();
    expect(input).not.toHaveAccessibleDescription();
    // A press anywhere hides it.
    rerender(
      <>
        <TextField help="Pick a fruit" />
        <button type="button">Elsewhere</button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Help for Fruit' })).toBeInTheDocument();
    fireEvent.contextMenu(input);
    await user.click(await screen.findByRole('menuitem', { name: 'Help' }));
    await findHelpTooltip();
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(helpTooltip()).not.toBeInTheDocument();
    expect(container.querySelector('.ui-field__help-tooltip')).toBeNull();
  });

  it('UIC-FIELD-6.5 offers Help in a read-only field and nothing in a disabled one', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TextField help="Pick a fruit" options={{ isReadOnly: true }} />);
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Help' }));
    expect(await findHelpTooltip()).toHaveTextContent('Pick a fruit');
    rerender(<TextField help="Pick a fruit" options={{ isDisabled: true }} />);
    expect(helpTooltip()).not.toBeInTheDocument();
    fireEvent.contextMenu(screen.getByRole('textbox'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

describe('Field menu icons', () => {
  it('UIC-FIELD-6.6 replaces and removes built-in icons, keeping their actions', async () => {
    const user = userEvent.setup();
    const onMenuAction = vi.fn();
    render(
      <TextField
        options={{ committedValue: 'Fig', defaultValue: 'Apple', emptyValue: '' }}
        menu={[{ id: 'copy', label: 'Copy name' }, 'clear', 'reset', 'set-default']}
        menuIcons={{ clear: StarGlyph, reset: null }}
        onMenuAction={onMenuAction}
      />,
    );
    const opened = await openMenu(user);
    expect(readMenuIcons(opened)).toEqual({
      'Copy name': null,
      Clear: 'star',
      Reset: null,
      'Set to default': 'refresh',
    });
    await user.click(within(opened).getByRole('menuitem', { name: 'Clear' }));
    expect(screen.getByRole('textbox')).toHaveValue('');
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveFocus());
    await user.click(within(await openMenu(user)).getByRole('menuitem', { name: 'Reset' }));
    expect(screen.getByRole('textbox')).toHaveValue('Fig');
    expect(onMenuAction.mock.calls).toEqual([['clear'], ['reset']]);
  });
});
