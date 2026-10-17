import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { Selection } from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Tree, type TreeProps } from './tree.js';

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
