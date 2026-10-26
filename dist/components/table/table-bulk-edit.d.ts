import { type ActionRowAction } from '../action-row/action-row.js';
import { type TableColumn, type TableRow } from './table-rows.js';
import type { TableCellEdit } from './use-cell-editing.js';
/**
 * How a bulk edit sets a column across the selected rows: a text, number, date (`YYYY-MM-DD`) or
 * boolean field, or a choice of `options`.
 */
export type TableBulkEdit = {
    type: 'text' | 'number' | 'date' | 'boolean';
} | {
    type: 'choice';
    options: readonly string[];
};
export interface TableSelectionBarProps<T> {
    /** The caller's bulk actions. */
    actions: readonly ActionRowAction[];
    /** The drawn data columns; those with `bulkEdit` can be set. */
    columns: readonly TableColumn<T>[];
    /** The selected rows the table presents. */
    rows: readonly T[];
    onClearSelection: () => void;
    /** Reports the edits a bulk edit makes, in one batch. */
    onEdit: (edits: readonly TableCellEdit<T>[]) => void;
}
/**
 * The selection bar above the grid while rows are selected: the selected count, a button that
 * clears the selection, the caller's bulk actions and, when a drawn column has `bulkEdit`, an
 * action that opens the bulk edit of the selected rows.
 */
export declare function TableSelectionBar<T extends TableRow>(props: TableSelectionBarProps<T>): import("react").JSX.Element;
//# sourceMappingURL=table-bulk-edit.d.ts.map