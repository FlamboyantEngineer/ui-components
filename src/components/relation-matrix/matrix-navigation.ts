// Keyboard movement between the cells of a matrix grid, headers included.

/** A cell of the grid: `-1` is the header row or the row header column. */
export interface MatrixPosition {
  row: number;
  column: number;
}

export interface MatrixKeyOptions {
  key: string;
  /** Control or Command was held: Home and End then reach the first and last rows too. */
  isPrimaryModifier: boolean;
  isRightToLeft: boolean;
  rowCount: number;
  columnCount: number;
  /** Rows PageUp and PageDown move by. */
  pageSize: number;
}

function clamp(value: number, last: number): number {
  return Math.min(Math.max(value, -1), last);
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
      return { row: clamp(row - 1, lastRow), column };
    case 'ArrowDown':
      return { row: clamp(row + 1, lastRow), column };
    case 'ArrowLeft':
    case 'ArrowRight':
      return { row, column: clamp(column + stepColumn(key, isRightToLeft), lastColumn) };
    case 'PageUp':
      return { row: clamp(row - pageSize, lastRow), column };
    case 'PageDown':
      return { row: clamp(row + pageSize, lastRow), column };
    case 'Home':
      return { row: isPrimaryModifier ? -1 : row, column: -1 };
    case 'End':
      return { row: isPrimaryModifier ? lastRow : row, column: lastColumn };
    default:
      return null;
  }
}

/** `position` moved inside a grid that shrank to `rowCount` rows and `columnCount` columns. */
export function clampMatrixPosition(
  position: MatrixPosition,
  rowCount: number,
  columnCount: number,
): MatrixPosition {
  const row = clamp(position.row, rowCount - 1);
  const column = clamp(position.column, columnCount - 1);
  return row === position.row && column === position.column ? position : { row, column };
}
