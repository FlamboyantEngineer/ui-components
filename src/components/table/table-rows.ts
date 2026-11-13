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

/**
 * Whether the table writes to a column's cells: through its editor and cell writes
 * (`allowsEditing`) or through the selection bar's bulk edit (`bulkEdit`).
 */
export function acceptsCellWrites<T>(column: TableColumn<T>): boolean {
  return column.allowsEditing === true || column.bulkEdit !== undefined;
}

/** Whether a cell value reads as text: a string or a number. */
export function isTextValue(value: TableCellValue): value is string | number {
  return typeof value === 'string' || typeof value === 'number';
}

/**
 * A cell value as its kind's rank and the key it orders by within that kind: empty values (absent,
 * null, empty text, `NaN` and invalid dates) first, then text, then numbers, booleans and dates by
 * value.
 */
function toSortKey(
  value: TableCellValue,
): readonly [0, ''] | readonly [1, string] | readonly [2, number] {
  const key = typeof value === 'boolean' ? Number(value) : isDate(value) ? value.getTime() : value;
  if (typeof key === 'number') return Number.isNaN(key) ? [0, ''] : [2, key];
  return key === null || key === undefined || key === '' ? [0, ''] : [1, key];
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
 * Orders two cell values in one consistent order: empty values first, then text naturally ignoring
 * case by `collator`, then numbers, booleans and dates numerically.
 */
export function compareCellValues(
  left: TableCellValue,
  right: TableCellValue,
  collator: Intl.Collator,
): number {
  const [leftRank, a] = toSortKey(left);
  const [rightRank, b] = toSortKey(right);
  if (leftRank !== rightRank) return leftRank - rightRank;
  if (typeof a === 'number' && typeof b === 'number') return a < b ? -1 : a > b ? 1 : 0;
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

/** Each row's position in `rows`, by row id, for `isEffectiveTableMove`. */
export function indexRowPositions<T extends TableRow>(rows: readonly T[]): Map<Key, number> {
  return new Map(rows.map((row, index) => [row.id, index]));
}

/**
 * Whether applying `move` would change the order of the rows whose positions are `positions`
 * (`indexRowPositions`), read from where the moved rows and the target stand, without building the
 * moved order: a move changes nothing when its rows already sit together right beside the target.
 */
export function isEffectiveTableMove(
  positions: ReadonlyMap<Key, number>,
  move: TableMove,
): boolean {
  const target = positions.get(move.targetKey);
  const moved = [...new Set(move.keys)]
    .map((key) => positions.get(key))
    .filter((position) => position !== undefined)
    .sort((left, right) => left - right);
  const first = moved[0];
  const last = moved.at(-1);
  if (target === undefined || first === undefined || last === undefined) return false;
  if (moved.includes(target)) return false;
  if (last - first !== moved.length - 1) return true;
  return move.position === 'before' ? last + 1 !== target : first - 1 !== target;
}
