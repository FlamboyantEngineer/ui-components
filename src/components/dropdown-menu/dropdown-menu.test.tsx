import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { MenuItem, MenuSection } from '../menu/menu.js';
import { DropdownMenu } from './dropdown-menu.js';

const items = [
  { id: 'cut', label: 'Cut' },
  { id: 'copy', label: 'Copy' },
  { id: 'paste', label: 'Paste', isDisabled: true },
];

describe('DropdownMenu', () => {
  it('UIC-DROPDOWN-MENU-1.1 draws a button with a start icon and a caret', () => {
    const { container, rerender } = render(
      <DropdownMenu label="Edit" icon="plus" variant="primary" size="sm" items={items} />,
    );
    const trigger = screen.getByRole('button', { name: 'Edit' });
    expect(trigger).toHaveClass('ui-button', 'ui-dropdown-menu');
    expect(trigger).toHaveAttribute('data-variant', 'primary');
    expect(trigger).toHaveAttribute('data-size', 'sm');
    expect(trigger.querySelector('.ui-button__start-icon')).toHaveAttribute('data-glyph', 'plus');
    const caret = trigger.querySelector('.ui-dropdown-menu__caret');
    expect(caret).toHaveAttribute('data-glyph', 'chevron-down');
    expect(caret?.closest('.ui-button__end-icon')).not.toBeNull();
    expectHooksMatchSpec(container, 'DROPDOWN-MENU', { slots: ['caret'] });

    rerender(<DropdownMenu label="Edit" showCaret={false} isDisabled items={items} />);
    expect(trigger.querySelector('.ui-dropdown-menu__caret')).toBeNull();
    expect(trigger).toHaveAttribute('data-variant', 'secondary');
    expect(trigger).toBeDisabled();
  });

  it('UIC-DROPDOWN-MENU-1.2 draws an icon button named by its label', () => {
    const { container, rerender } = render(
      <DropdownMenu label="More actions" iconOnly items={items} />,
    );
    const trigger = screen.getByRole('button', { name: 'More actions' });
    expect(trigger).toHaveClass('ui-icon-button', 'ui-dropdown-menu');
    expect(trigger).toHaveAttribute('data-variant', 'ghost');
    expect(trigger.querySelector('.ui-icon-button__icon')).toHaveAttribute('data-glyph', 'more');
    expect(trigger.querySelector('.ui-dropdown-menu__caret')).toBeNull();
    expectHooksMatchSpec(container, 'DROPDOWN-MENU');
    rerender(<DropdownMenu label="Options" iconOnly icon="more-vertical" items={items} />);
    expect(
      screen.getByRole('button', { name: 'Options' }).querySelector('.ui-icon-button__icon'),
    ).toHaveAttribute('data-glyph', 'more-vertical');
  });

  it('UIC-DROPDOWN-MENU-1.3 wires the popup attributes and publishes the open state', async () => {
    const user = userEvent.setup();
    render(<DropdownMenu label="Edit" items={items} />);
    const trigger = screen.getByRole('button', { name: 'Edit' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).not.toHaveAttribute('data-open');
    await user.click(trigger);
    const menu = screen.getByRole('menu', { name: 'Edit' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', menu.id);
    expect(trigger).toHaveAttribute('data-open', 'true');
    expectHooksMatchSpec(document.body, 'DROPDOWN-MENU', { slots: ['caret'] });
    await user.keyboard('{Escape}');
    expect(trigger).not.toHaveAttribute('data-open');
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toHaveFocus();
  });

  it('UIC-DROPDOWN-MENU-1.3 follows a controlled open state and names the menu', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender, unmount } = render(
      <DropdownMenu label="Edit" items={items} isOpen={false} onOpenChange={onOpenChange} />,
    );
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('menu')).toBeNull();
    rerender(
      <DropdownMenu
        label="Edit"
        items={items}
        isOpen
        onOpenChange={onOpenChange}
        aria-label="Clipboard"
      />,
    );
    expect(screen.getByRole('menu')).toHaveAccessibleName(expect.stringContaining('Clipboard'));
    unmount();
    render(<DropdownMenu label="Sort" items={items} defaultOpen />);
    expect(screen.getByRole('menu', { name: 'Sort' })).toBeInTheDocument();
  });

  it('UIC-DROPDOWN-MENU-1.4 passes menu props, children and the derived size to the menu', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onSelectionChange = vi.fn();
    const { unmount } = render(
      <DropdownMenu
        label="Edit"
        size="xs"
        items={items}
        onAction={onAction}
        placement="bottom end"
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('menu')).toHaveAttribute('data-size', 'sm');
    await user.click(screen.getByRole('menuitem', { name: 'Paste' }));
    await user.click(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(onAction.mock.calls.map((call) => call[0])).toEqual(['copy']);
    unmount();

    render(
      <DropdownMenu
        label="View"
        menuSize="lg"
        selectionMode="single"
        defaultSelectedKeys={['list']}
        onSelectionChange={onSelectionChange}
        disabledKeys={['table']}
      >
        <MenuSection title="Layout">
          <MenuItem id="list">List</MenuItem>
          <MenuItem id="grid">Grid</MenuItem>
          <MenuItem id="table">Table</MenuItem>
        </MenuSection>
      </DropdownMenu>,
    );
    await user.click(screen.getByRole('button', { name: 'View' }));
    expect(screen.getByRole('menu')).toHaveAttribute('data-size', 'lg');
    expect(screen.getByRole('menuitemradio', { name: 'List' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('menuitemradio', { name: 'Table' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(screen.getByRole('menuitemradio', { name: 'Grid' }));
    expect([...(onSelectionChange.mock.calls[0]?.[0] as Set<string>)]).toEqual(['grid']);
  });

  it('UIC-DROPDOWN-MENU-1.5 returns focus to the trigger after an action or an outside press', async () => {
    const user = userEvent.setup();
    render(<DropdownMenu label="Edit" items={items} />);
    const trigger = screen.getByRole('button', { name: 'Edit' });
    await user.click(trigger);
    await user.click(screen.getByRole('menuitem', { name: 'Cut' }));
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.click(trigger);
    await user.click(document.body);
    expect(screen.queryByRole('menu')).toBeNull();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('UIC-DROPDOWN-MENU-1.6 appends caller classes and forwards id, ref and data attributes', () => {
    const ref = createRef<HTMLButtonElement>();
    const { container } = render(
      <DropdownMenu
        label="Edit"
        items={items}
        className="caller"
        id="edit-menu"
        ref={ref}
        data-testid="probe"
        data-open="always"
      />,
    );
    const trigger = screen.getByTestId('probe');
    expect(trigger).toHaveClass('ui-button', 'ui-dropdown-menu', 'caller');
    expect(trigger).toHaveAttribute('id', 'edit-menu');
    expect(ref.current).toBe(trigger);
    expect(trigger).not.toHaveAttribute('data-open');
    expectHooksMatchSpec(container, 'DROPDOWN-MENU');
  });

  it('UIC-DROPDOWN-MENU-1.7 splits the trigger into an action and a chevron that opens the menu', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const onAction = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <DropdownMenu
        label="Save"
        icon="save"
        variant="primary"
        size="sm"
        items={[{ id: 'copy', label: 'Save a copy' }]}
        onPress={onPress}
        onAction={onAction}
        className="caller"
        id="save-action"
        ref={ref}
        data-purpose="save"
      />,
    );
    const group = screen.getByRole('group');
    expect(group).toHaveClass('ui-dropdown-menu', 'caller');
    expect(group).toHaveAttribute('data-split', 'true');
    expect(group).toHaveAttribute('data-purpose', 'save');
    const action = screen.getByRole('button', { name: 'Save' });
    const toggle = screen.getByRole('button', { name: 'More options' });
    expect(action).toHaveClass('ui-button', 'ui-dropdown-menu__action');
    expect(action).toHaveAttribute('id', 'save-action');
    expect(ref.current).toBe(action);
    expect(action).not.toHaveAttribute('aria-haspopup');
    expect(toggle).toHaveClass('ui-icon-button', 'ui-dropdown-menu__toggle');
    for (const button of [action, toggle]) {
      expect(button).toHaveAttribute('data-variant', 'primary');
      expect(button).toHaveAttribute('data-size', 'sm');
    }
    expectHooksMatchSpec(document.body, 'DROPDOWN-MENU', {
      slots: ['action', 'toggle'],
      callerAttributes: ['data-purpose'],
    });

    await user.click(action);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(group).toHaveAttribute('data-open', 'true');
    expect(screen.getByRole('menu', { name: 'More options' })).toHaveAttribute('data-size', 'sm');
    await user.click(screen.getByRole('menuitem', { name: 'Save a copy' }));
    expect(onAction.mock.calls[0]?.[0]).toBe('copy');
    expect(group).not.toHaveAttribute('data-open');
    await waitFor(() => expect(toggle).toHaveFocus());
  });

  it('UIC-DROPDOWN-MENU-1.7 disables both halves and follows a controlled open state', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <DropdownMenu label="Save" items={items} onPress={() => {}} isDisabled />,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'More options' })).toBeDisabled();
    rerender(
      <DropdownMenu
        label="Save"
        items={items}
        onPress={() => {}}
        isOpen
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('UIC-DROPDOWN-MENU-1.4 passes filterable to the menu', async () => {
    const user = userEvent.setup();
    render(<DropdownMenu label="Move to" filterable items={items} />);
    await user.click(screen.getByRole('button', { name: 'Move to' }));
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveFocus();
    await user.keyboard('co');
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Copy']);
  });
});
