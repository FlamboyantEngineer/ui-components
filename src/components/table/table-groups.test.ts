import { describe, expect, it } from 'vitest';
import {
  aggregateCellValues,
  groupTableNodes,
  isGroupKey,
  isGroupNode,
  listGroupKeys,
  listVisibleRows,
  resolveGroupings,
  type TableBodyNode,
} from './table-groups.js';
import type { TableColumn } from './table-rows.js';
import { buildTableNodes } from './table-tree.js';

interface Item {
  id: string;
  kind: string | null;
  city: string;
  weight: number;
  children?: Item[];
}

const items: Item[] = [
  { id: 'a', kind: 'Fruit', city: 'Oslo', weight: 3 },
  { id: 'b', kind: 'Herb', city: 'Lima', weight: 1 },
  { id: 'c', kind: null, city: 'Oslo', weight: 5 },
  {
    id: 'd',
    kind: 'Fruit',
    city: 'Lima',
    weight: 2,
    children: [{ id: 'd1', kind: 'Fruit', city: 'Lima', weight: 9 }],
  },
];

const columns: TableColumn<Item>[] = [
  { id: 'kind', header: 'Kind' },
  { id: 'city', header: 'City' },
  { id: 'weight', header: 'Weight' },
];

const nodes = buildTableNodes(items, (row) => row.children);

function describe2(tree: readonly TableBodyNode<Item>[]): unknown[] {
  return tree.map((node) =>
    isGroupNode(node)
      ? { [node.id]: describe2(node.children), count: node.group.rows.length }
      : node.row.id,
  );
}

describe('table grouping helpers', () => {
  it('UIC-TABLE-13.5 resolves column ids and computed groupings, skipping unknown ids', () => {
    const groupings = resolveGroupings(
      ['city', 'missing', { id: 'heavy', label: 'Heavy', getValue: (row: Item) => row.weight > 2 }],
      columns,
      [{ column: 'city', direction: 'descending' }],
    );
    expect(groupings.map(({ id, label, direction }) => ({ id, label, direction }))).toEqual([
      { id: 'city', label: 'City', direction: 'descending' },
      { id: 'heavy', label: 'Heavy', direction: 'ascending' },
    ]);
    expect(groupings[0]?.getValue(items[0] as Item)).toBe('Oslo');
  });

  it('UIC-TABLE-13.1 UIC-TABLE-13.5 groups rows by value in order, empty values last, rows kept in order', () => {
    const tree = groupTableNodes(nodes, resolveGroupings(['kind'], columns, []));
    expect(describe2(tree)).toEqual([
      { 'ui-table-group:kind=Fruit': ['a', 'd'], count: 2 },
      { 'ui-table-group:kind=Herb': ['b'], count: 1 },
      { 'ui-table-group:kind=': ['c'], count: 1 },
    ]);
    const fruit = tree[0];
    expect(fruit && isGroupNode(fruit) ? fruit.group : null).toMatchObject({
      key: 'ui-table-group:kind=Fruit',
      groupingId: 'kind',
      label: 'Kind',
      value: 'Fruit',
      level: 1,
    });
  });

  it('UIC-TABLE-13.1 UIC-TABLE-13.5 nests groupings under unique path keys and follows the sort direction', () => {
    const tree = groupTableNodes(
      nodes,
      resolveGroupings(['city', 'kind'], columns, [{ column: 'city', direction: 'descending' }]),
    );
    expect(describe2(tree)).toEqual([
      {
        'ui-table-group:city=Oslo': [
          { 'ui-table-group:city=Oslo/kind=Fruit': ['a'], count: 1 },
          { 'ui-table-group:city=Oslo/kind=': ['c'], count: 1 },
        ],
        count: 2,
      },
      {
        'ui-table-group:city=Lima': [
          { 'ui-table-group:city=Lima/kind=Fruit': ['d'], count: 1 },
          { 'ui-table-group:city=Lima/kind=Herb': ['b'], count: 1 },
        ],
        count: 2,
      },
    ]);
    expect(listGroupKeys(tree)).toHaveLength(6);
    expect(isGroupKey('ui-table-group:city=Oslo')).toBe(true);
    expect(isGroupKey('a')).toBe(false);
  });

  it('UIC-TABLE-13.5 groups dates by day and leaves the nodes as they are without groupings', () => {
    const dated = buildTableNodes(
      [
        { id: 'x', at: new Date('2026-10-02T10:00:00Z') },
        { id: 'y', at: new Date('2026-10-02T18:00:00Z') },
      ],
      undefined,
    );
    const tree = groupTableNodes(dated, [
      { id: 'at', label: 'At', getValue: (row) => row.at, direction: 'ascending' },
    ]);
    expect(tree.map((node) => node.id)).toEqual(['ui-table-group:at=2026-10-02']);
    expect(groupTableNodes(nodes, [])).toBe(nodes);
  });

  it('UIC-TABLE-13.5 lists the visible rows inside expanded groups and rows', () => {
    const tree = groupTableNodes(nodes, resolveGroupings(['kind'], columns, []));
    const ids = (keys: string[]) => listVisibleRows(tree, new Set(keys)).map((row) => row.id);
    expect(ids(['ui-table-group:kind=Fruit'])).toEqual(['a', 'd']);
    expect(ids(['ui-table-group:kind=Fruit', 'd', 'ui-table-group:kind='])).toEqual([
      'a',
      'd',
      'd1',
      'c',
    ]);
    expect(ids([])).toEqual([]);
  });

  it('UIC-TABLE-13.5 aggregates a large group without a function-argument limit', () => {
    const values = Array.from({ length: 200_000 }, (_, index) => index - 100_000);
    expect(aggregateCellValues(values, 'min')).toBe(-100_000);
    expect(aggregateCellValues(values, 'max')).toBe(99_999);
    expect(aggregateCellValues(values, 'sum')).toBe(-100_000);
  });

  it('UIC-TABLE-13.3 UIC-TABLE-13.5 aggregates counts of values and sums, minimums and maximums of numbers', () => {
    const values = [3, '', null, 7, 'x', undefined, Number.NaN, -1];
    expect(aggregateCellValues(values, 'count')).toBe(5);
    expect(aggregateCellValues(values, 'sum')).toBe(9);
    expect(aggregateCellValues(values, 'min')).toBe(-1);
    expect(aggregateCellValues(values, 'max')).toBe(7);
    expect(aggregateCellValues(['a', null], 'sum')).toBeNull();
  });
});
