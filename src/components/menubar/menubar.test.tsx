import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { I18nProvider, type Selection } from '../../primitives/index.js';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { actionKeys } from '../../../test/menu-fixtures.js';
import { MenuItem, MenuSection, type MenuEntry } from '../menu/menu.js';
import { Menubar, MenubarMenu, type MenubarProps } from './menubar.js';

const fileEntries: MenuEntry[] = [
  { id: 'new', label: 'New', shortcut: 'Ctrl+N' },
  { id: 'open', label: 'Open recent', items: [{ id: 'report', label: 'Report.pdf' }] },
  { type: 'separator', id: 'rule' },
  { id: 'close', label: 'Close' },
];
const editEntries: MenuEntry[] = [
  { id: 'undo', label: 'Undo' },
  { id: 'redo', label: 'Redo', isDisabled: true },
  { id: 'cut', label: 'Cut' },
];
const viewEntries: MenuEntry[] = [
  {
    type: 'section',
    id: 'panels',
    title: 'Panels',
    selectionMode: 'multiple',
    defaultSelectedKeys: ['ruler'],
    items: [
      { id: 'ruler', label: 'Ruler' },
      { id: 'grid', label: 'Grid' },
    ],
  },
];

function Bar({ onAction, ...props }: MenubarProps & { onAction?: (key: unknown) => void }) {
  return (
    <>
      <button type="button">Before</button>
      <Menubar aria-label="Editor" {...props}>
        <MenubarMenu label="File" items={fileEntries} onAction={onAction} />
        <MenubarMenu label="Edit" items={editEntries} onAction={onAction} />
        <MenubarMenu label="View" items={viewEntries} onAction={onAction} />
      </Menubar>
      <button type="button">After</button>
    </>
  );
}

function top(name: string) {
  return within(screen.getByRole('menubar')).getByRole('menuitem', { name });
}

function openMenus() {
  return screen.queryAllByRole('menu');
}

async function focusBar(user: ReturnType<typeof userEvent.setup>) {
  screen.getByRole('button', { name: 'Before' }).focus();
  await user.tab();
}

