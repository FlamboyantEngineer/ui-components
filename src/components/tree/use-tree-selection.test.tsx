import { act, render, renderHook, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Selection } from '../../core/props.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Tree } from './tree.js';
import type { TreeProps } from './tree-props.js';
import { useTreeSelection } from './use-tree-selection.js';

interface Food {
  id: string;
  name: string;
  children?: Food[];
}

const FOOD: Food[] = [
  {
    id: 'fruit',
    name: 'Fruit',
    children: [
      { id: 'apple', name: 'Apple' },
      { id: 'pear', name: 'Pear' },
    ],
  },
  { id: 'vegetables', name: 'Vegetables', children: [{ id: 'kale', name: 'Kale' }] },
  { id: 'nuts', name: 'Nuts' },
];

function FoodTree(props: Partial<TreeProps<Food>>) {
  return (
    <Tree
      aria-label="Food"
      items={FOOD}
      getTextValue={(item) => item.name}
      defaultExpandedKeys={['fruit', 'vegetables']}
      {...props}
    />
  );
}

const row = (label: string) => screen.getByRole('row', { name: label });
const box = (label: string) => within(row(label)).getByRole('checkbox');
const selectedRows = () =>
  screen
    .queryAllByRole('row')
    .filter((element) => element.getAttribute('aria-selected') === 'true')
    .map((element) => element.getAttribute('aria-label'));

