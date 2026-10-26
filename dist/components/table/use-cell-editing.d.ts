import { type KeyboardEvent, type MouseEvent } from 'react';
import type { TableCellValue, TableColumn, TableRow } from './table-rows.js';
/** A finished cell edit: the row, the column and the cell's new value. */
export interface TableCellEdit<T> {
    row: T;
    columnId: string;
    value: TableCellValue;
}
/** The cell being edited, by its row's collection key and column id, with its initial typed character. */
export interface TableEditingCell {
    rowKey: string;
    columnId: string;
    /** The character typed on the cell that opened its editor, which replaces the cell's text. */
    text?: string | undefined;
}
/** Where focus moves after a commit: to the cell below or above, or the next cell along the row. */
export type CellMove = 'down' | 'up' | 'start' | 'end';
export interface CellEditing<T> {
    /** The cell being edited, if any. */
    editing: TableEditingCell | null;
    /**
     * Ends editing and reports the value; focus returns to the cell, or moves to the next cell in
     * the direction of `move`, unless it moved elsewhere.
     */
    commit: (edit: TableCellEdit<T>, move?: CellMove) => void;
    /** Ends editing without a change; focus returns to the cell. */
    cancel: () => void;
    /** Ends editing because focus left the editor, leaving focus where it went. */
    release: (edit: TableCellEdit<T>) => void;
    /** Ends editing without a change because focus left the editor. */
    dismiss: () => void;
    /** Handlers for the table root: F2, Enter or a double click on an editable cell opens its editor. */
    rootProps: {
        onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
        onDoubleClickCapture: (event: MouseEvent<HTMLElement>) => void;
    };
}
interface CellEditingOptions<T> {
    columns: readonly TableColumn<T>[];
    onCellEdit?: ((edit: TableCellEdit<T>) => void) | undefined;
    /** Spreadsheet mode: typing a character on an editable cell opens its editor with it. */
    typeToEdit: boolean;
}
/** Whether `editing` is the cell of `row` in the column `columnId`. */
export declare function isEditingCell<T extends TableRow>(editing: TableEditingCell | null, row: T, columnId: string): boolean;
/**
 * Cell editing: one cell at a time opens an editor from F2, Enter or a double click, and a commit
 * reports the new value through `onCellEdit`. The table never changes its rows itself.
 */
export declare function useCellEditing<T extends TableRow>({ columns, onCellEdit, typeToEdit, }: CellEditingOptions<T>): CellEditing<T>;
export {};
//# sourceMappingURL=use-cell-editing.d.ts.map