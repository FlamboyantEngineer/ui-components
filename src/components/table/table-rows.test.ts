import { describe, expect, it, vi } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import { filterTableRows } from './table-filters.js';
import {
  applyTableMove,
  compareCellValues,
  getTextCollator,
  getCellValue,
  getRowText,
  isEffectiveTableMove,
  type TableColumn,
} from './table-rows.js';
import { nextSortDescriptor, sortTableRows } from './table-sort.js';

interface Fruit {
  id: string;
  name: string;
  weight: number;
  ripe?: boolean;
  picked?: Date;
  tags?: string[];
}

const fruit: readonly Fruit[] = Object.freeze([
  { id: 'banana', name: 'Banana', weight: 120 },
  { id: 'apple', name: 'apple', weight: 30 },
  { id: 'cherry', name: 'Cherry', weight: 100 },
]);
const columns: TableColumn<Fruit>[] = [
  { id: 'name', header: 'Name' },
  { id: 'weight', header: 'Weight' },
];

const english = getTextCollator('en-US');

describe('table row helpers', () => {
  it('UIC-TABLE-2.2 reads a column value from getValue or the property named by its id', () => {
    const row = { id: 'x', name: 'Kiwi', weight: 5, tags: ['green'] };
    expect(getCellValue(row, { id: 'name' })).toBe('Kiwi');
    expect(getCellValue(row, { id: 'tags' })).toBeUndefined();
    expect(getCellValue(row, { id: 'name', getValue: (item: Fruit) => item.weight })).toBe(5);
  });

  it('UIC-TABLE-2.2 compares numbers, booleans and dates numerically and text naturally', () => {
    expect(compareCellValues(30, 100, english)).toBeLessThan(0);
    expect(compareCellValues(true, false, english)).toBeGreaterThan(0);
    expect(compareCellValues(new Date('2026-10-02'), new Date('2026-10-10'), english)).toBeLessThan(
      0,
    );
    expect(compareCellValues('item 2', 'Item 10', english)).toBeLessThan(0);
    expect(compareCellValues('apple', 'APPLE', english)).toBe(0);
    expect(compareCellValues(null, 'a', english)).toBeLessThan(0);
  });

  it('UIC-TABLE-2.10 collates text by the given locale', () => {
    const swedish = getTextCollator('sv-SE');
    expect(compareCellValues('z', 'ä', swedish)).toBeLessThan(0);
    expect(compareCellValues('z', 'ä', english)).toBeGreaterThan(0);
    expect(compareCellValues('item 2', 'item 10', swedish)).toBeLessThan(0);
    const words = [
      { id: 'first', name: 'z', weight: 1 },
      { id: 'second', name: 'ä', weight: 1 },
      { id: 'third', name: 'Z', weight: 1 },
    ];
    const order = (locale: string) =>
      sortTableRows(words, {
        columns,
        sort: { column: 'name', direction: 'ascending' },
        locale: locale,
      }).map((row) => row.id);
    expect(order('sv-SE')).toEqual(['first', 'third', 'second']);
    expect(order('en-US')).toEqual(['second', 'first', 'third']);
  });

  it('UIC-TABLE-2.2 UIC-TABLE-2.3 sorts without touching the input and keeps ties in order', () => {
    expect(
      sortTableRows(fruit, {
        columns,
        sort: { column: 'name', direction: 'ascending' },
        locale: 'en-US',
      }),
    ).toEqual([fruit[1], fruit[0], fruit[2]]);
    expect(
      sortTableRows(fruit, {
        columns,
        sort: { column: 'weight', direction: 'descending' },
        locale: 'en-US',
      }).map((row) => row.id),
    ).toEqual(['banana', 'cherry', 'apple']);
    const ties = [
      { id: 'first', name: 'item 2', weight: 1 },
      { id: 'second', name: 'ITEM 2', weight: 1 },
      { id: 'third', name: 'item 10', weight: 1 },
    ];
    expect(
      sortTableRows(ties, {
        columns,
        sort: { column: 'name', direction: 'descending' },
        locale: 'en-US',
      }).map((row) => row.id),
    ).toEqual(['third', 'first', 'second']);
    expect(sortTableRows(fruit, { columns, sort: null, locale: 'en-US' })).toBe(fruit);
    expect(
      sortTableRows(fruit, {
        columns,
        sort: { column: 'missing', direction: 'ascending' },
        locale: 'en-US',
      }),
    ).toBe(fruit);
  });

  it('UIC-TABLE-2.2 reads each sort value once per row', () => {
    const getValue = vi.fn((row: Fruit) => row.weight);
    sortTableRows(fruit, {
      columns: [{ id: 'weight', getValue }],
      sort: {
        column: 'weight',
        direction: 'ascending',
      },
      locale: 'en-US',
    });
    expect(getValue).toHaveBeenCalledTimes(fruit.length);
  });

  it('UIC-TABLE-2.5 keeps rows whose text holds every term, ignoring case', () => {
    expect(getRowText(requireDefined(fruit[0]), columns)).toBe('Banana 120');
    expect(getRowText({ id: 7, name: '', weight: Number.NaN, tags: [] }, [{ id: 'tags' }])).toBe(
      '7',
    );
    expect(filterTableRows(fruit, columns, { query: 'an 12' }).map((row) => row.id)).toEqual([
      'banana',
    ]);
    expect(filterTableRows(fruit, columns, { query: 'CHER' })).toEqual([fruit[2]]);
    expect(filterTableRows(fruit, columns, { query: '   ' })).toBe(fruit);
  });

  it('UIC-TABLE-2.1 cycles ascending, descending, then unsorted', () => {
    const ascending = { column: 'name', direction: 'ascending' } as const;
    const descending = { column: 'name', direction: 'descending' } as const;
    expect(nextSortDescriptor(null, ascending)).toBe(ascending);
    expect(nextSortDescriptor(ascending, descending)).toBe(descending);
    expect(nextSortDescriptor(descending, ascending)).toBeNull();
    expect(nextSortDescriptor({ column: 'weight', direction: 'descending' }, ascending)).toBe(
      ascending,
    );
  });

  it('UIC-TABLE-5.4 places moved rows before or after the target in a copy', () => {
    const ids = (rows: readonly Fruit[]) => rows.map((row) => row.id);
    expect(
      ids(applyTableMove(fruit, { keys: ['cherry'], targetKey: 'banana', position: 'before' })),
    ).toEqual(['cherry', 'banana', 'apple']);
    expect(
      ids(
        applyTableMove(fruit, {
          keys: ['cherry', 'banana'],
          targetKey: 'apple',
          position: 'after',
        }),
      ),
    ).toEqual(['apple', 'banana', 'cherry']);
    expect(
      ids(applyTableMove(fruit, { keys: ['banana'], targetKey: 'apple', position: 'after' })),
    ).toEqual(['apple', 'banana', 'cherry']);
    expect(
      ids(applyTableMove(fruit, { keys: ['banana'], targetKey: 'banana', position: 'after' })),
    ).toEqual(ids(fruit));
    expect(ids(fruit)).toEqual(['banana', 'apple', 'cherry']);
  });

  it('UIC-TABLE-5.1 tells moves that change the order from those that do not', () => {
    expect(
      isEffectiveTableMove(fruit, { keys: ['banana'], targetKey: 'apple', position: 'after' }),
    ).toBe(true);
    expect(
      isEffectiveTableMove(fruit, { keys: ['banana'], targetKey: 'apple', position: 'before' }),
    ).toBe(false);
    expect(
      isEffectiveTableMove(fruit, { keys: ['apple'], targetKey: 'apple', position: 'after' }),
    ).toBe(false);
  });
});
