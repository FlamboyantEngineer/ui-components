import type { Key, SortDescriptor } from '../../core/props.js';
import { type TableColumn, type TableRow } from './table-rows.js';
/** One sort, a list of sorts applied in priority order, or none. */
export type TableSort = SortDescriptor | readonly SortDescriptor[] | null | undefined;
type ValueColumn<T> = Pick<TableColumn<T>, 'id' | 'getValue'>;
/** A sort as a list in priority order. */
export declare function toSortDescriptors(sort: TableSort): readonly SortDescriptor[];
/**
 * A comparison of rows by the sort's columns in priority order, each later column breaking the
 * ties of the earlier ones, or null when no sorted column exists. Each value is read once per row.
 */
export declare function createRowComparator<T extends TableRow>(columns: readonly ValueColumn<T>[], sort: TableSort): ((left: T, right: T) => number) | null;
/**
 * The rows ordered by the sort, one descriptor or several in priority order. Rows the sort cannot
 * separate keep their given order. Without a sort or a matching column the rows are returned
 * unchanged; the input array is never modified.
 */
export declare function sortTableRows<T extends TableRow>(rows: readonly T[], columns: readonly ValueColumn<T>[], sort: TableSort): readonly T[];
/**
 * The sort after a header press, given what React Aria requests: ascending, then descending, then
 * unsorted again.
 */
export declare function nextSortDescriptor(current: SortDescriptor | null, requested: SortDescriptor): SortDescriptor | null;
/**
 * The sort list after a press on `column`'s header. Its direction steps from unsorted to
 * ascending, descending and unsorted again. A plain press sorts by that column alone; an additive
 * press (with Shift) keeps the other columns, changing the column in place or adding it last.
 */
export declare function nextSortDescriptors(current: readonly SortDescriptor[], column: Key, isAdditive: boolean): SortDescriptor[];
export {};
//# sourceMappingURL=table-sort.d.ts.map