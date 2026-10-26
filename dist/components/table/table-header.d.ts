import { type JSX, type ReactNode } from 'react';
import type { SortDescriptor } from '../../core/props.js';
import { type TableColumnWidths } from './column-sizing.js';
import { type TableColumnGroup } from './table-columns.js';
import type { TableColumn } from './table-rows.js';
import { type TableStructure } from './table-structure.js';
import type { TableColumnDropTarget } from './use-column-reorder.js';
import { type TablePinOffsets } from './use-pinned-offsets.js';
/** What the header row shows: widths, groups, pins, the sort, drops and filters. */
export interface TableHeaderModel<T> {
    widths: TableColumnWidths;
    /** Group headers drawn in a row above the column headers; empty draws none. */
    groups: readonly TableColumnGroup[];
    pinOffsets: TablePinOffsets;
    /** Takes the pinned offsets the header measures. */
    onPinOffsets: (offsets: TablePinOffsets) => void;
    /** The sorted columns in priority order. */
    sort: readonly SortDescriptor[];
    /** Several columns can sort at once, so sorted headers show their priority. */
    isMultipleSort: boolean;
    dropTarget: TableColumnDropTarget | null;
    /** The filter button of a filterable column, else null. */
    renderFilter: (column: TableColumn<T>) => ReactNode;
    isFiltered: (column: TableColumn<T>) => boolean;
}
interface TableHeaderProps<T> {
    structure: TableStructure<T>;
    model: TableHeaderModel<T>;
}
/** The selection checkbox of a row, or the select-all checkbox of the header. */
export declare function TableCheckbox(): JSX.Element;
/** Whether the header draws a group row: groups exist and the table is not virtualized. */
export declare function hasGroupRow<T>(structure: TableStructure<T>, groups: readonly unknown[]): boolean;
/** The grid's `table` element with column tracks first, for a table with a group row. */
export declare function renderTableWithTracks(props: JSX.IntrinsicElements['table'] | JSX.IntrinsicElements['div']): JSX.Element;
/**
 * The header: an optional row of group headers, then the select-all checkbox, the data columns and
 * the actions column. A virtualized table positions its header rows itself and draws no groups.
 */
export declare function TableHeader<T>(props: TableHeaderProps<T>): JSX.Element;
export {};
//# sourceMappingURL=table-header.d.ts.map