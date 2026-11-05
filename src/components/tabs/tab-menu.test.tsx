import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { readMenuIcons } from '../../../test/menu-fixtures.js';
import { DeleteGlyph, StarGlyph } from '../../core/glyphs.js';
import type { Key, Orientation } from '../../core/props.js';
import { UiProvider } from '../../core/provider.js';
import type { MenuEntry } from '../menu/menu.js';
import { Tab, TabList, type TabListProps, Tabs } from './tabs.js';

const fruit = ['Apple', 'Banana', 'Cherry'];

function Fruit({
  orientation,
  disabledKeys,
  ...list
}: Partial<TabListProps> & { orientation?: Orientation; disabledKeys?: Key[] }) {
  return (
    <Tabs orientation={orientation} disabledKeys={disabledKeys}>
      <TabList aria-label="Fruit" {...list}>
        {fruit.map((name) => (
          <Tab key={name} id={name.toLowerCase()}>
            {name}
          </Tab>
        ))}
      </TabList>
    </Tabs>
  );
}

const tab = (name: string) => screen.getByRole('tab', { name });
const standard = (_key: Key, entries: readonly MenuEntry[]) => entries;
const menuItems = () =>
  within(screen.getByRole('menu'))
    .getAllByRole('menuitem')
    .map((item) => item.textContent);

