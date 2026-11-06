import type { ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import { getCollator } from '../../utils/intl-format.js';
import { isDate } from '../../utils/is-date.js';
import type { TableColumnSizing } from './column-sizing.js';
import type { TableBulkEdit } from './table-bulk-edit.js';
import type { TableColumnFilter } from './table-filters.js';
import type { TableAggregate } from './table-groups.js';

/** A value a cell sorts and filters on. */
export type TableCellValue = string | number | boolean | Date | null | undefined;

/** A table row: any object with a stable `id`. */
export interface TableRow {
  /** The row's key, unique in the table. */
  id: Key;
}

export type TableColumnAlign = 'start' | 'center' | 'end';

/**
 * How a cell's text wraps: `nowrap` keeps one line, `wrap` breaks between words and `anywhere` also
 * breaks inside long unspaced values such as identifiers.
 */
export type TableCellWrap = 'nowrap' | 'wrap' | 'anywhere';

/** The edge a column stays at while the table scrolls sideways. */
export type TableColumnPin = 'start' | 'end';

/** What a custom cell editor receives. */
export interface TableCellEditor {
  /** The cell's value when editing started. */
  value: TableCellValue;
  /** The column's accessible name, for the editor's label. */
  label: string;
  /** Ends editing and reports `value` as the cell's new value. */
  commit: (value: TableCellValue) => void;
  /** Ends editing without a change. */
  cancel: () => void;
}

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
  /** How the column's cells wrap their text. Defaults to the table's `cellWrap`. */
  cellWrap?: TableCellWrap | undefined;
  /** Whether a header press sorts by this column. */
  allowsSorting?: boolean | undefined;
  /** Whether the column draws a resizer. */
  allowsResizing?: boolean | undefined;
  /** Names the row for assistive technology. Defaults to the first column. */
  isRowHeader?: boolean | undefined;
  /** Keeps the column in view at the start or end of the table while it scrolls sideways. */
  pin?: TableColumnPin | undefined;
  /** Whether the columns menu lists the column, so the reader can hide and show it. */
  allowsHiding?: boolean | undefined;
  /** Whether the reader can move the column by dragging its header or with Alt+Arrow keys. */
  allowsReordering?: boolean | undefined;
  /** Draws a filter button in the header that filters the rows by this column's values. */
  filter?: TableColumnFilter | undefined;
  /** Whether the reader can edit the column's cells: F2, Enter or a double click opens an editor. */
  allowsEditing?: boolean | undefined;
  /** A cell's editor, instead of the default text input. */
  renderEditor?: ((row: T, editor: TableCellEditor) => ReactNode) | undefined;
  /**
   * Reads typed, pasted or filled text as the cell's value. Defaults to the text, or a number when
   * the cell holds a number and the text reads as one.
   */
  parseValue?: ((text: string, row: T) => TableCellValue) | undefined;
  /** Checks a new value of the cell: a message refuses it, null or nothing accepts it. */
  validateValue?: ((value: TableCellValue, row: T) => string | null | undefined) | undefined;
  /** Lists the column in the bulk edit of selected rows, which sets it with a field of this type. */
  bulkEdit?: TableBulkEdit | undefined;
  /** The column's cell in group header rows, from the group's rows. */
  aggregate?: TableAggregate<T> | undefined;
  /** A cell's text in a CSV export. Defaults to its value as text, dates in ISO 8601. */
  getExportText?: ((row: T) => string) | undefined;
  /** The column's cell in a summary row under the rows, from every row the table presents. */
  renderFooter?: ((rows: readonly T[]) => ReactNode) | undefined;
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

/** The parts of a column that sorting and text search read: its id and its value. */
export type TableValueColumn<T> = Pick<TableColumn<T>, 'id' | 'getValue'>;

const textOrder: Intl.CollatorOptions = { numeric: true, sensitivity: 'base' };

function isCellValue(value: unknown): value is TableCellValue {
  return (
    value === null ||
    value === undefined ||
    isDate(value) ||
    ['string', 'number', 'boolean'].includes(typeof value)
  );
}

/** Whether a cell value reads as text: a string or a number. */
export function isTextValue(value: TableCellValue): value is string | number {
  return typeof value === 'string' || typeof value === 'number';
}

function toSortKey(value: TableCellValue): string | number {
  if (isTextValue(value)) return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return isDate(value) ? value.getTime() : '';
}

/** The value `column` reads from `row`. */
export function getCellValue<T extends TableRow>(
  row: T,
  column: TableValueColumn<T>,
): TableCellValue {
  if (column.getValue) return column.getValue(row);
  const value = (row as unknown as Record<string, unknown>)[column.id];
  return isCellValue(value) ? value : undefined;
}

/** The collation of cell text in `locale`: natural numbers, ignoring case and accents. */
export function getTextCollator(locale: string): Intl.Collator {
  return getCollator(locale, textOrder);
}

/**
 * Orders two cell values: numbers, booleans and dates numerically, text naturally ignoring case
 * by `collator`.
 */
export function compareCellValues(
  left: TableCellValue,
  right: TableCellValue,
  collator: Intl.Collator,
): number {
  const a = toSortKey(left);
  const b = toSortKey(right);
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return collator.compare(String(a), String(b));
}

/** The text of a row's string and number cells in `columns`, or its id when there is none. */
export function getRowText<T extends TableRow>(
  row: T,
  columns: readonly TableValueColumn<T>[],
): string {
  const parts = columns.map((column) => getCellValue(row, column)).filter(isTextValue);
  return parts.length > 0 ? parts.join(' ') : String(row.id);
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
