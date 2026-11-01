import { describe, expect, it } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import {
  filterTableRows,
  isEmptyFilterValue,
  listFilterOptions,
  setColumnFilter,
} from './table-filters.js';
import type { TableColumn } from './table-rows.js';

interface Fruit {
  id: string;
  name: string;
  colour: string;
  weight: number | null;
  picked: Date | string;
}

const fruit: readonly Fruit[] = Object.freeze([
  { id: 'banana', name: 'Banana', colour: 'Yellow', weight: 120, picked: new Date(2026, 9, 2) },
  { id: 'apple', name: 'Apple', colour: 'Red', weight: 30, picked: '2026-10-10T08:00:00Z' },
  { id: 'cherry', name: 'Cherry', colour: 'Red', weight: null, picked: 'soon' },
  { id: 'lemon', name: 'Lemon', colour: 'Yellow', weight: 100, picked: new Date(Number.NaN) },
]);
const columns: TableColumn<Fruit>[] = [
  { id: 'name', header: 'Name', filter: { type: 'text' } },
  { id: 'colour', header: 'Colour', filter: { type: 'set' } },
  { id: 'weight', header: 'Weight', filter: { type: 'number' } },
  { id: 'picked', header: 'Picked', filter: { type: 'date' } },
];
const ids = (rows: readonly Fruit[]) => rows.map((row) => row.id);

describe('table filter helpers', () => {
  it('UIC-TABLE-2.9 keeps cells containing a text value, ignoring case', () => {
    expect(ids(filterTableRows(fruit, columns, { columns: { name: 'AN' } }))).toEqual(['banana']);
    expect(ids(filterTableRows(fruit, columns, { columns: { weight: '' } }))).toEqual(ids(fruit));
  });

  it('UIC-TABLE-2.9 matches text and query terms whatever their composition and case', () => {
    const spelled: Fruit[] = [
      { id: 'nfd', name: 'Cre\u0300me brule\u0301e', colour: 'Gold', weight: 1, picked: 'soon' },
      { id: 'sharp', name: 'STRAẞE', colour: 'Grey', weight: 2, picked: 'soon' },
    ];
    const matching = (filter: Parameters<typeof filterTableRows>[2]) =>
      ids(filterTableRows(spelled, columns, filter));
    expect(matching({ columns: { name: 'CRÈME' } })).toEqual(['nfd']);
    expect(matching({ query: 'brûlée crème' })).toEqual([]);
    expect(matching({ query: 'brulée crème' })).toEqual(['nfd']);
    expect(matching({ columns: { name: 'straße' } })).toEqual(['sharp']);
    expect(matching({ query: 'straße' })).toEqual(['sharp']);
  });

  it('UIC-TABLE-2.9 keeps number cells inside a range with open bounds', () => {
    const within = (min?: number | null, max?: number | null) =>
      ids(filterTableRows(fruit, columns, { columns: { weight: { min, max } } }));
    expect(within(50, 110)).toEqual(['lemon']);
    expect(within(100)).toEqual(['banana', 'lemon']);
    expect(within(null, 30)).toEqual(['apple']);
    expect(within()).toEqual(ids(fruit));
  });

  it('UIC-TABLE-2.9 keeps dates and day-prefixed text on or between the range days', () => {
    const between = (start: string, end: string) =>
      ids(filterTableRows(fruit, columns, { columns: { picked: { start, end } } }));
    expect(between('2026-10-01', '2026-10-05')).toEqual(['banana']);
    expect(between('2026-10-02', '2026-10-10')).toEqual(['banana', 'apple']);
    expect(between('2026-11-01', '2026-11-30')).toEqual([]);
  });

  it('UIC-TABLE-2.9 reads dates as four-digit local days and gives other years none', () => {
    const inYear = (year: number) => {
      const date = new Date(2024, 4, 1, 23, 30);
      date.setFullYear(year);
      return date;
    };
    const dated: Fruit[] = [999, 0, 10000, 2024].map((year) => ({
      id: String(year),
      name: 'Plum',
      colour: 'Purple',
      weight: 50,
      picked: inYear(year),
    }));
    const between = (start: string, end: string) =>
      ids(filterTableRows(dated, columns, { columns: { picked: { start, end } } }));
    expect(between('2024-01-01', '2024-12-31')).toEqual(['2024']);
    expect(between('0999-05-01', '0999-05-01')).toEqual(['999']);
    // 23:30 local time stays on its local day.
    expect(between('2024-05-02', '2024-05-02')).toEqual([]);
  });

  it('UIC-TABLE-2.9 keeps cells holding a ticked value of a set', () => {
    expect(ids(filterTableRows(fruit, columns, { columns: { colour: ['Red'] } }))).toEqual([
      'apple',
      'cherry',
    ]);
    expect(ids(filterTableRows(fruit, columns, { columns: { colour: [] } }))).toEqual(ids(fruit));
  });

  it('UIC-TABLE-2.9 combines the query with every column value', () => {
    const filter = { query: 'e', columns: { colour: ['Yellow'], weight: { max: 110 } } };
    expect(ids(filterTableRows(fruit, columns, filter))).toEqual(['lemon']);
    expect(filterTableRows(fruit, columns, { columns: { unknown: 'x' } })).toBe(fruit);
  });

  it('UIC-TABLE-2.9 drops values that filter nothing', () => {
    expect(isEmptyFilterValue(undefined)).toBe(true);
    expect(isEmptyFilterValue(' ')).toBe(true);
    expect(isEmptyFilterValue({ min: null })).toBe(true);
    expect(isEmptyFilterValue(['Red'])).toBe(false);
    const filter = setColumnFilter({ query: 'a' }, 'colour', ['Red']);
    expect(filter).toEqual({ query: 'a', columns: { colour: ['Red'] } });
    expect(setColumnFilter(filter, 'colour', [])).toEqual({ query: 'a', columns: {} });
    expect(setColumnFilter(filter, 'colour', null)).toEqual({ query: 'a', columns: {} });
  });

  it('UIC-TABLE-2.8 lists a set filter its options, else the sorted distinct values', () => {
    expect(listFilterOptions(fruit, requireDefined(columns[1]), 'en-US')).toEqual([
      'Red',
      'Yellow',
    ]);
    expect(
      listFilterOptions(
        fruit,
        { id: 'colour', filter: { type: 'set', options: ['Green'] } },
        'en-US',
      ),
    ).toEqual(['Green']);
    expect(listFilterOptions(fruit, requireDefined(columns[2]), 'en-US')).toEqual([
      '30',
      '100',
      '120',
    ]);
  });
});