beforeAll(() => {
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

// Menus driven by userEvent are slow in jsdom on a busy machine.
describe('Tab menu', { timeout: 15_000 }, () => {
  it('UIC-TABS-3.5 takes icons for the standard entries by action, keeping what they do', async () => {
    const onDuplicate = vi.fn();
    render(
      <Fruit
        getMenuItems={standard}
        onRename={vi.fn()}
        onDuplicate={onDuplicate}
        onReorder={vi.fn()}
        onRemove={vi.fn()}
        menuIcons={{ duplicate: StarGlyph, 'move-forward': null, delete: null }}
      />,
    );
    fireEvent.contextMenu(tab('Banana'));
    expect(readMenuIcons(screen.getByRole('menu'))).toEqual({
      Rename: 'edit',
      Duplicate: 'star',
      'Move left': 'arrow-left',
      'Move right': null,
      Delete: null,
    });
    await userEvent.click(screen.getByRole('menuitem', { name: 'Duplicate' }));
    expect(onDuplicate).toHaveBeenCalledWith('banana');
  });

  it('UIC-TABS-3.5 opens the standard entries of a tab on a secondary click', async () => {
    const onDuplicate = vi.fn();
    const onRemove = vi.fn();
    const onReorder = vi.fn();
    render(
      <Fruit
        getMenuItems={standard}
        onRename={vi.fn()}
        onDuplicate={onDuplicate}
        onReorder={onReorder}
        onRemove={onRemove}
      />,
    );
    const banana = tab('Banana');
    fireEvent.contextMenu(banana);
    expect(menuItems()).toEqual(['Rename', 'Duplicate', 'Move left', 'Move right', 'Delete']);
    expect(within(screen.getByRole('menu')).getAllByRole('separator')).toHaveLength(2);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Duplicate' }));
    expect(onDuplicate).toHaveBeenCalledWith('banana');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    // The click focused the tab, so the closing menu returns focus to it.
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    expect(banana).toHaveFocus();

    fireEvent.contextMenu(tab('Apple'));
    expect(screen.getByRole('menuitem', { name: 'Move left' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Move right' }));
    expect(onReorder).toHaveBeenCalledWith({
      key: 'apple',
      targetKey: 'banana',
      position: 'after',
    });

    fireEvent.contextMenu(tab('Cherry'));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onRemove).toHaveBeenCalledWith(new Set(['cherry']));
  });

  it('UIC-TABS-3.5 renames from the menu and opens it from the keyboard', async () => {
    render(<Fruit getMenuItems={standard} onRename={vi.fn()} />);
    await userEvent.tab();
    await userEvent.keyboard('{Shift>}{F10}{/Shift}');
    expect(menuItems()).toEqual(['Rename']);
    await userEvent.keyboard('{Enter}');
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    expect(screen.getByRole('textbox', { name: 'Rename Apple' })).toHaveFocus();
  });

  it('UIC-TABS-3.5 names the moves by direction in vertical and right-to-left lists', () => {
    const { unmount } = render(
      <Fruit orientation="vertical" getMenuItems={standard} onReorder={vi.fn()} />,
    );
    fireEvent.contextMenu(tab('Banana'));
    expect(menuItems()).toEqual(['Move up', 'Move down']);
    expect(
      screen.getByRole('menuitem', { name: 'Move up' }).querySelector('[data-glyph="arrow-up"]'),
    ).not.toBeNull();
    expect(
      screen
        .getByRole('menuitem', { name: 'Move down' })
        .querySelector('[data-glyph="arrow-down"]'),
    ).not.toBeNull();
    unmount();
    render(
      <UiProvider locale="he">
        <Fruit getMenuItems={standard} onReorder={vi.fn()} />
      </UiProvider>,
    );
    fireEvent.contextMenu(tab('Banana'));
    expect(menuItems()).toEqual(['Move right', 'Move left']);
    expect(
      screen
        .getByRole('menuitem', { name: 'Move right' })
        .querySelector('[data-glyph="arrow-right"]'),
    ).not.toBeNull();
    expect(
      screen
        .getByRole('menuitem', { name: 'Move left' })
        .querySelector('[data-glyph="arrow-left"]'),
    ).not.toBeNull();
  });

  it("UIC-TABS-3.5 shows the owner's entries, changed or added", async () => {
    const onAction = vi.fn();
    const getMenuItems = vi.fn((key: Key, entries: readonly MenuEntry[]) => [
      ...entries.map((entry) => (entry.id === 'delete' ? { ...entry, isDisabled: true } : entry)),
      { id: 'pin', label: `Pin ${String(key)}`, onAction },
    ]);
    render(<Fruit getMenuItems={getMenuItems} onRemove={vi.fn()} />);
    fireEvent.contextMenu(tab('Cherry'));
    expect(getMenuItems).toHaveBeenLastCalledWith('cherry', [
      expect.objectContaining({ id: 'delete', label: 'Delete', tone: 'danger', icon: DeleteGlyph }),
    ]);
    expect(menuItems()).toEqual(['Delete', 'Pin cherry']);
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Pin cherry' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('UIC-TABS-3.5 opens no menu without getMenuItems or on a disabled tab', () => {
    const onContextMenu = vi.fn();
    const { unmount } = render(
      <Tabs>
        <TabList aria-label="Fruit" onRemove={vi.fn()}>
          <Tab id="apple" onContextMenu={onContextMenu}>
            Apple
          </Tab>
        </TabList>
      </Tabs>,
    );
    expect(fireEvent.contextMenu(tab('Apple'))).toBe(true);
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    unmount();
    render(<Fruit getMenuItems={standard} onRemove={vi.fn()} disabledKeys={['banana']} />);
    fireEvent.contextMenu(tab('Banana'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('UIC-TABS-3.6 announces the keys the list takes on each tab', () => {
    const { unmount } = render(
      <Fruit onRemove={vi.fn()} onRename={vi.fn()} onReorder={vi.fn()} getMenuItems={standard} />,
    );
    expect(tab('Apple')).toHaveAttribute(
      'aria-keyshortcuts',
      'Delete F2 Alt+ArrowLeft Alt+ArrowRight Shift+F10',
    );
    unmount();
    render(<Fruit orientation="vertical" onReorder={vi.fn()} />);
    expect(tab('Apple')).toHaveAttribute('aria-keyshortcuts', 'Alt+ArrowUp Alt+ArrowDown');
  });
});
