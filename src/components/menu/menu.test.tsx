import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Collection, ListLayout, MenuLoadMoreItem, Virtualizer } from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import { MenuButton, actionKeys, fruitEntries, openMenu } from '../../../test/menu-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Button } from '../button/button.js';
import { Menu, MenuItem, MenuPopover, MenuSection, MenuSeparator, MenuTrigger } from './menu.js';

describe('Menu', () => {
  it('UIC-MENU-1.1 draws entries from data like the matching children', async () => {
    const user = userEvent.setup();
    render(<MenuButton items={fruitEntries} aria-label="Fruit" />);
    const menu = await openMenu(user);
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual([
      expect.stringContaining('Apple'),
      'Banana',
      expect.stringContaining('Lemon'),
      'Lime',
      'More fruit',
    ]);
    expect(within(menu).getByRole('separator')).toHaveClass('ui-menu-separator');
    expect(within(menu).getByRole('group', { name: 'Citrus' })).toHaveClass('ui-menu-section');
    expect(screen.getByRole('menuitem', { name: 'More fruit' })).toHaveAttribute(
      'aria-haspopup',
      'menu',
    );
    expectHooksMatchSpec(document.body, 'MENU', {
      slots: ['icon', 'label', 'description', 'shortcut', 'submenu-indicator', 'header'],
    });
  });

  it('UIC-MENU-1.2 publishes the size, inherited by submenus and item icons', async () => {
    const user = userEvent.setup();
    render(<MenuButton items={fruitEntries} size="lg" aria-label="Fruit" />);
    const menu = await openMenu(user);
    expect(menu).toHaveAttribute('data-size', 'lg');
    expect(menu.querySelector('.ui-menu-item__icon')).toHaveAttribute('data-size', 'lg');
    await user.keyboard('{End}{ArrowRight}');
    const menus = screen.getAllByRole('menu');
    expect(menus).toHaveLength(2);
    expect(menus[1]).toHaveAttribute('data-size', 'lg');
    render(
      <Menu aria-label="Plain">
        <MenuItem>One</MenuItem>
      </Menu>,
    );
    expect(screen.getByRole('menu', { name: 'Plain' })).toHaveAttribute('data-size', 'md');
  });

  it('UIC-MENU-1.3 moves focus by keyboard, skipping disabled and pending items, with type-to-select', async () => {
    const user = userEvent.setup();
    render(
      <MenuButton aria-label="Fruit">
        <MenuItem id="apple">Apple</MenuItem>
        <MenuItem id="banana" isDisabled>
          Banana
        </MenuItem>
        <MenuItem id="loading" isPending>
          Loading
        </MenuItem>
        <MenuSeparator />
        <MenuSection title="More">
          <MenuItem id="cherry">Cherry</MenuItem>
          <MenuItem id="date">Date</MenuItem>
        </MenuSection>
      </MenuButton>,
    );
    screen.getByRole('button', { name: 'Actions' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: /^Apple/ })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Cherry' })).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: /^Apple/ })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Date' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('menuitem', { name: /^Apple/ })).toHaveFocus();
    await user.keyboard('c');
    expect(screen.getByRole('menuitem', { name: 'Cherry' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('UIC-MENU-1.4 runs an action once, closes, and keeps disabled items inert', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onApple = vi.fn();
    const onBanana = vi.fn();
    render(
      <MenuButton aria-label="Fruit" onAction={onAction}>
        <MenuItem id="apple" onAction={onApple}>
          Apple
        </MenuItem>
        <MenuItem id="banana" isDisabled onAction={onBanana}>
          Banana
        </MenuItem>
        <MenuItem id="keep" shouldCloseOnSelect={false}>
          Keep open
        </MenuItem>
        <MenuItem id="site" href="/fruit">
          Fruit site
        </MenuItem>
      </MenuButton>,
    );
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Banana' }));
    expect(onBanana).not.toHaveBeenCalled();
    await user.click(screen.getByRole('menuitem', { name: 'Keep open' }));
    expect(actionKeys(onAction)).toEqual(['keep']);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Fruit site' }).tagName).toBe('A');
    await user.click(screen.getByRole('menuitem', { name: /^Apple/ }));
    expect(onApple).toHaveBeenCalledTimes(1);
    expect(actionKeys(onAction)).toEqual(['keep', 'apple']);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('UIC-MENU-1.4 reports submenu actions to the menu that opens them', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<MenuButton items={fruitEntries} aria-label="Fruit" onAction={onAction} />);
    await openMenu(user);
    await user.keyboard('{End}{ArrowRight}{Enter}');
    expect(actionKeys(onAction)).toEqual(['cherry']);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('UIC-MENU-4.1 opens from its trigger with popup attributes and arrow keys', async () => {
    const user = userEvent.setup();
    render(<MenuButton items={fruitEntries} />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    trigger.focus();
    await user.keyboard('{ArrowUp}');
    const menu = screen.getByRole('menu', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', menu.id);
    expect(screen.getByRole('menuitem', { name: 'More fruit' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.keyboard('{Enter}');
    expect(screen.getByRole('menuitem', { name: /Apple/ })).toHaveFocus();
  });

  it('UIC-MENU-4.1 follows a controlled open state', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <MenuTrigger isOpen={false} onOpenChange={onOpenChange}>
        <Button>Actions</Button>
        <MenuPopover>
          <Menu items={fruitEntries} />
        </MenuPopover>
      </MenuTrigger>,
    );
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('menu')).toBeNull();
    rerender(
      <MenuTrigger isOpen onOpenChange={onOpenChange}>
        <Button>Actions</Button>
        <MenuPopover>
          <Menu items={fruitEntries} />
        </MenuPopover>
      </MenuTrigger>,
    );
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('UIC-MENU-4.2 returns focus to the trigger after an action, Escape or an outside press', async () => {
    const user = userEvent.setup();
    render(
      <>
        <MenuButton items={fruitEntries} aria-label="Fruit" />
        <button type="button">Elsewhere</button>
      </>,
    );
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: /^Lemon/ }));
    await waitFor(() => expect(trigger).toHaveFocus());
    await openMenu(user);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
    await openMenu(user);
    await user.click(document.body);
    expect(screen.queryByRole('menu')).toBeNull();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('UIC-COLLECTIONS-1.1 UIC-COLLECTIONS-1.2 renders virtualized and loads more through React Aria', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100);
    const observed: Element[] = [];
    let report: IntersectionObserverCallback = () => {};
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          report = callback;
        }
        observe(element: Element) {
          observed.push(element);
        }
        unobserve() {}
        disconnect() {}
      },
    );
    const cities = Array.from({ length: 500 }, (_, index) => ({
      id: index,
      name: `City ${index}`,
    }));
    const onLoadMore = vi.fn();
    const user = userEvent.setup();
    render(
      <Virtualizer layout={ListLayout} layoutOptions={{ rowHeight: 25 }}>
        <Menu aria-label="Cities">
          <Collection items={cities}>
            {(city) => <MenuItem id={city.id}>{city.name}</MenuItem>}
          </Collection>
          <MenuLoadMoreItem onLoadMore={onLoadMore} isLoading={false} />
        </Menu>
      </Virtualizer>,
    );
    const rows = screen.getAllByRole('menuitem');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(20);
    expect(rows[0]).toHaveClass('ui-menu-item');
    expect(rows[0]).toHaveAttribute('aria-setsize', '500');
    expect(screen.getByRole('menu')).toHaveClass('ui-menu');

    await user.tab();
    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'City 499' })).toHaveFocus();

    act(() => report([{ isIntersecting: true, target: observed[0] } as never], {} as never));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
