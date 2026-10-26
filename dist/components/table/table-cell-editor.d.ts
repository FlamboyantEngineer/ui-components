import { type TableColumn, type TableRow } from './table-rows.js';
import type { CellEditing } from './use-cell-editing.js';
interface TableCellEditorViewProps<T> {
    row: T;
    column: TableColumn<T>;
    editing: Pick<CellEditing<T>, 'editing' | 'commit' | 'cancel' | 'release' | 'dismiss'>;
    /** Spreadsheet mode: Enter and Tab commit and move to the next cell. */
    movesOnCommit: boolean;
}
/**
 * The editor of the cell being edited: the column's own editor, or a text input. Escape cancels;
 * while it is open the grid's arrow-key navigation is off so the editor keeps its keys.
 */
export declare function TableCellEditorView<T extends TableRow>({ row, column, editing, movesOnCommit, }: TableCellEditorViewProps<T>): import("react").JSX.Element;
export {};
//# sourceMappingURL=table-cell-editor.d.ts.map