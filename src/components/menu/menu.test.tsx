import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Autocomplete } from '../../primitives/index.js';
import { describe, expect, it, vi } from 'vitest';
import { MenuButton, actionKeys, fruitEntries, openMenu } from '../../../test/menu-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Button } from '../button/button.js';
import { TextMatch, TextMatchProvider } from '../text-match/text-match.js';
import {
  Menu,
  MenuItem,
  MenuPopover,
  MenuSection,
  MenuSeparator,
  MenuTrigger,
  SubmenuTrigger,
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
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('UIC-MENU-1.4 runs an action once, closes, and keeps disabled items inert', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onApple = vi.fn();
    const onBanana = vi.fn();
    const onApplePress = vi.fn();
    render(
      <MenuButton aria-label="Fruit" onAction={onAction}>
        <MenuItem id="apple" onAction={onApple} onPress={onApplePress}>
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
    expect(onApplePress).toHaveBeenCalledWith(expect.objectContaining({ pointerType: 'mouse' }));
    expect(actionKeys(onAction)).toEqual(['keep', 'apple']);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('UIC-MENU-1.4 reports submenu actions to the menu that opens them', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<MenuButton items={fruitEntries} aria-label="Fruit" onAction={onAction} />);
    await openMenu(user);
    await user.keyboard('{End}{ArrowRight}{Enter}');
    expect(actionKeys(onAction)).toEqual(['cherry']);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
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
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
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
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('UIC-COLLECTIONS-1.1 UIC-COLLECTIONS-1.2 UIC-COLLECTIONS-1.4 renders virtualized and loads more from props', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100);
    const reportInView = stubIntersections();
    const cities: MenuEntry[] = Array.from({ length: 500 }, (_, index) => ({
      id: index,
      label: `City ${index}`,
    }));
    const onLoadMore = vi.fn();
    const user = userEvent.setup();
    render(
      <Menu
        aria-label="Cities"
        items={cities}
        virtualized
        rowHeight={25}
        onLoadMore={onLoadMore}
        isLoading={false}
      />,
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

    reportInView();
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('UIC-COLLECTIONS-1.4 sizes virtualized rows by the menu size unless rowHeight is given', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(112);
    const entries: MenuEntry[] = Array.from({ length: 100 }, (_, index) => ({
      id: index,
      label: `City ${index}`,
    }));
    const { unmount } = render(<Menu aria-label="Cities" items={entries} virtualized size="md" />);
    const md = screen.getAllByRole('menuitem').length;
    unmount();
    render(<Menu aria-label="Cities" items={entries} virtualized size="md" rowHeight={56} />);
    const tall = screen.getAllByRole('menuitem').length;
    expect(tall).toBeLessThan(md);
    vi.restoreAllMocks();
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
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
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

  it('UIC-MENU-5.4 marks the text typed in its own search field in data labels', async () => {
    const user = userEvent.setup();
    render(<MenuButton items={cityEntries} filterable highlightMatches aria-label="Cities" />);
    await openMenu(user);
    await user.keyboard('LI');
    const marks = [...document.querySelectorAll('mark.ui-text-match')];
    expect(marks.map((mark) => mark.textContent)).toEqual(['Li', 'Li']);
    expect(marks[0]).toHaveAttribute('data-term', '0');
    expect(marks[0]?.closest('.ui-menu-item__label')).not.toBeNull();
    expect(screen.getByRole('menuitem', { name: 'Lima' })).toHaveTextContent('Lima');
    expectHooksMatchSpec(document.body, 'MENU', { slots: ['search', 'search-input', 'label'] });
  });

  it('UIC-MENU-5.4 marks the text of an enclosing autocomplete in submenus and TextMatch children', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <Autocomplete defaultInputValue="li">
        <Menu aria-label="Places" highlightMatches>
          <MenuItem id="lima" textValue="Lima">
            <TextMatch>Lima</TextMatch>
          </MenuItem>
          <SubmenuTrigger>
            <MenuItem id="more">More</MenuItem>
            <MenuPopover>
              <Menu items={[{ id: 'lille', label: 'Lille' }]} />
            </MenuPopover>
          </SubmenuTrigger>
        </Menu>
      </Autocomplete>,
    );
    expect(screen.getByRole('menuitem', { name: 'Lima' }).querySelector('mark')).toHaveTextContent(
      'Li',
    );
    await user.click(screen.getByRole('menuitem', { name: 'More' }));
    const plainLille = screen.getByRole('menuitem', { name: 'Lille' });
    expect(plainLille).toHaveTextContent('Lille');
    expect(plainLille.querySelector('mark')).toBeNull();
    unmount();
    render(
      <Autocomplete defaultInputValue="li">
        <Menu
          aria-label="Data places"
          highlightMatches
          items={[{ id: 'more', label: 'More', items: [{ id: 'lille', label: 'Lille' }] }]}
        />
      </Autocomplete>,
    );
    await user.click(screen.getByRole('menuitem', { name: 'More' }));
    const lille = screen.getByRole('menuitem', { name: 'Lille' });
    expect(lille.querySelector('mark')).toHaveTextContent('Li');
  });

  it('UIC-MENU-5.4 keeps labels plain without highlightMatches, even under a TextMatchProvider', () => {
    render(
      <TextMatchProvider query="li">
        <Menu aria-label="Cities" items={cityEntries} />
      </TextMatchProvider>,
    );
    expect(document.querySelector('mark')).toBeNull();
    expect(screen.getByRole('menuitem', { name: 'Lima' })).toHaveTextContent('Lima');
  });

  it('UIC-MENU-5.3 renders a long data menu virtualized, reaching every item by keyboard', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100);
    const user = userEvent.setup();
    const entries: MenuEntry[] = Array.from({ length: 1000 }, (_, index) => ({
      id: index,
      label: `City ${index}`,
    }));
    render(<Menu aria-label="Cities" items={entries} virtualized rowHeight={25} />);
    expect(screen.getByRole('menu')).toHaveAttribute('data-virtualized', 'true');
    const rows = screen.getAllByRole('menuitem');
    expect(rows.length).toBeLessThan(20);
    expect(rows[0]).toHaveAttribute('aria-setsize', '1000');
    await user.tab();
    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'City 999' })).toHaveFocus();
    vi.restoreAllMocks();
  });
});
