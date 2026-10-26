import { type CellBounds, type CellGrid } from './table-cell-range.js';
import { type TableCellValue, type TableColumn, type TableRow } from './table-rows.js';
import type { TableCellEdit } from './use-cell-editing.js';
/** One cell to write: its row, its column and the text read as its new value. */
export interface CellWrite<T> {
    row: T;
    column: TableColumn<T>;
    text: string;
}
/** A text read as a cell's value, and the column's message when it refuses the value. */
export interface CellReading {
    value: TableCellValue;
    error: string | null;
}
/** A value as the text a copy writes and a fill reads: dates in ISO 8601, nothing as empty text. */
export declare function formatCellText(value: TableCellValue): string;
/** Typed text as a cell value: a number when the cell held a number and the text reads as one. */
export declare function parseCellText(text: string, previous: TableCellValue): TableCellValue;
/** A text read as a cell's value by the column's `parseValue`, checked by its `validateValue`. */
export declare function readCellText<T extends TableRow>(row: T, column: TableColumn<T>, text: string): CellReading;
/**
 * The edits that writes make, in order: only cells of editable columns in enabled rows, only
 * values the column accepts, and only values that differ from the cell's.
 */
export declare function resolveCellWrites<T extends TableRow>(writes: readonly CellWrite<T>[], isDisabled: (row: T) => boolean): TableCellEdit<T>[];
/** The text of the cells in `bounds` as tab-separated text and as an HTML table. */
export declare function copyBounds<T extends TableRow>(grid: CellGrid<T>, bounds: CellBounds): {
    text: string;
    html: string;
};
/**
 * The writes of pasted rows of text and the cells they cover. One value fills the whole range;
 * more values land from the range's top start cell, as far as the grid reaches.
 */
export declare function planPaste<T>(grid: CellGrid<T>, bounds: CellBounds, block: readonly (readonly string[])[]): {
    writes: CellWrite<T>[];
    bounds: CellBounds;
} | null;
/** Writes that empty every cell of `bounds`. */
export declare function planClear<T>(grid: CellGrid<T>, bounds: CellBounds): CellWrite<T>[];
/**
 * `count` values that follow `values`: an evenly spaced run of numbers continues by its step,
 * rounded to its decimals; anything else repeats in turn.
 */
export declare function extendSeries(values: readonly TableCellValue[], count: number): TableCellValue[];
/**
 * The writes that fill `target` from `source`, the cells at its top start: down, when `target`
 * reaches lower, each column continues its source values; else right, each row does.
 */
export declare function planFill<T extends TableRow>(grid: CellGrid<T>, source: CellBounds, target: CellBounds): CellWrite<T>[];
/**
 * The cells a fill handle dragged from `source` to the cell `at` covers: down when the cell is
 * further below than beyond the end, else towards the end; null over the source or before it.
 */
export declare function resolveFillTarget(source: CellBounds, at: {
    row: number;
    column: number;
}): CellBounds | null;
//# sourceMappingURL=table-cell-writes.d.ts.map