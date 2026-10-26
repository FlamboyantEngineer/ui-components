import type { ReactNode } from 'react';
import type { SortDirection } from '../../core/props.js';
import { type TableColumnSize } from './column-sizing.js';
import type { TableColumn, TableColumnPin } from './table-rows.js';
/** What a data column header shows beyond the column's own declaration. */
export interface TableColumnHeaderState {
    width: TableColumnSize;
    isRowHeader: boolean;
    pin: TableColumnPin | undefined;
    /** The pinned header's distance from its edge, in pixels. */
    pinOffset: number | undefined;
    sortDirection: SortDirection | undefined;
    /** The column's place in a sort by several columns, from 1. */
    sortPriority: number | undefined;
    /** Where a dragged column would land beside this one. */
    dropPosition: 'before' | 'after' | undefined;
    isFiltered: boolean;
    /** The filter button, for a filterable column. */
    filter: ReactNode;
    /** Measures the drawn columns from inside the header; the first data column holds it. */
    probe: ReactNode;
}
/** The accessible name of a column. */
export declare function getColumnText<T>(column: TableColumn<T>): string;
/**
 * One data column header: its label, which drags a reorderable column, the sort glyph, the filter
 * button and the resizer, with its pin, sort, filter and drop states.
 */
export declare function DataColumn<T>({ column, state, }: {
    column: TableColumn<T>;
    state: TableColumnHeaderState;
}): import("react").JSX.Element;
//# sourceMappingURL=table-column.d.ts.map