import { describe, expect, it } from 'vitest';
import { clampMatrixPosition, moveMatrixFocus } from './matrix-navigation.js';

describe('matrix navigation', () => {
  const grid = { rowCount: 5, columnCount: 4, pageSize: 2, isRightToLeft: false };
  const move = (key: string, row: number, column: number, more: object = {}) =>
    moveMatrixFocus({ row, column }, { ...grid, key, isPrimaryModifier: false, ...more });

  it('UIC-RELATION-MATRIX-2.1 moves one cell with arrow keys, into the headers and no further', () => {
    expect(move('ArrowDown', 0, 0)).toEqual({ row: 1, column: 0 });
    expect(move('ArrowUp', 0, 0)).toEqual({ row: -1, column: 0 });
    expect(move('ArrowUp', -1, 0)).toEqual({ row: -1, column: 0 });
    expect(move('ArrowRight', 0, 3)).toEqual({ row: 0, column: 3 });
    expect(move('ArrowLeft', 0, 0)).toEqual({ row: 0, column: -1 });
    expect(move('ArrowLeft', 0, 1, { isRightToLeft: true })).toEqual({ row: 0, column: 2 });
    expect(move('Tab', 0, 0)).toBeNull();
  });

  it('UIC-RELATION-MATRIX-2.1 moves by pages and to the ends', () => {
    expect(move('PageDown', 1, 2)).toEqual({ row: 3, column: 2 });
    expect(move('PageDown', 4, 2)).toEqual({ row: 4, column: 2 });
    expect(move('PageUp', 0, 2)).toEqual({ row: -1, column: 2 });
    expect(move('Home', 2, 2)).toEqual({ row: 2, column: -1 });
    expect(move('End', 2, 0)).toEqual({ row: 2, column: 3 });
    expect(move('Home', 2, 2, { isPrimaryModifier: true })).toEqual({ row: -1, column: -1 });
    expect(move('End', 2, 0, { isPrimaryModifier: true })).toEqual({ row: 4, column: 3 });
  });

  it('UIC-RELATION-MATRIX-2.1 keeps the focused cell inside a grid that shrinks', () => {
    const position = { row: 1, column: 1 };
    expect(clampMatrixPosition(position, 5, 5)).toBe(position);
    expect(clampMatrixPosition({ row: 6, column: 6 }, 2, 0)).toEqual({ row: 1, column: -1 });
  });
});
