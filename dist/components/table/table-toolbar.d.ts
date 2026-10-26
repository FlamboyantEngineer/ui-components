import type { ReactNode } from 'react';
import type { TableColumn } from './table-rows.js';
import type { ColumnLayout } from './use-column-layout.js';
interface TableToolbarProps<T> {
    /** The search box, for a filterable table. */
    filter: ReactNode;
    /** Every column, in declared order. */
    columns: readonly TableColumn<T>[];
    layout: ColumnLayout<T>;
}
/**
 * The controls above the grid: the search box and, when a column allows hiding, the columns menu.
 * Without either it draws nothing.
 */
export declare function TableToolbar<T>({ filter, columns, layout }: TableToolbarProps<T>): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=table-toolbar.d.ts.map