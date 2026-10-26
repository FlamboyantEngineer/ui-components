import type { CSSProperties } from 'react';
import type { TableColumn, TableColumnPin } from './table-rows.js';
/** Which columns a table draws around its data columns, and how they behave. */
export interface TableStructure<T> {
    /** The drawn data columns, in display order. */
    columns: readonly TableColumn<T>[];
    hasSelection: boolean;
    hasActions: boolean;
    actionsColumnWidth: number;
    /** The data column that holds the expand buttons of nested and detail rows, if any. */
    treeColumn: string | null;
    /** The table renders only the rows in view and positions every cell itself, so pins nothing. */
    isVirtualized: boolean;
}
/** The keys of the selection and actions columns. */
export declare const selectionColumnId = "ui-table-selection";
export declare const actionsColumnId = "ui-table-actions";
/** The columns that name a row: those marked `isRowHeader`, else the first. */
export declare function getRowHeaderColumns<T>(columns: readonly TableColumn<T>[]): readonly TableColumn<T>[];
/** The number of columns a row spans: data columns plus the selection and actions columns. */
export declare function countTableColumns<T>(structure: TableStructure<T>): number;
/**
 * The edge a column is pinned to. The selection column pins with the start columns and the actions
 * column with the end columns, so they stay beside the rows they act on.
 */
export declare function getColumnPin<T>(structure: TableStructure<T>, column: TableColumn<T> | 'selection' | 'actions'): TableColumnPin | undefined;
/** The inline style of a pinned header or cell: its measured distance from its edge. */
export declare function getPinStyle(pin: TableColumnPin | undefined, offset: number | undefined): CSSProperties | undefined;
//# sourceMappingURL=table-structure.d.ts.map