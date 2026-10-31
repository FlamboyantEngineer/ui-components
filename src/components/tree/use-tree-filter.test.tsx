import { render, renderHook, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Tree } from './tree.js';
import type { TreeProps } from './tree-props.js';
import { useTreeFilter } from './use-tree-filter.js';

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
      { id: 'pear', name: 'Pear', children: [{ id: 'conference', name: 'Conference pear' }] },
    ],
  },
  { id: 'vegetables', name: 'Vegetables', children: [{ id: 'kale', name: 'Kale' }] },
  { id: 'nuts', name: 'Nuts' },
];

function FoodTree(props: Partial<TreeProps<Food>>) {
  return <Tree aria-label="Food" items={FOOD} getTextValue={(item) => item.name} {...props} />;
}

const row = (label: string) => screen.getByRole('row', { name: label });
const rowNames = () =>
  screen.queryAllByRole('row').map((element) => element.getAttribute('aria-label'));

describe('Tree filtering', () => {
  it('UIC-TREE-6.1 filters deeply nested items in preorder without a recursive call stack', () => {
    let leaf: Food = { id: '19999', name: 'Match' };
    for (let index = 19998; index >= 0; index -= 1) {
      leaf = { id: String(index), name: String(index), children: [leaf] };
    }
    const visited: string[] = [];
    const { result } = renderHook(() =>
      useTreeFilter({
        items: [leaf],
        getChildren: (item) => item.children,
        getTextValue: (item) => item.name,
        filterText: 'Match',
        filter: (text, query) => {
          visited.push(text);
          return text === query;
        },
        expansion: { expandedKeys: new Set(), setExpandedKeys() {}, expand() {} },
      }),
    );
    expect(result.current.items).toEqual([leaf]);
    expect(result.current.expansion.expandedKeys.size).toBe(19999);
    expect(visited).toHaveLength(20000);
    expect(visited.slice(0, 3)).toEqual(['0', '1', '2']);
    expect(visited.at(-1)).toBe('Match');
    let current = requireDefined(result.current.items[0]);
    for (let index = 1; index < 20000; index += 1) {
      current = requireDefined(requireDefined(result.current.getChildren(current))[0]);
      expect(current.id).toBe(String(index));
    }
  });

  it('UIC-TREE-6.1 shows matching rows with their ancestors opened and marks the text', () => {
    const { container, rerender } = render(<FoodTree filterText="ale" />);
    expect(rowNames()).toEqual(['Vegetables', 'Kale']);
    expect(row('Vegetables')).toHaveAttribute('aria-expanded', 'true');
    expect(row('Kale').querySelector('mark')).toHaveTextContent('ale');
    expectHooksMatchSpec(container, 'TREE', { slots: ['label'] });

    rerender(<FoodTree filterText="pear" />);
    expect(rowNames()).toEqual(['Fruit', 'Pear', 'Conference pear']);

    rerender(<FoodTree filterText="  " />);
    expect(rowNames()).toEqual(['Fruit', 'Vegetables', 'Nuts']);
    expect(container.querySelector('mark')).toBeNull();
  });

  it('UIC-TREE-6.1 keeps a matching row whole and its own expansion apart from the reader’s', async () => {
    const { rerender } = render(
      <FoodTree defaultExpandedKeys={['vegetables']} filterText="fruit" />,
    );
    expect(rowNames()).toEqual(['Fruit']);
    expect(row('Fruit')).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(within(row('Fruit')).getByRole('button', { name: 'Expand Fruit' }));
    expect(rowNames()).toEqual(['Fruit', 'Apple', 'Pear']);

    rerender(<FoodTree defaultExpandedKeys={['vegetables']} filterText="" />);
    expect(rowNames()).toEqual(['Fruit', 'Vegetables', 'Kale', 'Nuts']);
  });

  it('UIC-TREE-6.1 matches through the caller’s filter function', () => {
    render(
      <FoodTree
        filterText="N"
        filter={(text, query) => text.startsWith(query)}
        renderLabel={(item) => <b>{item.name}</b>}
      />,
    );
    expect(rowNames()).toEqual(['Nuts']);
  });
});
