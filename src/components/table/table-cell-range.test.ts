import { describe, expect, it } from 'vitest';
import {
  createBoundsRange,
  createCellGrid,
  createCellRange,
  getRangeBounds,
  isSameCellRange,
  listBoundsCells,
  locateCell,
  placeInBounds,
  stepCell,
} from './table-cell-range.js';
import type { TableColumn } from './table-rows.js';

interface Row {
  id: number | string;
  a: string;
  b: string;
  c: string;
}

const rows: Row[] = [
  { id: 1, a: 'a1', b: 'b1', c: 'c1' },
  { id: 2, a: 'a2', b: 'b2', c: 'c2' },
  { id: 'x', a: 'a3', b: 'b3', c: 'c3' },
];
const columns: TableColumn<Row>[] = [
  { id: 'a', header: 'A' },
  { id: 'b', header: 'B' },
  { id: 'c', header: 'C' },
];
const grid = createCellGrid(rows, columns);

describe('table cell range helpers', () => {
  it('UIC-TABLE-14.8 locates cells by row key text and column id', () => {
    expect(locateCell(grid, { rowKey: 2, columnId: 'c' })).toEqual({ row: 1, column: 2 });
    expect(locateCell(grid, { rowKey: '2', columnId: 'c' })).toEqual({ row: 1, column: 2 });
    expect(locateCell(grid, { rowKey: 9, columnId: 'a' })).toBeNull();
  });

  it('UIC-TABLE-14.8 bounds a range from either corner and drops ranges the grid does not show', () => {
    const range = { anchor: { rowKey: 'x', columnId: 'c' }, focus: { rowKey: 1, columnId: 'b' } };
    expect(getRangeBounds(grid, range)).toEqual({ top: 0, bottom: 2, start: 1, end: 2 });
    expect(getRangeBounds(grid, null)).toBeNull();
    expect(getRangeBounds(grid, createCellRange({ rowKey: 'gone', columnId: 'a' }))).toBeNull();
    const lostFocus = { ...range, focus: { rowKey: 'gone', columnId: 'a' } };
    expect(getRangeBounds(grid, lostFocus)).toEqual({ top: 2, bottom: 2, start: 2, end: 2 });
  });

  it('UIC-TABLE-14.8 steps a cell inside the grid', () => {
    const corner = { rowKey: 1, columnId: 'a' };
    expect(stepCell(grid, corner, { rows: 1, columns: 1 })).toEqual({ rowKey: 2, columnId: 'b' });
    expect(stepCell(grid, corner, { rows: -1, columns: -1 })).toEqual(corner);
    expect(stepCell(grid, corner, { rows: 5, columns: 0 })).toEqual({ rowKey: 'x', columnId: 'a' });
    const gone = { rowKey: 'gone', columnId: 'a' };
    expect(stepCell(grid, gone, { rows: 1, columns: 0 })).toBe(gone);
  });

  it('UIC-TABLE-14.8 places cells on the edges of bounds, with the corner at the bottom end', () => {
    const bounds = { top: 0, bottom: 1, start: 1, end: 2 };
    expect(placeInBounds(bounds, { row: 1, column: 2 })).toEqual({
      isInRange: true,
      isTop: false,
      isBottom: true,
      isStart: false,
      isEnd: true,
      isCorner: true,
    });
    expect(placeInBounds(bounds, { row: 0, column: 1 })).toMatchObject({
      isTop: true,
      isStart: true,
      isCorner: false,
    });
    expect(placeInBounds(bounds, { row: 2, column: 1 }).isInRange).toBe(false);
    expect(placeInBounds(null, { row: 0, column: 0 }).isInRange).toBe(false);
  });

  it('UIC-TABLE-14.8 lists the cells of bounds and turns bounds back into a range', () => {
    const bounds = { top: 1, bottom: 2, start: 0, end: 1 };
    expect(
      listBoundsCells(grid, bounds).map((cells) =>
        cells.map(({ row, column }) => `${row.id}${column.id}`),
      ),
    ).toEqual([
      ['2a', '2b'],
      ['xa', 'xb'],
    ]);
    const range = createBoundsRange(grid, bounds);
    expect(range).toEqual({
      anchor: { rowKey: 2, columnId: 'a' },
      focus: { rowKey: 'x', columnId: 'b' },
    });
    expect(createBoundsRange(grid, { top: 5, bottom: 5, start: 0, end: 0 })).toBeNull();
    expect(isSameCellRange(range, createBoundsRange(grid, bounds))).toBe(true);
    expect(isSameCellRange(range, null)).toBe(false);
    expect(isSameCellRange(null, null)).toBe(true);
  });
});
