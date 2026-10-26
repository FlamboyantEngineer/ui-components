import type { DateRangeValue } from '../date-time-field/date-time-field.js';
import { type TableColumn, type TableRow } from './table-rows.js';
/**
 * How a column filters: `text` keeps cells containing the text, `number` and `date` keep cells
 * inside a range, and `set` keeps cells holding one of the ticked values, listed from `options` or
 * else from the values in the rows.
 */
export type TableColumnFilter = {
    type: 'text' | 'number' | 'date';
} | {
    type: 'set';
    options?: readonly string[] | undefined;
};
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
/** Whether a column filter value filters nothing: empty text, no ticked values or open bounds. */
export declare function isEmptyFilterValue(value: TableColumnFilterValue | undefined): boolean;
/** `filter` with one column's value replaced, or removed when `value` is null or filters nothing. */
export declare function setColumnFilter(filter: TableFilter, columnId: string, value: TableColumnFilterValue | null): TableFilter;
/**
 * A test of a row against the filter: its text in `columns` contains every term of the query, and
 * each filtered column's cell passes that column's filter. Null when the filter keeps every row.
 */
export declare function createRowMatcher<T extends TableRow>(columns: readonly FilterColumn<T>[], filter: TableFilter): ((row: T) => boolean) | null;
/**
 * The rows the filter keeps: the query's terms are searched in the text of `columns`, and each
 * column value applies that column's filter. The input array is never modified.
 */
export declare function filterTableRows<T extends TableRow>(rows: readonly T[], columns: readonly FilterColumn<T>[], filter: TableFilter): readonly T[];
/** The values a `set` filter offers: its `options`, else the distinct values in the rows, sorted. */
export declare function listFilterOptions<T extends TableRow>(rows: readonly T[], column: FilterColumn<T>): readonly string[];
export {};
//# sourceMappingURL=table-filters.d.ts.map