// Keyboard movement between the cells of a matrix grid, headers included.

import { clamp } from '../../utils/clamp.js';

/** A cell of the grid: `-1` is the header row or the row header column. */
export interface MatrixPosition {
  row: number;
  column: number;
}

interface MatrixKeyOptions {
  key: string;
  /** Control or Command was held: Home and End then reach the first and last rows too. */
  isPrimaryModifier: boolean;
  isRightToLeft: boolean;
  rowCount: number;
  columnCount: number;
  /** Rows PageUp and PageDown move by. */
  pageSize: number;
}

function stepColumn(key: string, isRightToLeft: boolean): number {
  const step = key === 'ArrowRight' ? 1 : -1;
  return isRightToLeft ? -step : step;
}

/**
 * The cell a key moves focus to from `position`, or null for a key that does not move it. Arrow
 * keys move one cell (left and right swap in right-to-left text), PageUp and PageDown a page of
 * rows, Home and End to the start or end of the row, and with Control or Command to the first or
 * last cell of the grid.
 */
export function moveMatrixFocus(
  position: MatrixPosition,
  options: MatrixKeyOptions,
): MatrixPosition | null {
  const { key, isPrimaryModifier, isRightToLeft, rowCount, columnCount, pageSize } = options;
  const lastRow = rowCount - 1;
  const lastColumn = columnCount - 1;
  const { row, column } = position;
  switch (key) {
    case 'ArrowUp':
      return { row: clamp(row - 1, -1, lastRow), column };
    case 'ArrowDown':
      return { row: clamp(row + 1, -1, lastRow), column };
    case 'ArrowLeft':
    case 'ArrowRight':
      return { row, column: clamp(column + stepColumn(key, isRightToLeft), -1, lastColumn) };
    case 'PageUp':
      return { row: clamp(row - pageSize, -1, lastRow), column };
    case 'PageDown':
      return { row: clamp(row + pageSize, -1, lastRow), column };
    case 'Home':
      return { row: isPrimaryModifier ? -1 : row, column: -1 };
    case 'End':
      return { row: isPrimaryModifier ? lastRow : row, column: lastColumn };
    default:
      return null;
  }
}

/**
 * The focused cell by the identities of its row and column items, with the position it was last
 * seen at: null is the header row or the row header column, and undefined a place no item held,
 * which the item that arrives there takes.
 */
export interface MatrixFocus {
  row: string | null | undefined;
  column: string | null | undefined;
  at: MatrixPosition;
}

/** The focus on the cell at `position`, by the identities of its items. */
export function toMatrixFocus(
  position: MatrixPosition,
  rowIds: readonly string[],
  columnIds: readonly string[],
): MatrixFocus {
  return {
    row: position.row < 0 ? null : rowIds[position.row],
    column: position.column < 0 ? null : columnIds[position.column],
    at: position,
  };
}

/** Where an item is now: its index, or for an item that went, the index it held, kept in range. */
function resolveAxis(id: string | null | undefined, ids: readonly string[], at: number) {
  if (id === null) return { index: -1, isLost: false };
  if (id === undefined) return { index: clamp(at, -1, ids.length - 1), isLost: false };
  const index = ids.indexOf(id);
  return index >= 0
    ? { index, isLost: false }
    : { index: clamp(at, -1, ids.length - 1), isLost: true };
}

/**
 * Where the focused cell is now that its items may have moved: it follows its row and column items.
 * An item that went leaves focus on the item now at its place, or the last one, or the header when
 * none is left; `isLost` then tells the focus to move there.
 */
export function resolveMatrixFocus(
  focus: MatrixFocus,
  rowIds: readonly string[],
  columnIds: readonly string[],
): { position: MatrixPosition; isLost: boolean } {
  const row = resolveAxis(focus.row, rowIds, focus.at.row);
  const column = resolveAxis(focus.column, columnIds, focus.at.column);
  return {
    position: { row: row.index, column: column.index },
    isLost: row.isLost || column.isLost,
  };
}