describe('Menubar', () => {
  it('UIC-MENUBAR-1.1 draws a named menubar of menu items that open menus', async () => {
    const user = userEvent.setup();
    render(<Bar />);
    const bar = screen.getByRole('menubar', { name: 'Editor' });
    expect(bar).toHaveAttribute('aria-orientation', 'horizontal');
    const items = within(bar).getAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual(['File', 'Edit', 'View']);
    expect(items[0]?.tagName).toBe('BUTTON');
    expect(items[0]).toHaveAttribute('aria-haspopup', 'true');
    expect(items[0]).toHaveAttribute('aria-expanded', 'false');
    await user.click(top('File'));
    const menu = screen.getByRole('menu', { name: 'File' });
    expect(top('File')).toHaveAttribute('aria-expanded', 'true');
    expect(top('File')).toHaveAttribute('aria-controls', menu.id);
  });

  it('UIC-MENUBAR-1.1 refuses a menubar menu outside a menubar', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<MenubarMenu label="File" items={fileEntries} />)).toThrow(
      'A MenubarMenu must be rendered inside a Menubar.',
    );
  });

  it.each(['xs', 'sm', 'md', 'lg'] as const)(
    'UIC-MENUBAR-1.2 publishes orientation and %s and sizes the menus',
    async (size) => {
      const user = userEvent.setup();
      render(<Bar orientation="vertical" size={size} />);
      const bar = screen.getByRole('menubar');
      expect(bar).toHaveAttribute('data-orientation', 'vertical');
      expect(bar).toHaveAttribute('aria-orientation', 'vertical');
      expect(bar).toHaveAttribute('data-size', size);
      expectHooksMatchSpec(document.body, 'MENUBAR');
      await user.click(top('Edit'));
      expect(screen.getByRole('menu', { name: 'Edit' })).toHaveAttribute(
        'data-size',
        size === 'xs' ? 'sm' : size,
      );
    },
  );

  it('UIC-MENUBAR-1.3 is one tab stop that remembers the item focused last', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Bar />);
    expect(top('File')).toHaveAttribute('tabindex', '0');
    expect(top('Edit')).toHaveAttribute('tabindex', '-1');
    await focusBar(user);
    expect(top('File')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(top('File')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
    await user.tab();
    expect(top('Edit')).toHaveFocus();
    expect(top('File')).toHaveAttribute('tabindex', '-1');
    rerender(
      <Menubar aria-label="Editor">
        <MenubarMenu label="File" items={fileEntries} />
        <MenubarMenu label="View" items={viewEntries} />
      </Menubar>,
    );
    expect(top('File')).toHaveAttribute('tabindex', '0');
  });

  it('UIC-MENUBAR-1.4 moves along a row with wrapping, Home and End', async () => {
    const user = userEvent.setup();
    render(<Bar />);
    await focusBar(user);
    await user.keyboard('{ArrowRight}');
    expect(top('Edit')).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(top('File')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(top('View')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(top('File')).toHaveFocus();
    await user.keyboard('{End}');
    expect(top('View')).toHaveFocus();
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(top('View')).toHaveFocus();
    expect(openMenus()).toHaveLength(0);
  });

  it('UIC-MENUBAR-1.4 moves along a column by Up and Down and a row right to left', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Bar orientation="vertical" />);
    await focusBar(user);
    await user.keyboard('{ArrowDown}');
    expect(top('Edit')).toHaveFocus();
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(top('View')).toHaveFocus();
    expect(openMenus()).toHaveLength(0);
    unmount();
    render(
      <I18nProvider locale="he-IL">
        <Bar />
      </I18nProvider>,
    );
    await focusBar(user);
    await user.keyboard('{ArrowLeft}');
    expect(top('Edit')).toHaveFocus();
  });

  it('UIC-MENUBAR-1.5 keeps the caller ref attached across renders', () => {
    const ref = vi.fn();
    const { rerender } = render(
      <Menubar aria-label="Editor" ref={ref}>
        <MenubarMenu label="File" items={fileEntries} />
      </Menubar>,
    );
    rerender(
      <Menubar aria-label="Editor" ref={ref} title="Main menus">
        <MenubarMenu label="File" items={fileEntries} />
      </Menubar>,
    );
    expect(ref.mock.calls).toEqual([[screen.getByRole('menubar')]]);
  });

  it('UIC-MENUBAR-1.5 carries its hooks and the caller attributes', async () => {
    const user = userEvent.setup();
    render(
      <Menubar
        aria-label="Editor"
        id="bar"
        className="host-bar"
        data-testid="bar"
        data-size="caller"
        title="Main menus"
      >
        <MenubarMenu
          label="File"
          items={fileEntries}
          id="file"
          className="host-item"
          data-kind="file"
        />
      </Menubar>,
    );
    const bar = screen.getByRole('menubar');
    expect(bar).toHaveClass('ui-menubar', 'host-bar');
    expect(bar).toHaveAttribute('id', 'bar');
    expect(bar).toHaveAttribute('title', 'Main menus');
    expect(bar).toHaveAttribute('data-testid', 'bar');
    expect(bar).toHaveAttribute('data-size', 'md');
    const file = top('File');
    expect(file).toHaveClass('ui-menubar__trigger', 'host-item');
    expect(file).toHaveAttribute('data-kind', 'file');
    expect(file).toHaveAttribute('id', 'file');
    await user.click(file);
    expect(file).toHaveAttribute('data-open', 'true');
    expect(file).toHaveAttribute('data-pressed', 'true');
    expectHooksMatchSpec(document.body, 'MENUBAR', {
      slots: 'all',
      callerAttributes: ['data-kind'],
    });
  });

  it('UIC-MENUBAR-2.1 opens a menu on its first or last item from the keyboard', async () => {
    const user = userEvent.setup();
    render(<Bar />);
    await focusBar(user);
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'New Control N' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(top('File')).toHaveFocus());
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Close' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(top('File')).toHaveFocus());
    await user.keyboard('{Enter}');
    expect(screen.getByRole('menuitem', { name: 'New Control N' })).toHaveFocus();
  });

  it('UIC-MENUBAR-2.1 opens a column menu with the forward arrow', async () => {
    const user = userEvent.setup();
    render(<Bar orientation="vertical" />);
    await focusBar(user);
    await user.keyboard('{ArrowDown}{ArrowRight}');
    expect(screen.getByRole('menuitem', { name: 'Undo' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(top('Edit')).toHaveFocus());
  });

  it('UIC-MENUBAR-2.2 passes from one open menu to the next and back', async () => {
    const user = userEvent.setup();
    render(<Bar />);
    await focusBar(user);
    await user.keyboard('{ArrowDown}{ArrowRight}');
    expect(screen.getByRole('menuitem', { name: 'Undo' })).toHaveFocus();
    expect(openMenus().map((menu) => menu.getAttribute('aria-labelledby'))).toEqual([
      top('Edit').id,
    ]);
    expect(top('Edit')).toHaveAttribute('tabindex', '0');
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('menuitem', { name: 'New Control N' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('menuitemcheckbox', { name: 'Ruler' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(top('View')).toHaveFocus());
  });

  it('UIC-MENUBAR-2.2 leaves submenu keys to the menu and passes on from a submenu', async () => {
    const user = userEvent.setup();
    render(<Bar />);
    await focusBar(user);
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}');
    expect(screen.getByRole('menuitem', { name: 'Report.pdf' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'Open recent' })).toHaveFocus(),
    );
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('menuitem', { name: 'Report.pdf' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Undo' })).toHaveFocus());
    expect(openMenus()).toHaveLength(1);
    await user.keyboard('{ArrowLeft}');
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'New Control N' })).toHaveFocus(),
    );
    expect(openMenus()).toHaveLength(1);
  });

  it('UIC-MENUBAR-2.3 runs an action, closes and returns focus to its item', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Bar onAction={onAction} />);
    await focusBar(user);
    await user.keyboard('{ArrowRight}{ArrowDown}{ArrowDown}{Enter}');
    expect(actionKeys(onAction)).toEqual(['cut']);
    expect(openMenus()).toHaveLength(0);
    await waitFor(() => expect(top('Edit')).toHaveFocus());
    await user.click(top('File'));
    await user.click(screen.getByRole('menuitem', { name: 'Close' }));
    expect(actionKeys(onAction)).toEqual(['cut', 'close']);
    await waitFor(() => expect(top('File')).toHaveFocus());
  });

  it('UIC-MENUBAR-2.3 closes on a press outside or a second press on its item', async () => {
    const user = userEvent.setup();
    render(<Bar />);
    await user.click(top('File'));
    expect(openMenus()).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'After' }));
    expect(openMenus()).toHaveLength(0);
    await user.click(top('Edit'));
    expect(openMenus()).toHaveLength(1);
    await user.click(top('Edit'));
    expect(openMenus()).toHaveLength(0);
  });

  it('UIC-MENUBAR-2.3 UIC-MENUBAR-2.4 opens on a press and switches menus as the pointer moves', async () => {
    const user = userEvent.setup();
    render(<Bar />);
    await user.hover(top('Edit'));
    expect(openMenus()).toHaveLength(0);
    await user.click(top('File'));
    expect(screen.getByRole('menu', { name: 'File' })).toBeInTheDocument();
    await user.hover(top('Edit'));
    const menus = openMenus();
    expect(menus).toHaveLength(1);
    expect(menus[0]).toHaveAccessibleName('Edit');
    expect(top('Edit')).toHaveAttribute('data-open', 'true');
    expect(top('File')).not.toHaveAttribute('data-open');
    await waitFor(() => expect(menus[0]).toHaveFocus());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(top('Edit')).toHaveFocus());
  });

  it('UIC-MENUBAR-2.5 draws menu content with selection, controlled or not, and keeps the page reachable', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [modes, setModes] = useState<Selection>(new Set(['light']));
      return (
        <>
          <Menubar aria-label="Editor">
            <MenubarMenu label="View" items={viewEntries} />
            <MenubarMenu label="Theme">
              <MenuSection
                title="Theme"
                selectionMode="single"
                selectedKeys={modes}
                onSelectionChange={setModes}
              >
                <MenuItem id="light">Light</MenuItem>
                <MenuItem id="dark">Dark</MenuItem>
              </MenuSection>
            </MenubarMenu>
          </Menubar>
          <output>{[...modes].join(',')}</output>
        </>
      );
    }
    render(<Controlled />);
    await user.click(top('View'));
    expect(screen.getByRole('group', { name: 'Panels' })).toBeInTheDocument();
    const grid = screen.getByRole('menuitemcheckbox', { name: 'Grid' });
    expect(screen.getByRole('menuitemcheckbox', { name: 'Ruler' })).toBeChecked();
    await user.click(grid);
    expect(grid).toBeChecked();
    expect(screen.getByRole('menubar')).not.toHaveAttribute('aria-hidden');
    const menubar = screen.getByRole('menubar');
    expect(menubar.closest('[inert]')).toBeNull();
    await user.keyboard('{Escape}');
    await user.click(top('Theme'));
    await user.click(screen.getByRole('menuitemradio', { name: 'Dark' }));
    expect(screen.getByRole('status')).toHaveTextContent('dark');
    expect(openMenus()).toHaveLength(0);
  });
});
