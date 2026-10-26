import { describe, expect, it } from 'vitest';
import { pivot, type PivotLayout, type PivotRow } from './pivot.js';
import { requireDefined } from './require-defined.js';

const sales = [
  { region: 'North', fruit: 'Apple', year: 2025, boxes: 10, price: 2 },
  { region: 'North', fruit: 'Pear', year: 2024, boxes: 4, price: 3 },
  { region: 'North', fruit: 'Apple', year: 2024, boxes: 6, price: 2.5 },
  { region: 'South', fruit: 'Apple', year: 2025, boxes: 8, price: 1.5 },
  { region: 'South', fruit: 'Plum', year: 2025, boxes: 'n/a', price: 4 },
  { region: '', fruit: 'Pear', year: 2025, boxes: 1, price: null },
];

const layout: PivotLayout = {
  rows: ['region', 'fruit'],
  columns: ['year'],
  values: [{ field: 'boxes' }],
};

const describeRows = (rows: readonly PivotRow[]): unknown[] =>
  rows.map((row) =>
    row.children.length > 0 ? { [String(row.value)]: describeRows(row.children) } : row.value,
  );

describe('pivot', () => {
  it('UIC-PIVOT-TABLE-1.1 groups rows by nested row fields and columns by column fields', () => {
    const result = pivot(sales, layout);
    expect(describeRows(result.rows)).toEqual([
      { North: ['Apple', 'Pear'] },
      { South: ['Apple', 'Plum'] },
      { null: ['Pear'] },
    ]);
    expect(result.columns).toEqual([
      { key: '[2024]', path: [2024] },
      { key: '[2025]', path: [2025] },
    ]);
    const north = requireDefined(result.rows[0]);
    expect(north).toMatchObject({
      key: '["North"]',
      field: 'region',
      value: 'North',
      path: ['North'],
    });
    expect(north.children[0]).toMatchObject({
      key: '["North","Apple"]',
      field: 'fruit',
      path: ['North', 'Apple'],
      cells: { '[2024]': [6], '[2025]': [10] },
      total: [16],
    });
    expect(requireDefined(north.children[1]).cells).toEqual({ '[2024]': [4] });
  });

  it('UIC-PIVOT-TABLE-1.1 orders keys numerically, naturally, false first and empty last', () => {
    const records = [
      { key: 'Item 10' },
      { key: 'item 9' },
      { key: undefined },
      { key: 3 },
      { key: 20 },
      { key: true },
      { key: false },
    ];
    const keys = pivot(records, { rows: ['key'], columns: [], values: [] }).rows.map(
      (row) => row.value,
    );
    expect(keys.slice(0, 2)).toEqual([3, 20]);
    expect(keys.at(-1)).toBeNull();
    expect(keys.indexOf(false)).toBeLessThan(keys.indexOf(true));
    expect(keys.indexOf('item 9')).toBeLessThan(keys.indexOf('Item 10'));
  });

  it('UIC-PIVOT-TABLE-1.1 reads NaN and infinite values as text, apart from the empty group', () => {
    const records = [
      { kind: null, n: 1 },
      { kind: NaN, n: 2 },
      { kind: Infinity, n: 3 },
      { kind: -Infinity, n: 4 },
    ];
    const result = pivot(records, {
      rows: ['kind'],
      columns: [],
      values: [{ field: 'n', aggregate: 'count' }],
    });
    expect(result.rows.map((row) => row.value)).toEqual(['-Infinity', 'Infinity', 'NaN', null]);
    expect(new Set(result.rows.map((row) => row.key)).size).toBe(4);
  });

  it('UIC-PIVOT-TABLE-1.2 aggregates a large group without a function-argument limit', () => {
    const records = Array.from({ length: 200_000 }, (_, value) => ({ value }));
    const result = pivot(records, {
      rows: [],
      columns: [],
      values: [
        { field: 'value', aggregate: 'min' },
        { field: 'value', aggregate: 'max' },
        { field: 'value', aggregate: 'average' },
      ],
    });
    expect(result.grandTotal).toEqual([0, 199_999, 99_999.5]);
  });

  it('UIC-PIVOT-TABLE-1.2 aggregates by sum, count, min, max, average or a function', () => {
    const result = pivot(sales, {
      rows: ['region'],
      columns: [],
      values: [
        { field: 'boxes', aggregate: 'sum' },
        { field: 'boxes', aggregate: 'count' },
        { field: 'price', aggregate: 'min' },
        { field: 'price', aggregate: 'max' },
        { field: 'price', aggregate: 'average' },
        { field: 'fruit', aggregate: (values) => new Set(values).size },
      ],
    });
    expect(result.columns).toEqual([{ key: '[]', path: [] }]);
    const [north, south, empty] = result.rows;
    expect(requireDefined(north).total).toEqual([20, 3, 2, 3, 2.5, 2]);
    expect(requireDefined(south).total).toEqual([8, 2, 1.5, 4, 2.75, 2]);
    expect(requireDefined(empty).total).toEqual([1, 1, null, null, null, 1]);
    expect(
      pivot([{ x: 'a' }], { rows: [], columns: [], values: [{ field: 'x' }] }).grandTotal,
    ).toEqual([null]);
  });

  it('UIC-PIVOT-TABLE-1.3 computes row, column and grand totals from the records', () => {
    const result = pivot(sales, {
      rows: ['region'],
      columns: ['year'],
      values: [{ field: 'price', aggregate: 'average' }],
    });
    expect(requireDefined(result.rows[0]).total).toEqual([2.5]);
    expect(result.totals).toEqual({ '[2024]': [2.75], '[2025]': [2.5] });
    expect(result.grandTotal).toEqual([2.6]);
    const empty = pivot([], layout);
    expect(empty).toEqual({ rows: [], columns: [], totals: {}, grandTotal: [null] });
  });
});