describe('Tree selection', () => {
  it('UIC-TREE-5.2 cascades and clears a deeply nested loaded selection without recursion', () => {
    let leaf: Food = { id: '19999', name: 'Leaf' };
    for (let index = 19998; index >= 0; index -= 1) {
      leaf = { id: String(index), name: String(index), children: [leaf] };
    }
    const onSelectionChange = vi.fn<(keys: Selection) => void>();
    const { result } = renderHook(() =>
      useTreeSelection({
        items: [leaf],
        getChildren: (item) => item.children,
        disabledKeys: undefined,
        selectionMode: 'multiple',
        selectionPropagation: true,
        onSelectionChange,
      }),
    );
    act(() => result.current.props.onSelectionChange?.(new Set(['19999'])));
    const selected = requireDefined(onSelectionChange.mock.lastCall)[0] as Set<string>;
    expect(selected.size).toBe(20000);
    expect(selected.has('0')).toBe(true);
    const clearedRoot = new Set(selected);
    clearedRoot.delete('0');
    act(() => result.current.props.onSelectionChange?.(clearedRoot));
    expect(requireDefined(onSelectionChange.mock.lastCall)[0]).toEqual(new Set());
  });

  it('UIC-TREE-5.2 selects children that load under a selected branch', () => {
    const onSelectionChange = vi.fn<(keys: Selection) => void>();
    const unloaded: Food[] = [
      { id: 'docs', name: 'Docs' },
      { id: 'other', name: 'Other' },
    ];
    const loaded: Food[] = [
      {
        id: 'docs',
        name: 'Docs',
        children: [
          { id: 'a', name: 'A' },
          { id: 'b', name: 'B' },
        ],
      },
      { id: 'other', name: 'Other' },
    ];
    const { result, rerender } = renderHook(
      ({ items }: { items: Food[] }) =>
        useTreeSelection({
          items,
          getChildren: (item) => item.children,
          disabledKeys: undefined,
          selectionMode: 'multiple',
          selectionPropagation: true,
          onSelectionChange,
        }),
      { initialProps: { items: unloaded } },
    );
    act(() => result.current.props.onSelectionChange?.(new Set(['docs'])));
    rerender({ items: loaded });
    expect(result.current.props.selectedKeys).toEqual(new Set(['docs', 'a', 'b']));
    act(() => result.current.props.onSelectionChange?.(new Set(['docs', 'a', 'b', 'other'])));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['docs', 'a', 'b', 'other']));
  });

  it('UIC-TREE-5.2 marks deeply nested partial selections without changing controlled keys', () => {
    let leaf: Food = { id: '19999', name: 'Leaf' };
    for (let index = 19998; index >= 0; index -= 1) {
      leaf = { id: String(index), name: String(index), children: [leaf] };
    }
    const selectedKeys = new Set(['19999']);
    const { result } = renderHook(() =>
      useTreeSelection({
        items: [leaf],
        getChildren: (item) => item.children,
        disabledKeys: undefined,
        selectedKeys,
        selectionMode: 'multiple',
        selectionPropagation: true,
      }),
    );
    expect(result.current.isIndeterminate('0')).toBe(true);
    expect(result.current.isIndeterminate('19998')).toBe(true);
    expect(result.current.isIndeterminate('19999')).toBe(false);
    expect(selectedKeys).toEqual(new Set(['19999']));
  });

  it('UIC-TREE-5.1 draws a selection checkbox in each row while the tree selects', async () => {
    const { container, rerender } = render(<FoodTree selectionMode="multiple" checkboxSelection />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(6);
    const checkbox = row('Apple').querySelector('.ui-tree__checkbox');
    expect(checkbox).toHaveClass('ui-checkbox');
    expect(checkbox?.previousElementSibling).toHaveClass('ui-tree__expand-spacer');
    expectHooksMatchSpec(container, 'TREE', { slots: ['checkbox'] });
    await userEvent.click(box('Apple'));
    expect(row('Apple')).toHaveAttribute('aria-selected', 'true');
    expect(box('Apple')).toBeChecked();
    expect(row('Fruit')).toHaveAttribute('aria-selected', 'false');
    expect(row('Fruit')).not.toHaveAttribute('data-indeterminate');

    rerender(<FoodTree checkboxSelection />);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('UIC-TREE-5.2 cascades a selection through loaded descendants and marks partial branches', async () => {
    const onSelectionChange = vi.fn<(keys: Selection) => void>();
    render(
      <FoodTree
        selectionMode="multiple"
        checkboxSelection
        selectionPropagation
        onSelectionChange={onSelectionChange}
      />,
    );
    await userEvent.click(box('Fruit'));
    expect(selectedRows()).toEqual(['Fruit', 'Apple', 'Pear']);

    await userEvent.click(box('Apple'));
    expect(selectedRows()).toEqual(['Pear']);
    expect(row('Fruit')).toHaveAttribute('data-indeterminate', 'true');
    expect(box('Fruit')).toBePartiallyChecked();

    await userEvent.click(box('Apple'));
    expect(selectedRows()).toEqual(['Fruit', 'Apple', 'Pear']);
    expect(row('Fruit')).not.toHaveAttribute('data-indeterminate');

    await userEvent.click(box('Kale'));
    expect(selectedRows()).toEqual(['Fruit', 'Apple', 'Pear', 'Vegetables', 'Kale']);
    expect([...(onSelectionChange.mock.lastCall?.[0] as Set<string>)].sort()).toEqual([
      'apple',
      'fruit',
      'kale',
      'pear',
      'vegetables',
    ]);

    await userEvent.click(box('Fruit'));
    expect(selectedRows()).toEqual(['Vegetables', 'Kale']);
  });

  it('UIC-TREE-5.2 selects one row without cascading in single selection', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn<(keys: Selection) => void>();
    render(
      <FoodTree
        selectionMode="single"
        selectionPropagation
        onSelectionChange={onSelectionChange}
      />,
    );
    await user.click(row('Fruit'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['fruit']));
    expect(selectedRows()).toEqual(['Fruit']);
    expect(row('Fruit')).not.toHaveAttribute('data-indeterminate');
  });

  it('UIC-TREE-5.2 follows a controlled selection and leaves disabled rows alone', async () => {
    const onSelectionChange = vi.fn<(keys: Selection) => void>();
    const { rerender } = render(
      <FoodTree
        selectionMode="multiple"
        checkboxSelection
        selectionPropagation
        selectedKeys={['apple']}
        disabledKeys={['pear']}
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(row('Fruit')).toHaveAttribute('data-indeterminate', 'true');
    await userEvent.click(box('Fruit'));
    const next = onSelectionChange.mock.lastCall?.[0] as Set<string>;
    expect([...next].sort()).toEqual(['apple', 'fruit']);
    expect(selectedRows()).toEqual(['Apple']);

    rerender(
      <FoodTree
        selectionMode="multiple"
        checkboxSelection
        selectionPropagation
        selectedKeys={next}
        disabledKeys={['pear']}
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(selectedRows()).toEqual(['Fruit', 'Apple']);
    expect(row('Fruit')).not.toHaveAttribute('data-indeterminate');
  });
});
