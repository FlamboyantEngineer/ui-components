import type { ReactNode } from 'react';
import type { Key, SortDescriptor } from 'react-aria-components';
import type { TableColumnSizing } from './column-sizing.js';

/** A value a cell sorts and filters on. */
export type TableCellValue = string | number | boolean | Date | null | undefined;

/** A table row: any object with a stable `id`. */
export interface TableRow {
  /** The row's key, unique in the table. */
  id: Key;
}

export type TableColumnAlign = 'start' | 'center' | 'end';

/** One data column: its header, how its cells read and render, and how it sorts and sizes. */
export interface TableColumn<T> extends TableColumnSizing {
  /** The header content. */
  header: ReactNode;
  /** Accessible name when the header is not plain text. */
  textValue?: string | undefined;
  /** The value the cell sorts and filters on. Defaults to the row's property named by `id`. */
  getValue?: ((row: T) => TableCellValue) | undefined;
  /** The cell's content. Defaults to the value as text when it is a string or a number. */
  renderCell?: ((row: T) => ReactNode) | undefined;
  /** Alignment of the header and cells. Defaults to `start`. */
  align?: TableColumnAlign | undefined;
  /** Whether a header press sorts by this column. */
  allowsSorting?: boolean | undefined;
  /** Whether the column draws a resizer. */
  allowsResizing?: boolean | undefined;
  /** Names the row for assistive technology. Defaults to the first column. */
  isRowHeader?: boolean | undefined;
}

/** A reorder request: move `keys` before or after the row `targetKey`. */
export interface TableMove {
  /** The moved rows. */
  keys: Key[];
  /** The row the moved rows land beside. */
  targetKey: Key;
  /** Which side of the target they land on. */
  position: 'before' | 'after';
}

type ValueColumn<T> = Pick<TableColumn<T>, 'id' | 'getValue'>;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function isCellValue(value: unknown): value is TableCellValue {
  return (
    value === null ||
    value === undefined ||
    value instanceof Date ||
    ['string', 'number', 'boolean'].includes(typeof value)
  );
}

function isTextValue(value: TableCellValue): value is string | number {
  return typeof value === 'string' || typeof value === 'number';
}

function toSortKey(value: TableCellValue): string | number {
  if (isTextValue(value)) return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value instanceof Date ? value.getTime() : '';
}

/** The value `column` reads from `row`. */
export function getCellValue<T extends TableRow>(row: T, column: ValueColumn<T>): TableCellValue {
  if (column.getValue) return column.getValue(row);
  const value = (row as unknown as Record<string, unknown>)[column.id];
  return isCellValue(value) ? value : undefined;
}

/** Orders two cell values: numbers, booleans and dates numerically, text naturally ignoring case. */
export function compareCellValues(left: TableCellValue, right: TableCellValue): number {
  const a = toSortKey(left);
  const b = toSortKey(right);
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return collator.compare(String(a), String(b));
}

/** The text of a row's string and number cells in `columns`, or its id when there is none. */
export function getRowText<T extends TableRow>(row: T, columns: readonly ValueColumn<T>[]): string {
  const parts = columns.map((column) => getCellValue(row, column)).filter(isTextValue);
  return parts.length > 0 ? parts.join(' ') : String(row.id);
}

/**
 * The rows ordered by the descriptor's column, each value read once. Rows the column cannot
 * separate keep their given order. Without a descriptor or a matching column the rows are returned
 * unchanged; the input array is never modified.
 */
export function sortTableRows<T extends TableRow>(
  rows: readonly T[],
  columns: readonly ValueColumn<T>[],
  descriptor: SortDescriptor | null | undefined,
): readonly T[] {
  const column = columns.find((candidate) => candidate.id === String(descriptor?.column));
  if (!descriptor || !column) return rows;
  const sign = descriptor.direction === 'descending' ? -1 : 1;
  return rows
    .map((row, index) => ({ row, index, value: getCellValue(row, column) }))
    .sort(
      (left, right) =>
        compareCellValues(left.value, right.value) * sign || left.index - right.index,
    )
    .map((entry) => entry.row);
}

/** The rows whose text contains every whitespace-separated term of `query`, ignoring case. */
export function filterTableRows<T extends TableRow>(
  rows: readonly T[],
  columns: readonly ValueColumn<T>[],
  query: string,
): readonly T[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return rows;
  return rows.filter((row) => {
    const text = getRowText(row, columns).toLowerCase();
    return terms.every((term) => text.includes(term));
  });
}

/**
 * The sort after a header press, given what React Aria requests: ascending, then descending, then
 * unsorted again.
 */
export function nextSortDescriptor(
  current: SortDescriptor | null,
  requested: SortDescriptor,
): SortDescriptor | null {
  const restarts =
    current?.column === requested.column &&
    current.direction === 'descending' &&
    requested.direction === 'ascending';
  return restarts ? null : requested;
}

/** A copy of `rows` with the moved rows, in their current order, placed beside the target. */
export function applyTableMove<T extends TableRow>(rows: readonly T[], move: TableMove): T[] {
  const moving = new Set(move.keys);
  const moved = rows.filter((row) => moving.has(row.id));
  const rest = rows.filter((row) => !moving.has(row.id));
  const index = rest.findIndex((row) => row.id === move.targetKey);
  if (index === -1 || moved.length === 0) return [...rows];
  const at = move.position === 'before' ? index : index + 1;
  return [...rest.slice(0, at), ...moved, ...rest.slice(at)];
}

/** Whether applying `move` would change the order of `rows`. */
export function isEffectiveTableMove<T extends TableRow>(
  rows: readonly T[],
  move: TableMove,
): boolean {
  const next = applyTableMove(rows, move);
  return next.some((row, index) => row !== rows[index]);
}
