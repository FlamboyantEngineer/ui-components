import { type CellBounds, type CellGrid, type TableCellRange, type TableCellSelectionMode } from './table-cell-range.js';
import type { TableRow } from './table-rows.js';
import type { TableCellEdit } from './use-cell-editing.js';
/** A table's spreadsheet mode: cell and range selection, the clipboard and filling. */
export interface TableSpreadsheetProps<T> {
    /**
     * Spreadsheet mode: `cell` selects one cell at a time, `range` also rectangles of cells by
     * Shift with arrow keys or a press, or by dragging. Defaults to `none`.
     */
    cellSelection?: TableCellSelectionMode | undefined;
    /** The selected cells, controlled; null selects none. */
    selectedRange?: TableCellRange | null | undefined;
    /** The cells selected at first while the table owns the selection. */
    defaultSelectedRange?: TableCellRange | null | undefined;
    /** Called with the selected cells after each change. */
    onSelectedRangeChange?: ((range: TableCellRange | null) => void) | undefined;
    /**
     * Reports the cells a paste, a fill, clearing or a bulk edit changes, in one batch. The table
     * never changes its rows itself.
     */
    onCellsChange?: ((edits: readonly TableCellEdit<T>[]) => void) | undefined;
}
interface CellSelectionOptions<T> extends TableSpreadsheetProps<T> {
    grid: CellGrid<T>;
    isRowDisabled: (row: T) => boolean;
}
/** What spreadsheet mode draws on the cells, and the handlers for the table root. */
export interface CellSelection<T> {
    mode: TableCellSelectionMode;
    grid: CellGrid<T>;
    /** The selected cells. */
    bounds: CellBounds | null;
    /** The cells a dragged fill handle would fill, while it drags. */
    fillBounds: CellBounds | null;
    rootProps: object;
}
/**
 * Spreadsheet mode: a focused cell and, in `range` mode, rectangles of cells. Shift with arrow
 * keys extends the range; Delete clears it, Control or Command with D or R fills it down or right
 * from its first row or column; copying writes its cells as tab-separated text and HTML, and
 * pasting tab-separated text writes into it. Writes go through each column's reading and checks
 * and are reported in one batch.
 */
export declare function useCellSelection<T extends TableRow>(options: CellSelectionOptions<T>): CellSelection<T>;
export {};
//# sourceMappingURL=use-cell-selection.d.ts.map