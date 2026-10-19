import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MenuButton, actionKeys, fruitEntries, openMenu } from '../../../test/menu-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Button } from '../button/button.js';
import {
  Menu,
  MenuItem,
  MenuPopover,
  MenuSection,
  MenuSeparator,
  MenuTrigger,
  type MenuItemRenderState,
} from './menu.js';

describe('MenuItem, MenuSection and MenuSeparator', () => {
  it('UIC-MENU-2.1 draws check, icon, label, description, shortcut and submenu arrow', async () => {
    const user = userEvent.setup();
    render(
      <MenuButton aria-label="Edit">
        <MenuItem id="copy" icon="plus" description="To the clipboard" shortcut="Ctrl+C">
          Copy
        </MenuItem>
        <MenuItem
          id="custom"
          icon={
            <svg aria-label="Dot">
              <circle r="2" />
            </svg>
          }
        >
          Custom icon
        </MenuItem>
      </MenuButton>,
    );
    await openMenu(user);
    const copy = screen.getByRole('menuitem', { name: /^Copy/ });
    expect(copy).toHaveAccessibleName('Copy To the clipboard Control C');
    expect(copy).not.toHaveAttribute('aria-labelledby');
    expect(copy).not.toHaveAttribute('aria-describedby');
    const parts = [...copy.children].map((child) => child.getAttribute('class'));
    expect(parts).toEqual([
      'ui-icon ui-menu-item__icon',
      'ui-menu-item__label',
      'ui-menu-item__description',
      'ui-shortcut ui-menu-item__shortcut',
    ]);
    expect(copy.querySelector('.ui-menu-item__check')).toBeNull();
    expect(screen.getByLabelText('Dot').parentElement).toHaveClass('ui-menu-item__icon');
    expectHooksMatchSpec(document.body, 'MENU', {
      slots: ['icon', 'label', 'description', 'shortcut'],
    });
  });

  it('UIC-MENU-2.1 points the submenu arrow in the reading direction', async () => {
    const user = userEvent.setup();
    render(
      <UiProvider locale="ar-EG">
        <MenuButton items={fruitEntries} aria-label="Fruit" />
      </UiProvider>,
    );
    await openMenu(user);
    const more = screen.getByRole('menuitem', { name: 'More fruit' });
    expect(more.querySelector('.ui-menu-item__submenu-indicator')).toHaveAttribute(
      'data-glyph',
      'chevron-left',
    );
  });

  it('UIC-MENU-2.2 draws custom content from a render function with the item state', async () => {
    const user = userEvent.setup();
    render(
      <MenuButton
        aria-label="Fruit"
        items={[
          {
            id: 'apple',
            label: 'Apple',
            renderContent: ({ isFocused }) => (
              <b title="Custom">{isFocused ? 'Focused' : 'Apple'}</b>
            ),
          },
          { id: 'pear', label: 'Pear' },
        ]}
      />,
    );
    screen.getByRole('button', { name: 'Actions' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByTitle('Custom')).toHaveTextContent('Focused');
    const custom = screen.getByTitle('Custom');
    expect(custom.parentElement?.querySelector('.ui-menu-item__label')).toBeNull();
    await user.keyboard('p');
    expect(screen.getByRole('menuitem', { name: 'Pear' })).toHaveFocus();
    expect(screen.getByTitle('Custom')).toHaveTextContent('Apple');
  });

  it('UIC-MENU-2.2 hands custom content the library item state only', () => {
    const states: MenuItemRenderState[] = [];
    render(
      <Menu aria-label="Fruit" selectionMode="single" selectedKeys={['apple']}>
        <MenuItem id="apple">
          {(state) => {
            states.push(state);
            return 'Apple';
          }}
        </MenuItem>
      </Menu>,
    );
    expect(Object.keys(states.at(-1) ?? {}).sort()).toEqual([
      'hasSubmenu',
      'isDisabled',
      'isFocusVisible',
      'isFocused',
      'isHovered',
      'isOpen',
      'isPressed',
      'isSelected',
      'selectionMode',
    ]);
    expect(states.at(-1)).toMatchObject({ isSelected: true, selectionMode: 'single' });
  });

  it('UIC-MENU-2.3 publishes the tone and keeps disabled items visible but inert', async () => {
    const user = userEvent.setup();
    render(<MenuButton items={fruitEntries} aria-label="Fruit" disabledKeys={['lemon']} />);
    await openMenu(user);
    expect(screen.getByRole('menuitem', { name: 'Lime' })).toHaveAttribute('data-tone', 'danger');
    expect(screen.getByRole('menuitem', { name: /^Apple/ })).toHaveAttribute(
      'data-tone',
      'neutral',
    );
    for (const name of [/^Banana/, /^Lemon/]) {
      const item = screen.getByRole('menuitem', { name });
      expect(item).toHaveAttribute('aria-disabled', 'true');
      expect(item).toHaveAttribute('data-disabled', 'true');
    }
    expectHooksMatchSpec(document.body, 'MENU');
  });

  it('UIC-MENU-2.4 draws pending placeholders and replaces them in the open menu', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const { rerender } = render(
      <MenuButton
        aria-label="Share"
        onAction={onAction}
        items={[
          { id: 'copy', label: 'Copy link' },
          { id: 'loading', label: 'Loading…', isPending: true, icon: 'plus' },
        ]}
      />,
    );
    await openMenu(user);
    const pending = screen.getByRole('menuitem', { name: 'Loading…' });
    expect(pending).toHaveAttribute('data-pending', 'true');
    expect(pending).toHaveAttribute('aria-disabled', 'true');
    expect(pending.querySelector('.ui-menu-item__spinner')).toHaveAttribute('aria-hidden', 'true');
    expect(pending.querySelector('.ui-menu-item__icon')).toBeNull();
    await user.click(pending);
    expect(onAction).not.toHaveBeenCalled();
    expectHooksMatchSpec(document.body, 'MENU', { slots: ['spinner'] });
    rerender(
      <MenuButton
        aria-label="Share"
        onAction={onAction}
        items={[
          { id: 'copy', label: 'Copy link' },
          { id: 'mail', label: 'Mail' },
        ]}
      />,
    );
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Loading…' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: 'Mail' }));
    expect(actionKeys(onAction)).toEqual(['mail']);
  });

  it('UIC-MENU-2.5 publishes hover, focus and press states', async () => {
    const user = userEvent.setup();
    render(<MenuButton items={fruitEntries} aria-label="Fruit" />);
    screen.getByRole('button', { name: 'Actions' }).focus();
    await user.keyboard('{ArrowDown}');
    const apple = screen.getByRole('menuitem', { name: /Apple/ });
    expect(apple).toHaveAttribute('data-focused', 'true');
    expect(apple).toHaveAttribute('data-focus-visible', 'true');
    const lemon = screen.getByRole('menuitem', { name: /^Lemon/ });
    await user.hover(lemon);
    expect(lemon).toHaveAttribute('data-hovered', 'true');
    await user.pointer({ keys: '[MouseLeft>]', target: lemon });
    expect(lemon).toHaveAttribute('data-pressed', 'true');
    expectHooksMatchSpec(document.body, 'MENU');
  });

  it('UIC-MENU-3.1 UIC-MENU-3.2 groups items under a titled section and separates them', () => {
    render(
      <Menu aria-label="Edit">
        <MenuSection title="Clipboard">
          <MenuItem>Cut</MenuItem>
        </MenuSection>
        <MenuSeparator data-testid="rule" />
        <MenuSection aria-label="History">
          <MenuItem>Undo</MenuItem>
        </MenuSection>
      </Menu>,
    );
    const group = screen.getByRole('group', { name: 'Clipboard' });
    expect(within(group).getByRole('menuitem', { name: 'Cut' })).toBeInTheDocument();
    expect(group.querySelector('.ui-menu-section__header')).toHaveTextContent('Clipboard');
    expect(screen.getByRole('group', { name: 'History' })).toBeInTheDocument();
    const rule = screen.getByRole('separator');
    expect(rule).toHaveAttribute('data-testid', 'rule');
    expect(rule).not.toHaveAttribute('tabindex');
    expectHooksMatchSpec(document.body, 'MENU', { slots: ['header'] });
  });

  it('UIC-MENU-3.3 checks single and multiple selections and keeps a multiple menu open', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <MenuButton aria-label="View">
        <MenuSection title="Sort" selectionMode="single" defaultSelectedKeys={['name']}>
          <MenuItem id="name">Name</MenuItem>
          <MenuItem id="date">Date</MenuItem>
        </MenuSection>
        <MenuSection title="Show" selectionMode="multiple" onSelectionChange={onSelectionChange}>
          <MenuItem id="hidden">Hidden files</MenuItem>
          <MenuItem id="size">Sizes</MenuItem>
        </MenuSection>
      </MenuButton>,
    );
    await openMenu(user);
    const name = screen.getByRole('menuitemradio', { name: 'Name' });
    expect(name).toBeChecked();
    expect(name).toHaveAttribute('data-selected', 'true');
    expect(name).toHaveAttribute('data-selection-mode', 'single');
    expect(name.querySelector('.ui-menu-item__check [data-glyph="check"]')).not.toBeNull();
    const date = screen.getByRole('menuitemradio', { name: 'Date' });
    expect(date.querySelector('.ui-menu-item__check')).toBeEmptyDOMElement();
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Hidden files' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitemcheckbox', { name: 'Hidden files' })).toBeChecked();
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect([...(onSelectionChange.mock.calls[0]?.[0] as Set<string>)]).toEqual(['hidden']);
    expectHooksMatchSpec(document.body, 'MENU', { slots: ['check', 'header'] });
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('UIC-MENU-3.3 takes a selection on a section described as data', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <MenuButton
        aria-label="Sort"
        items={[
          {
            type: 'section',
            id: 'sort',
            title: 'Sort by',
            selectionMode: 'single',
            defaultSelectedKeys: ['name'],
            onSelectionChange,
            items: [
              { id: 'name', label: 'Name' },
              { id: 'date', label: 'Date' },
            ],
          },
        ]}
      />,
    );
    await openMenu(user);
    expect(screen.getByRole('menuitemradio', { name: 'Name' })).toBeChecked();
    await user.click(screen.getByRole('menuitemradio', { name: 'Date' }));
    expect([...(onSelectionChange.mock.calls[0]?.[0] as Set<string>)]).toEqual(['date']);
  });

  it('UIC-MENU-4.6 appends caller classes and forwards data attributes', async () => {
    const user = userEvent.setup();
    render(
      <MenuTrigger>
        <Button>Actions</Button>
        <MenuPopover className="caller-popover" data-probe="popover">
          <Menu aria-label="Fruit" className="caller-menu" data-probe="menu" data-size="xl">
            <MenuSection className="caller-section" data-probe="section" title="All">
              <MenuItem className="caller-item" data-probe="item" data-tone="loud">
                Apple
              </MenuItem>
            </MenuSection>
            <MenuSeparator className="caller-rule" />
          </Menu>
        </MenuPopover>
      </MenuTrigger>,
    );
    await openMenu(user);
    const menu = screen.getByRole('menu', { name: 'Fruit' });
    const popover = menu.closest('.caller-popover');
    expect(popover).toHaveClass('ui-menu-popover', 'caller-popover');
    expect(popover).toHaveAttribute('data-probe', 'popover');
    expect(menu).toHaveClass('ui-menu', 'caller-menu');
    expect(menu).toHaveAttribute('data-size', 'md');
    expect(menu).toHaveAttribute('data-probe', 'menu');
    const section = screen.getByRole('group', { name: 'All' });
    expect(section).toHaveClass('ui-menu-section', 'caller-section');
    expect(section).toHaveAttribute('data-probe', 'section');
    const item = screen.getByRole('menuitem', { name: 'Apple' });
    expect(item).toHaveClass('ui-menu-item', 'caller-item');
    expect(item).toHaveAttribute('data-tone', 'neutral');
    expect(item).toHaveAttribute('data-probe', 'item');
    expect(screen.getByRole('separator')).toHaveClass('ui-menu-separator', 'caller-rule');
    expectHooksMatchSpec(document.body, 'MENU', {
      slots: ['header', 'label'],
      callerAttributes: ['data-probe'],
    });
  });
});
