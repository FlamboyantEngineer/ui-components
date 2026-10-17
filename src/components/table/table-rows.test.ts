import { describe, expect, it, vi } from 'vitest';
import {
  applyTableMove,
  compareCellValues,
  filterTableRows,
  getCellValue,
  getRowText,
  isEffectiveTableMove,
  nextSortDescriptor,
  sortTableRows,
  type TableColumn,
} from './table-rows.js';

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

describe('table row helpers', () => {
  it('UIC-TABLE-2.2 reads a column value from getValue or the property named by its id', () => {
    const row = { id: 'x', name: 'Kiwi', weight: 5, tags: ['green'] };
    expect(getCellValue(row, { id: 'name' })).toBe('Kiwi');
    expect(getCellValue(row, { id: 'tags' })).toBeUndefined();
    expect(getCellValue(row, { id: 'name', getValue: (item: Fruit) => item.weight })).toBe(5);
  });

  it('UIC-TABLE-2.2 compares numbers, booleans and dates numerically and text naturally', () => {
    expect(compareCellValues(30, 100)).toBeLessThan(0);
    expect(compareCellValues(true, false)).toBeGreaterThan(0);
    expect(compareCellValues(new Date('2026-10-02'), new Date('2026-10-10'))).toBeLessThan(0);
    expect(compareCellValues('item 2', 'Item 10')).toBeLessThan(0);
    expect(compareCellValues('apple', 'APPLE')).toBe(0);
    expect(compareCellValues(null, 'a')).toBeLessThan(0);
  });

  it('UIC-TABLE-2.2 UIC-TABLE-2.3 sorts without touching the input and keeps ties in order', () => {
    expect(sortTableRows(fruit, columns, { column: 'name', direction: 'ascending' })).toEqual([
      fruit[1],
      fruit[0],
      fruit[2],
    ]);
    expect(
      sortTableRows(fruit, columns, { column: 'weight', direction: 'descending' }).map(
        (row) => row.id,
      ),
    ).toEqual(['banana', 'cherry', 'apple']);
    const ties = [
      { id: 'first', name: 'item 2', weight: 1 },
      { id: 'second', name: 'ITEM 2', weight: 1 },
      { id: 'third', name: 'item 10', weight: 1 },
    ];
    expect(
      sortTableRows(ties, columns, { column: 'name', direction: 'descending' }).map(
        (row) => row.id,
      ),
    ).toEqual(['third', 'first', 'second']);
    expect(sortTableRows(fruit, columns, null)).toBe(fruit);
    expect(sortTableRows(fruit, columns, { column: 'missing', direction: 'ascending' })).toBe(
      fruit,
    );
  });

  it('UIC-TABLE-2.2 reads each sort value once per row', () => {
    const getValue = vi.fn((row: Fruit) => row.weight);
    sortTableRows(fruit, [{ id: 'weight', getValue }], {
      column: 'weight',
      direction: 'ascending',
    });
    expect(getValue).toHaveBeenCalledTimes(fruit.length);
  });

  it('UIC-TABLE-2.5 keeps rows whose text holds every term, ignoring case', () => {
    expect(getRowText(fruit[0]!, columns)).toBe('Banana 120');
    expect(getRowText({ id: 7, name: '', weight: Number.NaN, tags: [] }, [{ id: 'tags' }])).toBe(
      '7',
    );
    expect(filterTableRows(fruit, columns, 'an 12').map((row) => row.id)).toEqual(['banana']);
    expect(filterTableRows(fruit, columns, 'CHER')).toEqual([fruit[2]]);
    expect(filterTableRows(fruit, columns, '   ')).toBe(fruit);
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
