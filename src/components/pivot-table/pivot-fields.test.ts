import { describe, expect, it } from 'vitest';
import type { PivotLayout } from '../../utils/pivot.js';
import { requireDefined } from '../../utils/require-defined.js';
import { applyFieldMove, createFieldCards, setValueAggregate } from './pivot-fields.js';

const fields = [
  { id: 'region', label: 'Region' },
  { id: 'fruit', label: 'Fruit' },
  { id: 'year', label: 'Year' },
  { id: 'boxes', label: 'Boxes', aggregate: 'sum' as const },
  { id: 'price', label: 'Price' },
];

const layout: PivotLayout = {
  rows: ['region'],
  columns: ['year'],
  values: [{ field: 'boxes', aggregate: 'sum' }],
};

const zones = (next: PivotLayout) =>
  createFieldCards(fields, next).map((card) => `${card.zone}:${card.field.id}`);

describe('pivot field cards', () => {
  it('UIC-PIVOT-TABLE-3.2 lists unused fields, then the rows, columns and values in order', () => {
    const cards = createFieldCards(fields, layout);
    expect(cards.map((card) => card.id)).toEqual(['fruit', 'price', 'region', 'year', 'boxes']);
    expect(zones(layout)).toEqual([
      'fields:fruit',
      'fields:price',
      'rows:region',
      'columns:year',
      'values:boxes',
    ]);
    const twice = createFieldCards(fields, { ...layout, values: [{ field: 'region' }] });
    expect(twice.map((card) => card.id).slice(-2)).toEqual(['year', 'values:region:5']);
    expect(requireDefined(cards[4]).value).toEqual({
      index: 0,
      value: { field: 'boxes', aggregate: 'sum' },
    });
    expect(
      requireDefined(createFieldCards(fields, { rows: ['size'], columns: [], values: [] })[5])
        .field,
    ).toEqual({
      id: 'size',
      label: 'size',
    });
  });

  it('UIC-PIVOT-TABLE-3.3 moves fields between and within zones', () => {
    const move = (key: string, column: string, targetKey: string | null, position = 'before') =>
      applyFieldMove(layout, fields, {
        key,
        column,
        targetKey,
        position: position as 'before' | 'after',
      });
    expect(move('fruit', 'rows', 'region', 'after').rows).toEqual(['region', 'fruit']);
    expect(move('fruit', 'rows', 'region').rows).toEqual(['fruit', 'region']);
    expect(move('region', 'columns', null)).toMatchObject({
      rows: [],
      columns: ['year', 'region'],
    });
    expect(move('year', 'fields', null)).toMatchObject({ columns: [] });
    expect(zones(move('year', 'fields', null))).toContain('fields:year');
    expect(move('price', 'values', 'boxes').values).toEqual([
      { field: 'price', aggregate: 'count' },
      { field: 'boxes', aggregate: 'sum' },
    ]);
    expect(move('fruit', 'values', null).values.at(-1)).toEqual({
      field: 'fruit',
      aggregate: 'count',
    });
    expect(move('boxes', 'rows', null)).toEqual({
      rows: ['region', 'boxes'],
      columns: ['year'],
      values: [],
    });
    expect(move('boxes', 'fields', null).values).toEqual([]);
    expect(move('missing', 'rows', null)).toBe(layout);
  });

  it('UIC-PIVOT-TABLE-3.2 UIC-PIVOT-TABLE-3.3 keeps generated card ids distinct from field ids', () => {
    const offered = [
      { id: 'a', label: 'Amount' },
      { id: 'values:a:3', label: 'Other' },
      { id: 'values:a:3:1', label: 'Third' },
    ];
    const current: PivotLayout = { rows: ['a'], columns: [], values: [{ field: 'a' }] };
    const cards = createFieldCards(offered, current);
    expect(cards.map((card) => card.id)).toEqual([
      'values:a:3',
      'values:a:3:1',
      'a',
      'values:a:3:2',
    ]);
    const duplicate = requireDefined(cards.at(-1));
    const next = applyFieldMove(current, offered, {
      key: duplicate.id,
      column: 'columns',
      targetKey: null,
      position: 'after',
    });
    expect(next).toEqual({ rows: ['a'], columns: ['a'], values: [] });
    expect(createFieldCards(offered, next).find((card) => card.id === 'values:a:3')?.field.id).toBe(
      'values:a:3',
    );
  });

  it('UIC-PIVOT-TABLE-3.3 keeps a value moved within the values and drops a duplicate row field', () => {
    const two: PivotLayout = {
      rows: ['region'],
      columns: [],
      values: [{ field: 'boxes' }, { field: 'region', aggregate: 'count' }],
    };
    const next = applyFieldMove(two, fields, {
      key: 'values:region:5',
      column: 'values',
      targetKey: 'boxes',
      position: 'before',
    });
    expect(next.values).toEqual([{ field: 'region', aggregate: 'count' }, { field: 'boxes' }]);
    const dropped = applyFieldMove(two, fields, {
      key: 'values:region:5',
      column: 'rows',
      targetKey: null,
      position: 'after',
    });
    expect(dropped).toEqual({ rows: ['region'], columns: [], values: [{ field: 'boxes' }] });
  });

  it('UIC-PIVOT-TABLE-3.4 sets the aggregation of one value', () => {
    expect(setValueAggregate(layout, 0, 'average').values).toEqual([
      { field: 'boxes', aggregate: 'average' },
    ]);
  });
});
