import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Collection, ListLayout, MenuLoadMoreItem, Virtualizer } from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import { MenuButton, actionKeys, fruitEntries, openMenu } from '../../../test/menu-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Button } from '../button/button.js';
import {
  Menu,
  MenuItem,
  MenuPopover,
  MenuSection,
  MenuSeparator,
  MenuTrigger,
  type MenuEntry,
} from './menu.js';

/** Stubs IntersectionObserver and returns a function that reports the first observed element in view. */
function stubIntersections() {
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
  return () =>
    act(() => report([{ isIntersecting: true, target: observed[0] } as never], {} as never));
}

const cityNames = ['Paris', 'Lima', 'Oslo', 'Lisbon', 'Cairo'];
const cityEntries: MenuEntry[] = cityNames.map((name) => ({ id: name.toLowerCase(), label: name }));

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

  it('UIC-MENU-5.1 filters the items from a search field that keeps focus', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<MenuButton items={cityEntries} filterable aria-label="Cities" onAction={onAction} />);
    await openMenu(user);
    const search = screen.getByRole('searchbox', { name: 'Search' });
    expect(search).toHaveFocus();
    expect(search).toHaveClass('ui-menu__search-input');
    expect(search.closest('.ui-menu__search')).not.toBeNull();
    expect(search).toHaveAttribute('placeholder', 'Search');
    await user.keyboard('li');
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Lima',
      'Lisbon',
    ]);
    expect(search).toHaveFocus();
    // The first match is highlighted as the reader types.
    await waitFor(() =>
      expect(search).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('menuitem', { name: 'Lima' }).id,
      ),
    );
    await user.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(search).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('menuitem', { name: 'Lisbon' }).id,
      ),
    );
    expectHooksMatchSpec(document.body, 'MENU', { slots: ['search', 'search-input'] });
    await user.keyboard('{Enter}');
    expect(actionKeys(onAction)).toEqual(['lisbon']);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('UIC-MENU-5.1 says when nothing matches and leaves a standalone menu unfocused', async () => {
    const user = userEvent.setup();
    render(<Menu items={cityEntries} filterable aria-label="Cities" />);
    const search = screen.getByRole('searchbox', { name: 'Search' });
    expect(search).not.toHaveFocus();
    await user.type(search, 'zz');
    expect(
      screen.queryAllByRole('menuitem').filter((row) => row.textContent !== 'No results'),
    ).toHaveLength(0);
    expect(document.querySelector('.ui-menu__empty')).toHaveTextContent('No results');
    expect(screen.getByRole('menu')).toHaveAttribute('data-empty', 'true');
    expectHooksMatchSpec(document.body, 'MENU', { slots: ['search', 'search-input', 'empty'] });
  });

  it('UIC-MENU-5.2 ends the items with a loading row and asks for more as it comes into view', () => {
    const reportInView = stubIntersections();
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <Menu aria-label="Cities" items={cityEntries} onLoadMore={onLoadMore} isLoading={false} />,
    );
    expect(document.querySelector('.ui-menu__load-more')).toBeNull();
    reportInView();
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    rerender(<Menu aria-label="Cities" items={cityEntries} onLoadMore={onLoadMore} isLoading />);
    const row = document.querySelector('.ui-menu__load-more');
    expect(row).toHaveTextContent('Loading');
    expect(row?.querySelector('.ui-menu__load-more-spinner')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(screen.getByRole('menu').lastElementChild).toBe(row);
    expectHooksMatchSpec(document.body, 'MENU', { slots: ['load-more', 'load-more-spinner'] });
    vi.unstubAllGlobals();
  });

  it('UIC-MENU-5.2 shows only the loading row while an empty menu loads', () => {
    stubIntersections();
    const { rerender } = render(
      <Menu aria-label="Cities" items={[]} isLoading renderEmptyState={() => 'Nothing yet'} />,
    );
    expect(screen.getByRole('menu')).toHaveAttribute('data-empty', 'true');
    expect(screen.getByRole('menu')).toHaveTextContent(/^\s*Loading$/);
    rerender(
      <Menu
        aria-label="Cities"
        items={[]}
        isLoading={false}
        renderEmptyState={() => 'Nothing yet'}
      />,
    );
    expect(screen.getByRole('menu')).toHaveTextContent('Nothing yet');
    vi.unstubAllGlobals();
  });

  it('UIC-MENU-5.3 renders a long data menu virtualized, reaching every item by keyboard', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100);
    const user = userEvent.setup();
    const entries: MenuEntry[] = Array.from({ length: 1000 }, (_, index) => ({
      id: index,
      label: `City ${index}`,
    }));
    render(
      <Virtualizer layout={ListLayout} layoutOptions={{ rowHeight: 25 }}>
        <Menu aria-label="Cities" items={entries} />
      </Virtualizer>,
    );
    const rows = screen.getAllByRole('menuitem');
    expect(rows.length).toBeLessThan(20);
    expect(rows[0]).toHaveAttribute('aria-setsize', '1000');
    await user.tab();
    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'City 999' })).toHaveFocus();
    vi.restoreAllMocks();
  });
});
