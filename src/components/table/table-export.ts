import { type CsvOptions, formatCsv } from '../../utils/csv.js';
import { walkTree } from '../../utils/walk-tree.js';
import { formatCellText } from './table-cell-writes.js';
import { getColumnText } from './table-columns.js';
import { getCellValue, type TableColumn, type TableRow } from './table-rows.js';
import { buildTableNodes, type TableChildRows, type TableNode } from './table-tree.js';

/**
 * Which rows an export writes: `page` the current page, `rows` every row the table presents across
 * pages (or the caller's `allRows`), `selected` the selected rows.
 */
export type TableExportScope = 'page' | 'rows' | 'selected';

/** A table's CSV export: an export menu above the grid that writes one scope of rows to a file. */
export interface TableCsvExport<T> extends CsvOptions {
  /** The file's name, such as `fruit.csv`. */
  fileName: string;
  /**
   * The scopes the menu offers, in order. Defaults to `page` when paginated, `rows`, and `selected`
   * in multiple selection.
   */
  scopes?: readonly TableExportScope[] | undefined;
  /** The ids of the columns to write, in order, hidden ones included. Defaults to the drawn columns. */
  columns?: readonly string[] | undefined;
  /**
   * Every row of the dataset, for rows the caller pages or loads in parts: the `rows` scope writes
   * these, with their child rows, as given. Without it that scope writes the loaded rows.
   */
  allRows?: readonly T[] | undefined;
  /** Starts the downloaded file with a UTF-8 byte order mark. Defaults to true. */
  byteOrderMark?: boolean | undefined;
  /** Receives the file instead of downloading it. */
  onExport?: ((file: TableExportFile) => void) | undefined;
}

/** An exported file: its name, the scope it holds and its CSV text, without a byte order mark. */
export interface TableExportFile {
  fileName: string;
  scope: TableExportScope;
  text: string;
}

/** What `formatTableCsv` writes: the rows, in order, under a header row of the columns' names. */
export interface TableCsvSource<T> extends CsvOptions {
  rows: readonly T[];
  columns: readonly TableColumn<T>[];
}

/** The rows of each scope, as the table holds them. */
export interface TableExportRows<T> {
  /** The current page's top-level rows, with their presented child rows. */
  page: readonly TableNode<T>[];
  /** Every page's top-level rows, with their presented child rows. */
  presented: readonly TableNode<T>[];
  /** The selected rows, in order. */
  selected: readonly T[];
  getChildRows: TableChildRows<T>;
}

function listNodeRows<T>(nodes: readonly TableNode<T>[]): T[] {
  return Array.from(
    walkTree(nodes, (node) => node.children),
    (node) => node.row,
  );
}

/** A cell's exported text: the column's `getExportText`, else its value as copied text. */
function readExportText<T extends TableRow>(row: T, column: TableColumn<T>): string {
  return column.getExportText
    ? column.getExportText(row)
    : formatCellText(getCellValue(row, column));
}

/**
 * Rows as CSV under a header row of the columns' accessible names. Each cell is the column's
 * `getExportText`, else its value as text (dates in ISO 8601, nothing as empty text); rendered
 * content is never read.
 */
export function formatTableCsv<T extends TableRow>(source: TableCsvSource<T>): string {
  const { rows, columns, ...options } = source;
  const header = columns.map((column) => getColumnText(column));
  const body = rows.map((row) => columns.map((column) => readExportText(row, column)));
  return formatCsv([header, ...body], options);
}

/** The rows a scope writes, depth first: child rows follow their parent whether or not it is open. */
export function listExportRows<T extends TableRow>(
  scope: TableExportScope,
  rows: TableExportRows<T>,
  allRows: readonly T[] | undefined,
): readonly T[] {
  if (scope === 'selected') return rows.selected;
  if (scope === 'page') return listNodeRows(rows.page);
  return listNodeRows(allRows ? buildTableNodes(allRows, rows.getChildRows) : rows.presented);
}

/**
 * The columns an export writes: those named by `ids`, in that order, else the drawn ones. An id no
 * column has is skipped.
 */
export function resolveExportColumns<T>(
  ids: readonly string[] | undefined,
  columns: readonly TableColumn<T>[],
  drawn: readonly TableColumn<T>[],
): readonly TableColumn<T>[] {
  if (!ids) return drawn;
  return ids.flatMap((id) => columns.filter((column) => column.id === id));
}
