import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from '../../../test/field-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { FieldMenuEntry } from './field.js';

const menu: FieldMenuEntry[] = [
  { id: 'copy', label: 'Copy name', icon: 'plus' },
  'clear',
  'set-default',
  'help',
];

async function openFromButton(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Fruit actions' }));
  return screen.findByRole('menu');
}

describe('Field menu', () => {
  it('UIC-FIELD-6.1 lists built-in and custom entries in the caller order', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TextField
        options={{ committedValue: 'Fig', defaultValue: 'Apple', emptyValue: '' }}
        menu={menu}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Fruit actions' });
    expect(trigger).toHaveClass('ui-field__menu', 'ui-dropdown-menu', 'ui-icon-button');
    expect(trigger.querySelector('[data-glyph="more"]')).not.toBeNull();
    expectHooksMatchSpec(container, 'FIELD', { slots: ['menu'] });
    const opened = await openFromButton(user);
    const items = within(opened).getAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Copy name',
      'Clear',
      'Set to default',
      'Help',
    ]);
    const glyphs = items.map((item) =>
      item.querySelector('[data-glyph]')?.getAttribute('data-glyph'),
    );
    expect(glyphs).toEqual(['plus', 'close', 'refresh', 'help']);
  });

  it('UIC-FIELD-6.2 disables Clear and Set to default when they have nothing to do', async () => {
    const user = userEvent.setup();
    render(
      <TextField
        options={{ value: 'Apple', defaultValue: 'Apple', isRequired: true, emptyValue: '' }}
        menu={menu}
      />,
    );
    const opened = await openFromButton(user);
    const disabled = (name: string) =>
      within(opened).getByRole('menuitem', { name }).getAttribute('aria-disabled');
    expect(disabled('Clear')).toBe('true');
    expect(disabled('Set to default')).toBe('true');
    expect(disabled('Help')).toBeNull();
    expect(disabled('Copy name')).toBeNull();
  });

  it('UIC-FIELD-6.2 draws no menu for an empty list and keeps the browser menu', () => {
    const { container } = render(<TextField />);
    expect(screen.queryByRole('button', { name: 'Fruit actions' })).toBeNull();
    expect(fireEvent.contextMenu(screen.getByRole('textbox'))).toBe(true);
    expect(container.querySelector('.ui-field__menu')).toBeNull();
  });

  it('UIC-FIELD-1.7 keeps a read-only menu with value actions disabled and refuses a disabled one', async () => {
    const user = userEvent.setup();
    const options = { value: 'Fig', defaultValue: 'Apple', emptyValue: '' };
    const { rerender } = render(
      <TextField options={{ ...options, isReadOnly: true }} menu={menu} />,
    );
    const opened = await openFromButton(user);
    expect(within(opened).getByRole('menuitem', { name: 'Clear' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(within(opened).getByRole('menuitem', { name: 'Set to default' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(within(opened).getByRole('menuitem', { name: 'Help' })).not.toHaveAttribute(
      'aria-disabled',
    );
    await user.keyboard('{Escape}');
    rerender(<TextField options={{ ...options, isDisabled: true }} menu={menu} />);
    expect(screen.getByRole('button', { name: 'Fruit actions' })).toBeDisabled();
    expect(fireEvent.contextMenu(screen.getByRole('textbox'))).toBe(true);
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

  it('UIC-FIELD-6.4 applies Clear and Set to default, then reports every chosen entry', async () => {
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
    await user.click(within(await openFromButton(user)).getByRole('menuitem', { name: 'Clear' }));
    expect(input).toHaveValue('');
    expect(onMenuAction).toHaveBeenLastCalledWith('clear');
    await user.click(
      within(await openFromButton(user)).getByRole('menuitem', { name: 'Set to default' }),
    );
    expect(input).toHaveValue('Apple');
    expect(onMenuAction).toHaveBeenLastCalledWith('set-default');
    await user.click(within(await openFromButton(user)).getByRole('menuitem', { name: 'Help' }));
    expect(onMenuAction).toHaveBeenLastCalledWith('help');
    fireEvent.contextMenu(input);
    await user.click(await screen.findByRole('menuitem', { name: 'Copy name' }));
    expect(onMenuAction).toHaveBeenLastCalledWith('copy');
    expect(input).toHaveValue('Apple');
  });
});
