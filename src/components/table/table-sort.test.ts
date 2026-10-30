import { describe, expect, it, vi } from 'vitest';
import type { TableColumn } from './table-rows.js';
import { nextSortDescriptors, sortTableRows } from './table-sort.js';

interface Fruit {
  id: string;
  name: string;
  colour: string;
  weight: number;
}

const fruit: readonly Fruit[] = Object.freeze([
  { id: 'banana', name: 'Banana', colour: 'Yellow', weight: 120 },
  { id: 'apple', name: 'Apple', colour: 'Red', weight: 30 },
  { id: 'cherry', name: 'Cherry', colour: 'Red', weight: 100 },
  { id: 'lemon', name: 'Lemon', colour: 'Yellow', weight: 100 },
]);
const columns: TableColumn<Fruit>[] = [
  { id: 'name', header: 'Name' },
  { id: 'colour', header: 'Colour' },
  { id: 'weight', header: 'Weight' },
];
const ids = (rows: readonly Fruit[]) => rows.map((row) => row.id);

describe('table sort helpers', () => {
  it('UIC-TABLE-2.6 orders by several columns, each later one breaking ties', () => {
    const sorted = sortTableRows(fruit, {
      columns,
      sort: [
        { column: 'colour', direction: 'ascending' },
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
      columns: [{ id: 'colour' }, { id: 'weight', getValue }],
      sort: [
        { column: 'colour', direction: 'ascending' },
        { column: 'weight', direction: 'ascending' },
      ],
      locale: 'en-US',
    });
    expect(getValue).toHaveBeenCalledTimes(fruit.length);
  });

  it('UIC-TABLE-2.6 steps a column alone on a plain press and beside the others with Shift', () => {
    const colour = { column: 'colour', direction: 'ascending' } as const;
    expect(nextSortDescriptors([], 'name', false)).toEqual([
      { column: 'name', direction: 'ascending' },
    ]);
    expect(nextSortDescriptors([colour], 'name', false)).toEqual([
      { column: 'name', direction: 'ascending' },
    ]);
    expect(nextSortDescriptors([colour], 'colour', false)).toEqual([
      { column: 'colour', direction: 'descending' },
    ]);
    expect(nextSortDescriptors([{ ...colour, direction: 'descending' }], 'colour', false)).toEqual(
      [],
    );
    const added = nextSortDescriptors([colour], 'weight', true);
    expect(added).toEqual([colour, { column: 'weight', direction: 'ascending' }]);
    const stepped = nextSortDescriptors(added, 'weight', true);
    expect(stepped).toEqual([colour, { column: 'weight', direction: 'descending' }]);
    expect(nextSortDescriptors(stepped, 'weight', true)).toEqual([colour]);
    expect(nextSortDescriptors(stepped, 'colour', true)).toEqual([
      { column: 'colour', direction: 'descending' },
      { column: 'weight', direction: 'descending' },
    ]);
  });
});
