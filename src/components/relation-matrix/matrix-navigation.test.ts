import { describe, expect, it } from 'vitest';
import {
  adoptMatrixFocus,
  moveMatrixFocus,
  resolveMatrixFocus,
  toMatrixFocus,
} from './matrix-navigation.js';

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

  it('UIC-RELATION-MATRIX-2.3 follows the focused items when they reorder', () => {
    const focus = toMatrixFocus({ row: 0, column: 1 }, ['a', 'b'], ['x', 'y']);
    expect(focus).toEqual({ row: 'a', column: 'y', at: { row: 0, column: 1 } });
    expect(resolveMatrixFocus(focus, ['b', 'a'], ['y', 'x'])).toEqual({
      position: { row: 1, column: 0 },
      isLost: false,
    });
    const header = toMatrixFocus({ row: -1, column: 0 }, ['a'], ['x']);
    expect(resolveMatrixFocus(header, ['b', 'a'], ['z', 'x']).position).toEqual({
      row: -1,
      column: 1,
    });
  });

  it('UIC-RELATION-MATRIX-2.3 falls back to the place of an item that went', () => {
    const focus = toMatrixFocus({ row: 1, column: 1 }, ['a', 'b', 'c'], ['x', 'y']);
    expect(resolveMatrixFocus(focus, ['a', 'c'], ['x', 'y'])).toEqual({
      position: { row: 1, column: 1 },
      isLost: true,
    });
    expect(resolveMatrixFocus(focus, ['a'], ['y'])).toEqual({
      position: { row: 0, column: 0 },
      isLost: true,
    });
    expect(resolveMatrixFocus(focus, [], [])).toEqual({
      position: { row: -1, column: -1 },
      isLost: true,
    });
  });

  it('UIC-RELATION-MATRIX-2.3 gives a place no item held to the item that arrives there', () => {
    const empty = toMatrixFocus({ row: 0, column: 0 }, [], []);
    expect(resolveMatrixFocus(empty, [], []).position).toEqual({ row: -1, column: -1 });
    expect(resolveMatrixFocus(empty, ['a'], ['x'])).toEqual({
      position: { row: 0, column: 0 },
      isLost: false,
    });
  });

  it('UIC-RELATION-MATRIX-2.3 binds a focus taken while empty to the items that arrive', () => {
    const empty = toMatrixFocus({ row: 0, column: 0 }, [], []);
    expect(adoptMatrixFocus(empty, [], [])).toBe(empty);
    expect(adoptMatrixFocus(empty, ['a', 'b'], ['x'])).toEqual({
      row: 'a',
      column: 'x',
      at: { row: 0, column: 0 },
    });
    const header = toMatrixFocus({ row: -1, column: 0 }, ['a'], ['x']);
    expect(adoptMatrixFocus(header, ['a'], ['x'])).toBe(header);
  });
});
