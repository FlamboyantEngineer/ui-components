import { describe, expect, it, vi } from 'vitest';
import type { TableColumn } from './table-rows.js';
import { nextSortDescriptors, sortTableRows } from './table-sort.js';

interface Fruit {
  id: string;
  name: string;
  color: string;
  weight: number;
}

const fruit: readonly Fruit[] = Object.freeze([
  { id: 'banana', name: 'Banana', color: 'Yellow', weight: 120 },
  { id: 'apple', name: 'Apple', color: 'Red', weight: 30 },
  { id: 'cherry', name: 'Cherry', color: 'Red', weight: 100 },
  { id: 'lemon', name: 'Lemon', color: 'Yellow', weight: 100 },
]);
const columns: TableColumn<Fruit>[] = [
  { id: 'name', header: 'Name' },
  { id: 'color', header: 'Color' },
  { id: 'weight', header: 'Weight' },
];
const ids = (rows: readonly Fruit[]) => rows.map((row) => row.id);

describe('table sort helpers', () => {
  it('UIC-TABLE-2.6 orders by several columns, each later one breaking ties', () => {
    const sorted = sortTableRows(fruit, {
      columns,
      sort: [
        { column: 'color', direction: 'ascending' },
        { column: 'weight', direction: 'descending' },
      ],
      locale: 'en-US',
    });
    expect(ids(sorted)).toEqual(['cherry', 'apple', 'banana', 'lemon']);
    expect(
      ids(
        sortTableRows(fruit, {
          columns,
          sort: [
            { column: 'missing', direction: 'ascending' },
            { column: 'weight', direction: 'ascending' },
          ],
          locale: 'en-US',
        }),
      ),
    ).toEqual(['apple', 'cherry', 'lemon', 'banana']);
    expect(sortTableRows(fruit, { columns, sort: [], locale: 'en-US' })).toBe(fruit);
    expect(ids(fruit)).toEqual(['banana', 'apple', 'cherry', 'lemon']);
  });

  it('UIC-TABLE-2.6 reads each value once per row and column', () => {
    const getValue = vi.fn((row: Fruit) => row.weight);
    sortTableRows(fruit, {
      columns: [{ id: 'color' }, { id: 'weight', getValue }],
      sort: [
        { column: 'color', direction: 'ascending' },
        { column: 'weight', direction: 'ascending' },
      ],
      locale: 'en-US',
    });
    expect(getValue).toHaveBeenCalledTimes(fruit.length);
  });

  it('UIC-TABLE-2.6 steps a column alone on a plain press and beside the others with Shift', () => {
    const color = { column: 'color', direction: 'ascending' } as const;
    expect(nextSortDescriptors([], 'name', false)).toEqual([
      { column: 'name', direction: 'ascending' },
    ]);
    expect(nextSortDescriptors([color], 'name', false)).toEqual([
      { column: 'name', direction: 'ascending' },
    ]);
    expect(nextSortDescriptors([color], 'color', false)).toEqual([
      { column: 'color', direction: 'descending' },
    ]);
    expect(nextSortDescriptors([{ ...color, direction: 'descending' }], 'color', false)).toEqual(
      [],
    );
    const added = nextSortDescriptors([color], 'weight', true);
    expect(added).toEqual([color, { column: 'weight', direction: 'ascending' }]);
    const stepped = nextSortDescriptors(added, 'weight', true);
    expect(stepped).toEqual([color, { column: 'weight', direction: 'descending' }]);
    expect(nextSortDescriptors(stepped, 'weight', true)).toEqual([color]);
    expect(nextSortDescriptors(stepped, 'color', true)).toEqual([
      { column: 'color', direction: 'descending' },
      { column: 'weight', direction: 'descending' },
    ]);
  });
});
