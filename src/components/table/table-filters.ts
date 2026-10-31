import type { DateRangeValue } from '../date-time-field/date-time-field.js';
import {
  getCellValue,
  getRowText,
  getTextCollator,
  isTextValue,
  type TableCellValue,
  type TableColumn,
  type TableRow,
} from './table-rows.js';

/**
 * How a column filters: `text` keeps cells containing the text, `number` and `date` keep cells
 * inside a range, and `set` keeps cells holding one of the ticked values, listed from `options` or
 * else from the values in the rows.
 */
export type TableColumnFilter =
  | { type: 'text' | 'number' | 'date' }
  | { type: 'set'; options?: readonly string[] | undefined };

/** A range a `number` column filter keeps; either bound may be open. */
export interface TableNumberRange {
  min?: number | null | undefined;
  max?: number | null | undefined;
}

/**
 * One column's filter value: the text of a `text` filter, a `TableNumberRange`, a range of
 * `YYYY-MM-DD` dates, or the ticked values of a `set` filter.
 */
export type TableColumnFilterValue = string | TableNumberRange | DateRangeValue | readonly string[];

/** Everything that filters a table: the search query and each filtered column's value. */
export interface TableFilter {
  /** Keeps the rows whose text contains every whitespace-separated term, ignoring case. */
  query?: string | undefined;
  /** Filter values by column id. */
  columns?: Readonly<Record<string, TableColumnFilterValue>> | undefined;
}

type FilterColumn<T> = Pick<TableColumn<T>, 'id' | 'getValue' | 'filter'>;

type CellTest = (value: TableCellValue) => boolean;

const isoDay = /^\d{4}-\d{2}-\d{2}/;

function isNumberRange(value: TableColumnFilterValue): value is TableNumberRange {
  return typeof value === 'object' && !Array.isArray(value) && !('start' in value);
}

function isDateRange(value: TableColumnFilterValue): value is DateRangeValue {
  return typeof value === 'object' && !Array.isArray(value) && 'start' in value;
}

function isBound(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** A cell's day as `YYYY-MM-DD`, from a date or a text starting with one, in local time. */
function toDay(value: TableCellValue): string | null {
  if (value instanceof Date) {
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return Number.isNaN(value.getTime()) ? null : `${value.getFullYear()}-${month}-${day}`;
  }
  return typeof value === 'string' && isoDay.test(value) ? value.slice(0, 10) : null;
}

function testText(text: string): CellTest {
  const needle = text.trim().toLowerCase();
  return (value) => isTextValue(value) && String(value).toLowerCase().includes(needle);
}

function testNumber({ min, max }: TableNumberRange): CellTest {
  return (value) =>
    typeof value === 'number' && (!isBound(min) || value >= min) && (!isBound(max) || value <= max);
}

function testDate({ start, end }: DateRangeValue): CellTest {
  return (value) => {
    const day = toDay(value);
    return day !== null && day >= start && day <= end;
  };
}

function testSet(values: readonly string[]): CellTest {
  const ticked = new Set(values);
  return (value) => value !== null && value !== undefined && ticked.has(String(value));
}

/** The test a column's filter value makes of a cell, or null when the value filters nothing. */
function createCellTest(value: TableColumnFilterValue): CellTest | null {
  if (typeof value === 'string') return value.trim() ? testText(value) : null;
  if (Array.isArray(value)) return value.length > 0 ? testSet(value) : null;
  if (isDateRange(value)) return testDate(value);
  if (isNumberRange(value))
    return isBound(value.min) || isBound(value.max) ? testNumber(value) : null;
  return null;
}

/** Whether a column filter value filters nothing: empty text, no ticked values or open bounds. */
export function isEmptyFilterValue(value: TableColumnFilterValue | undefined): boolean {
  return value === undefined || createCellTest(value) === null;
}

/** `filter` with one column's value replaced, or removed when `value` is null or filters nothing. */
export function setColumnFilter(
  filter: TableFilter,
  columnId: string,
  value: TableColumnFilterValue | null,
): TableFilter {
  const { [columnId]: _previous, ...others } = filter.columns ?? {};
  const columns =
    value === null || isEmptyFilterValue(value) ? others : { ...others, [columnId]: value };
  return { ...filter, columns };
}

/**
 * A test of a row against the filter: its text in `columns` contains every term of the query, and
 * each filtered column's cell passes that column's filter. Null when the filter keeps every row.
 */
export function createRowMatcher<T extends TableRow>(
  columns: readonly FilterColumn<T>[],
  filter: TableFilter,
): ((row: T) => boolean) | null {
  const terms = (filter.query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  const tests = Object.entries(filter.columns ?? {}).flatMap(([id, value]) => {
    const column = columns.find((candidate) => candidate.id === id);
    const test = createCellTest(value);
    return column && test ? [{ column, test }] : [];
  });
  if (terms.length === 0 && tests.length === 0) return null;
  return (row) => {
    const text = terms.length > 0 ? getRowText(row, columns).toLowerCase() : '';
    return (
      terms.every((term) => text.includes(term)) &&
      tests.every(({ column, test }) => test(getCellValue(row, column)))
    );
  };
}

/**
 * The rows the filter keeps: the query's terms are searched in the text of `columns`, and each
 * column value applies that column's filter. The input array is never modified.
 */
export function filterTableRows<T extends TableRow>(
  rows: readonly T[],
  columns: readonly FilterColumn<T>[],
  filter: TableFilter,
): readonly T[] {
  const matches = createRowMatcher(columns, filter);
  return matches ? rows.filter(matches) : rows;
}

/**
 * The values a `set` filter offers: its `options`, else the distinct values in the rows, sorted
 * naturally in `locale`. A table passes every row it holds, nested rows included.
 */
export function listFilterOptions<T extends TableRow>(
  rows: Iterable<T>,
  column: FilterColumn<T>,
  locale: string,
): readonly string[] {
  if (column.filter?.type === 'set' && column.filter.options) return column.filter.options;
  const values = new Set<string>();
  for (const row of rows) {
    const value = getCellValue(row, column);
    if (value !== null && value !== undefined && value !== '') values.add(String(value));
  }
  const collator = getTextCollator(locale);
  return [...values].sort((left, right) => collator.compare(left, right));
}
