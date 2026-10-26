import { type KeyboardEvent, type PointerEvent } from 'react';
import type { SortDescriptor } from '../../core/props.js';
/** A table's sort props: one column, or several in priority order. */
export interface TableSortOptions {
    /** Controlled sort. The caller supplies `rows` in that order; the header reports it. */
    sortDescriptor?: SortDescriptor | null | undefined;
    /** Initial sort while the table owns the sort and orders `rows` itself. */
    defaultSortDescriptor?: SortDescriptor | null | undefined;
    /** Called on each header press: ascending, descending, then `null` for unsorted. */
    onSortChange?: ((descriptor: SortDescriptor | null) => void) | undefined;
    /**
     * Controlled sort by several columns in priority order, which turns on multiple sort: Shift with a
     * header press adds that column. The caller supplies `rows` in that order.
     */
    sortDescriptors?: readonly SortDescriptor[] | undefined;
    /** Initial sort by several columns while the table owns the sort; turns on multiple sort. */
    defaultSortDescriptors?: readonly SortDescriptor[] | undefined;
    /** Called with the sort list after each header press in multiple sort. */
    onSortDescriptorsChange?: ((descriptors: readonly SortDescriptor[]) => void) | undefined;
}
/** The sort a table applies and shows. */
export interface TableSortState {
    /** The sorted columns in priority order. */
    descriptors: readonly SortDescriptor[];
    /** The caller orders the rows. */
    isControlled: boolean;
    /** Several columns can sort at once. */
    isMultiple: boolean;
    /** Takes the sort React Aria requests for a header press. */
    onSortChange: (requested: SortDescriptor) => void;
    /** Root handlers that note whether the press that sorts holds Shift. */
    rootProps: {
        onPointerDownCapture: (event: PointerEvent<HTMLElement>) => void;
        onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
    };
}
/**
 * A table's sort: one column cycling through ascending, descending and unsorted, or, with a sort
 * list, several columns where a plain press sorts by one column and Shift adds or cycles a column.
 * `onChange` runs after every change, so the table can return to its first page.
 */
export declare function useTableSort(options: TableSortOptions, onChange: () => void): TableSortState;
//# sourceMappingURL=use-table-sort.d.ts.map