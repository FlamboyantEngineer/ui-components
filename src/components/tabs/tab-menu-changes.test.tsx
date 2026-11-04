import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Key } from '../../core/props.js';
import type { MenuEntry } from '../menu/menu.js';
import { Tab, TabList, type TabListProps, Tabs } from './tabs.js';

interface ListOptions extends Partial<TabListProps> {
  isDisabled?: boolean;
  disabledKeys?: Key[];
  disabledTab?: string;
  ids?: string[];
}

const names: Record<string, string> = { apple: 'Apple', banana: 'Banana', cherry: 'Cherry' };
const standard = (_key: Key, entries: readonly MenuEntry[]) => entries;

function list({ isDisabled, disabledKeys, disabledTab, ids, ...props }: ListOptions) {
  const shown = ids ?? Object.keys(names);
  return (
    <Tabs isDisabled={isDisabled} disabledKeys={disabledKeys}>
      <TabList aria-label="Fruit" getMenuItems={standard} {...props}>
        {shown.map((id) => (
          <Tab key={id} id={id} isDisabled={id === disabledTab}>
            {names[id]}
          </Tab>
        ))}
      </TabList>
    </Tabs>
  );
}

const tab = (name: string) => screen.getByRole('tab', { name });

function openMenu(options: ListOptions, name = 'Apple') {
  const view = render(list(options));
  fireEvent.contextMenu(tab(name));
  expect(screen.getByRole('menu')).toBeInTheDocument();
  return (next: ListOptions) => view.rerender(list(next));
}

beforeAll(() => {
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

describe('An open tab menu as the list changes', { timeout: 15_000 }, () => {
  it.each<[string, ListOptions]>([
    ['every tab turns disabled', { isDisabled: true }],
    ['the tab joins disabledKeys', { disabledKeys: ['apple'] }],
    ['the tab turns disabled', { disabledTab: 'apple' }],
    ['the tab leaves', { ids: ['banana', 'cherry'] }],
    ['the list stops listing entries', { getMenuItems: undefined }],
  ])('UIC-TABS-3.9 closes the menu when %s', (_case, change) => {
    const onRemove = vi.fn();
    const rerender = openMenu({ onRemove });
    rerender({ onRemove, ...change });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('UIC-TABS-3.9 drops an action the list no longer takes and runs the current callback', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const onDuplicate = vi.fn();
    const rerender = openMenu({ onRemove: first, onDuplicate });
    rerender({ onRemove: first });
    expect(screen.queryByRole('menuitem', { name: 'Duplicate' })).not.toBeInTheDocument();
    rerender({ onRemove: second });
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(new Set(['apple']));
  });

  it('UIC-TABS-3.9 moves the tab from the current order', async () => {
    const onReorder = vi.fn();
    const rerender = openMenu({ onReorder }, 'Banana');
    expect(screen.getByRole('menuitem', { name: 'Move left' })).not.toHaveAttribute(
      'aria-disabled',
    );
    rerender({ onReorder, ids: ['banana', 'apple', 'cherry'] });
    expect(screen.getByRole('menuitem', { name: 'Move left' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Move right' }));
    expect(onReorder).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'banana', targetKey: 'apple', position: 'after' }),
    );
  });

  it('UIC-TABS-3.9 keeps the menu open through an update that changes nothing it shows', () => {
    const onRemove = vi.fn();
    const rerender = openMenu({ onRemove });
    const menu = screen.getByRole('menu');
    rerender({ onRemove, disabledKeys: ['cherry'] });
    expect(screen.getByRole('menu')).toBe(menu);
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
  });
});
