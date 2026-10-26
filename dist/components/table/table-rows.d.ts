import type { ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import type { TableColumnSizing } from './column-sizing.js';
import type { TableBulkEdit } from './table-bulk-edit.js';
import type { TableColumnFilter } from './table-filters.js';
import type { TableAggregate } from './table-groups.js';
/** A value a cell sorts and filters on. */
export type TableCellValue = string | number | boolean | Date | null | undefined;
/** A table row: any object with a stable `id`. */
export interface TableRow {
    /** The row's key, unique in the table. */
    id: Key;
}
export type TableColumnAlign = 'start' | 'center' | 'end';
/** The edge a column stays at while the table scrolls sideways. */
export type TableColumnPin = 'start' | 'end';
/** What a custom cell editor receives. */
export interface TableCellEditor {
    /** The cell's value when editing started. */
    value: TableCellValue;
    /** The column's accessible name, for the editor's label. */
    label: string;
    /** Ends editing and reports `value` as the cell's new value. */
    commit: (value: TableCellValue) => void;
    /** Ends editing without a change. */
    cancel: () => void;
}
/** One data column: its header, how its cells read and render, and how it sorts and sizes. */
export interface TableColumn<T> extends TableColumnSizing {
    /** The header content. */
    header: ReactNode;
    /** Accessible name when the header is not plain text. */
    textValue?: string | undefined;
    /** The value the cell sorts and filters on. Defaults to the row's property named by `id`. */
    getValue?: ((row: T) => TableCellValue) | undefined;
    /** The cell's content. Defaults to the value as text when it is a string or a number. */
    renderCell?: ((row: T) => ReactNode) | undefined;
    /** Alignment of the header and cells. Defaults to `start`. */
    align?: TableColumnAlign | undefined;
    /** Whether a header press sorts by this column. */
    allowsSorting?: boolean | undefined;
    /** Whether the column draws a resizer. */
    allowsResizing?: boolean | undefined;
    /** Names the row for assistive technology. Defaults to the first column. */
    isRowHeader?: boolean | undefined;
    /** Keeps the column in view at the start or end of the table while it scrolls sideways. */
    pin?: TableColumnPin | undefined;
    /** Whether the columns menu lists the column, so the reader can hide and show it. */
    allowsHiding?: boolean | undefined;
    /** Whether the reader can move the column by dragging its header or with Alt+Arrow keys. */
    allowsReordering?: boolean | undefined;
    /** Draws a filter button in the header that filters the rows by this column's values. */
    filter?: TableColumnFilter | undefined;
    /** Whether the reader can edit the column's cells: F2, Enter or a double click opens an editor. */
    allowsEditing?: boolean | undefined;
    /** A cell's editor, instead of the default text input. */
    renderEditor?: ((row: T, editor: TableCellEditor) => ReactNode) | undefined;
    /**
     * Reads typed, pasted or filled text as the cell's value. Defaults to the text, or a number when
     * the cell holds a number and the text reads as one.
     */
    parseValue?: ((text: string, row: T) => TableCellValue) | undefined;
    /** Checks a new value of the cell: a message refuses it, null or nothing accepts it. */
    validateValue?: ((value: TableCellValue, row: T) => string | null | undefined) | undefined;
    /** Lists the column in the bulk edit of selected rows, which sets it with a field of this type. */
    bulkEdit?: TableBulkEdit | undefined;
    /** The column's cell in group header rows, from the group's rows. */
    aggregate?: TableAggregate<T> | undefined;
    /** The column's cell in a summary row under the rows, from every row the table presents. */
    renderFooter?: ((rows: readonly T[]) => ReactNode) | undefined;
}
/** A reorder request: move `keys` before or after the row `targetKey`. */
export interface TableMove {
    /** The moved rows. */
    keys: Key[];
    /** The row the moved rows land beside. */
    targetKey: Key;
    /** Which side of the target they land on. */
    position: 'before' | 'after';
}
type ValueColumn<T> = Pick<TableColumn<T>, 'id' | 'getValue'>;
/** Whether a cell value reads as text: a string or a number. */
export declare function isTextValue(value: TableCellValue): value is string | number;
/** The value `column` reads from `row`. */
export declare function getCellValue<T extends TableRow>(row: T, column: ValueColumn<T>): TableCellValue;
/** Orders two cell values: numbers, booleans and dates numerically, text naturally ignoring case. */
export declare function compareCellValues(left: TableCellValue, right: TableCellValue): number;
/** The text of a row's string and number cells in `columns`, or its id when there is none. */
export declare function getRowText<T extends TableRow>(row: T, columns: readonly ValueColumn<T>[]): string;
/** A copy of `rows` with the moved rows, in their current order, placed beside the target. */
export declare function applyTableMove<T extends TableRow>(rows: readonly T[], move: TableMove): T[];
/** Whether applying `move` would change the order of `rows`. */
export declare function isEffectiveTableMove<T extends TableRow>(rows: readonly T[], move: TableMove): boolean;
export {};
//# sourceMappingURL=table-rows.d.ts.map