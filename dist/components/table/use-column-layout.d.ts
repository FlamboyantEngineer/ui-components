import { type TableColumnLayout, type TableColumnMove } from './table-columns.js';
import type { TableColumn } from './table-rows.js';
export interface ColumnLayoutOptions<T> {
    columns: readonly TableColumn<T>[];
    /** Controlled layout. */
    columnLayout?: TableColumnLayout | undefined;
    /** Initial layout while the table owns it and nothing is stored. */
    defaultColumnLayout?: TableColumnLayout | undefined;
    onColumnLayoutChange?: ((layout: TableColumnLayout) => void) | undefined;
    /** The table's storage key; the layout persists under `<key>:layout`. */
    persistKey?: string | undefined;
}
export interface ColumnLayout<T> {
    layout: TableColumnLayout;
    /** The columns the table draws, in display order. */
    visibleColumns: readonly TableColumn<T>[];
    /** Shows only the given hideable columns; the others stay as they are. */
    setHidden: (hidden: readonly string[]) => void;
    /** Moves a column; moves between columns pinned to different edges do nothing. */
    moveColumn: (move: TableColumnMove) => void;
}
/**
 * The order and visibility of a table's columns: the caller's when controlled, else the table's
 * own, persisted under `<persistKey>:layout` and restored on mount.
 */
export declare function useColumnLayout<T>(options: ColumnLayoutOptions<T>): ColumnLayout<T>;
//# sourceMappingURL=use-column-layout.d.ts.map