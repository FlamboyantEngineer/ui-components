import { isDate } from '../../utils/is-date.js';
import {
  getCellValue,
  type TableCellValue,
  type TableColumn,
  type TableRow,
} from './table-rows.js';

/** A text read as a cell's value, and the column's message when it refuses the value. */
export interface CellReading {
  value: TableCellValue;
  error: string | null;
}

/**
 * A value as text for CSV or the initial editor value: dates in ISO 8601,
 * nothing and an invalid date as empty text.
 */
export function formatCellText(value: TableCellValue): string {
  if (isDate(value)) return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  return value === null || value === undefined ? '' : String(value);
}

/** Plain decimal text: a sign, digits and a fraction, with no hex, binary, octal or exponent form. */
const decimalText = /^\s*[+-]?(?:\d+\.?\d*|\.\d+)\s*$/;

/**
 * Typed text as a cell value: a number when the cell held a number and the text is plain decimal
 * text whose size a number holds exactly; any other text stays text.
 */
export function parseCellText(text: string, previous: TableCellValue): TableCellValue {
  if (typeof previous !== 'number' || !decimalText.test(text)) return text;
  const number = Number(text);
  return Math.abs(number) <= Number.MAX_SAFE_INTEGER ? number : text;
}

/** A text read as a cell's value by the column's `parseValue`, checked by its `validateValue`. */
export function readCellText<T extends TableRow>(
  row: T,
  column: TableColumn<T>,
  text: string,
): CellReading {
  const value = column.parseValue
    ? column.parseValue(text, row)
    : parseCellText(text, getCellValue(row, column));
  return { value, error: column.validateValue?.(value, row) ?? null };
}
