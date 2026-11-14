import { type CsvOptions, formatCsv } from '../../utils/csv.js';
import { formatCellText } from './table-cell-writes.js';
import { getColumnText } from './table-columns.js';
import { getCellValue, type TableColumn, type TableRow } from './table-rows.js';

/** What `formatTableCsv` writes: the rows, in order, under a header row of the columns' names. */
export interface TableCsvSource<T> extends CsvOptions {
  rows: readonly T[];
  columns: readonly TableColumn<T>[];
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
