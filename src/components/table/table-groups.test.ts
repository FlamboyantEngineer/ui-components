import { describe, expect, it } from 'vitest';
import {
  aggregateCellValues,
  groupTableNodes,
  isGroupNode,
  listGroupKeys,
  listVisibleRows,
  resolveGroupings,
  type TableBodyNode,
} from './table-groups.js';
import type { TableColumn } from './table-rows.js';
import { buildTableNodes } from './table-tree.js';
import { walkTree } from '../../utils/walk-tree.js';

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
  it('UIC-TABLE-13.1 UIC-TABLE-13.5 allocates group keys around row ids and path delimiters', () => {
    const base = 'ui-table-group:a=x/b=y';
    const source = buildTableNodes(
      [
        { id: base, a: 'x', b: 'y' },
        { id: `${base}:1`, a: 'x/b=y', b: 'z' },
      ],
      undefined,
    );
    const grouped = groupTableNodes(
      source,
      [
        { id: 'a', label: 'A', getValue: (row) => row.a, direction: 'ascending' },
        { id: 'b', label: 'B', getValue: (row) => row.b, direction: 'ascending' },
      ],
      { locale: 'en-US', reservedKeys: [`${base}:2`] },
    );
    const keys = listGroupKeys(grouped);
    expect(new Set(keys).size).toBe(4);
    expect(keys).not.toContain(base);
    expect(keys).not.toContain(`${base}:1`);
    expect(keys).not.toContain(`${base}:2`);
    expect(keys).toContain(`${base}:3`);
    expect(keys).toContain('ui-table-group:a=x%2Fb%3Dy');
    expect(listVisibleRows(grouped, new Set(keys)).map((row) => row.id)).toEqual([
      base,
      `${base}:1`,
    ]);
  });

  it('UIC-TABLE-13.1 UIC-TABLE-13.5 keeps delimiter-like group paths stable through sorting and input reordering', () => {
    const source = buildTableNodes(
      [
        { id: 'first', a: 'x/b=y', b: 'z' },
        { id: 'second', a: 'x', b: 'y' },
        { id: 'third', a: 'x%2Fb%3Dy', b: 'z:1' },
      ],
      undefined,
    );
    const identify = (direction: 'ascending' | 'descending', reversed = false) => {
      const grouped = groupTableNodes(
        reversed ? [...source].reverse() : source,
        [
          { id: 'a', label: 'A', getValue: (row) => row.a, direction },
          { id: 'b', label: 'B', getValue: (row) => row.b, direction },
        ],
        { locale: 'en-US' },
      );
      const found = new Map<string, string>();
      for (const node of walkTree(grouped, (node) =>
        isGroupNode(node) ? node.children : undefined,
      )) {
        if (isGroupNode(node)) {
          found.set(JSON.stringify([node.group.level, node.group.value]), node.id);
        }
      }
      return found;
    };
    const initial = identify('ascending');
    expect(identify('descending')).toEqual(initial);
    expect(identify('ascending', true)).toEqual(initial);
    expect([...initial.values()]).toContain('ui-table-group:a=x%252Fb%253Dy');
    expect([...initial.values()]).toContain('ui-table-group:a=x%252Fb%253Dy/b=z%3A1');
  });

  it('UIC-TABLE-13.5 collects deep group keys and visible rows in reading order', () => {
    let node: TableBodyNode<{ id: number }> = { id: 20_000, row: { id: 20_000 }, children: [] };
    const expanded = new Set<string>();
    for (let index = 19_999; index >= 0; index -= 1) {
      const key = `group-${index}`;
      expanded.add(key);
      node = {
        id: key,
        group: { key, groupingId: 'kind', label: 'Kind', value: index, rows: [], level: index + 1 },
        children: [node],
      };
    }
    const keys = listGroupKeys([node]);
    expect(keys).toHaveLength(20_000);
    expect(keys[0]).toBe('group-0');
    expect(keys.at(-1)).toBe('group-19999');
    expect(listVisibleRows([node], expanded)).toEqual([{ id: 20_000 }]);
    expanded.delete('group-0');
    expect(listVisibleRows([node], expanded)).toEqual([]);
  });

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
    const tree = groupTableNodes(nodes, resolveGroupings(['kind'], columns, []), {
      locale: 'en-US',
    });
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
      { locale: 'en-US' },
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
  });

  it('UIC-TABLE-13.5 groups dates by day and leaves the nodes as they are without groupings', () => {
    const dated = buildTableNodes(
      [
        { id: 'x', at: new Date('2026-10-02T10:00:00Z') },
        { id: 'y', at: new Date('2026-10-02T18:00:00Z') },
      ],
      undefined,
    );
    const tree = groupTableNodes(
      dated,
      [{ id: 'at', label: 'At', getValue: (row) => row.at, direction: 'ascending' }],
      { locale: 'en-US' },
    );
    expect(tree.map((node) => node.id)).toEqual(['ui-table-group:at=2026-10-02']);
    expect(groupTableNodes(nodes, [], { locale: 'en-US' })).toBe(nodes);
  });

  it('UIC-TABLE-13.5 lists the visible rows inside expanded groups and rows', () => {
    const tree = groupTableNodes(nodes, resolveGroupings(['kind'], columns, []), {
      locale: 'en-US',
    });
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

describe('table grouping by typed values', () => {
  interface Entry {
    id: string;
    code: string | number | boolean | Date | null;
    amount: number;
  }
  const entries: Entry[] = [
    { id: 'n1', code: 1, amount: 10 },
    { id: 's1', code: '1', amount: 20 },
    { id: 'bt', code: true, amount: 30 },
    { id: 'st', code: 'true', amount: 40 },
    { id: 'n1b', code: 1, amount: 5 },
  ];
  const grouping = resolveGroupings<Entry>(
    [{ id: 'code', label: 'Code', getValue: (row) => row.code }],
    [],
    [],
  );
  const groupsOf = (rows: readonly Entry[]) =>
    groupTableNodes(buildTableNodes(rows, undefined), grouping, { locale: 'en-US' }).filter(
      isGroupNode,
    );
  const summary = (rows: readonly Entry[]) =>
    groupsOf(rows).map(({ group }) => ({
      key: group.key,
      value: group.value,
      rows: group.rows.map((row) => row.id),
      sum: aggregateCellValues(
        group.rows.map((row) => row.amount),
        'sum',
      ),
    }));

  it('UIC-TABLE-13.1 UIC-TABLE-13.5 keeps numbers, booleans and strings with the same text apart', () => {
    expect(summary(entries)).toEqual([
      { key: 'ui-table-group:code=1', value: '1', rows: ['s1'], sum: 20 },
      { key: 'ui-table-group:code=1:1', value: 1, rows: ['n1', 'n1b'], sum: 15 },
      { key: 'ui-table-group:code=true:1', value: true, rows: ['bt'], sum: 30 },
      { key: 'ui-table-group:code=true', value: 'true', rows: ['st'], sum: 40 },
    ]);
  });

  it('UIC-TABLE-13.1 UIC-TABLE-13.5 keeps typed group keys and order through row reordering', () => {
    const forward = summary(entries).map(({ key, rows }) => ({ key, rows }));
    const reversed = summary([...entries].reverse()).map(({ key, rows }) => ({
      key,
      rows: [...rows].reverse(),
    }));
    expect(reversed).toEqual(forward);
  });

  it('UIC-TABLE-13.5 still groups empty values together and dates by their day', () => {
    const mixed: Entry[] = [
      { id: 'null', code: null, amount: 1 },
      { id: 'blank', code: '', amount: 2 },
      { id: 'morning', code: new Date('2026-10-02T08:00:00Z'), amount: 3 },
      { id: 'evening', code: new Date('2026-10-02T20:00:00Z'), amount: 4 },
      { id: 'text', code: '2026-10-02', amount: 5 },
    ];
    expect(summary(mixed).map(({ key, rows }) => ({ key, rows }))).toEqual([
      { key: 'ui-table-group:code=2026-10-02', rows: ['text'] },
      { key: 'ui-table-group:code=2026-10-02:1', rows: ['morning', 'evening'] },
      { key: 'ui-table-group:code=', rows: ['null', 'blank'] },
    ]);
  });
});
