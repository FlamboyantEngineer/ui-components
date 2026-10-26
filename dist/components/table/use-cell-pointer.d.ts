import { type PointerEvent } from 'react';
import { type CellBounds, type CellGrid, type TableCellRange, type TableCellSelectionMode } from './table-cell-range.js';
import { type CellWrite } from './table-cell-writes.js';
import type { TableRow } from './table-rows.js';
interface CellPointerOptions<T> {
    mode: TableCellSelectionMode;
    grid: CellGrid<T>;
    range: TableCellRange | null;
    bounds: CellBounds | null;
    setRange: (range: TableCellRange | null) => void;
    /** Writes the cells a fill covers. */
    write: (writes: readonly CellWrite<T>[]) => void;
}
export interface CellPointer {
    /** The cells a dragged fill handle would fill, while it drags. */
    fillBounds: CellBounds | null;
    rootProps: {
        onPointerDownCapture: (event: PointerEvent<HTMLElement>) => void;
        onPointerOver: (event: PointerEvent<HTMLElement>) => void;
    };
}
/**
 * Selecting cells by pointer in spreadsheet mode: a press selects a cell and focuses it, Shift
 * with a press extends the range to the pressed cell, dragging extends it to the cell under the
 * pointer, and dragging the fill handle fills the cells it reaches when the pointer is released.
 * Presses on data cells select cells rather than rows; controls inside cells keep their presses.
 */
export declare function useCellPointer<T extends TableRow>(options: CellPointerOptions<T>): CellPointer;
export {};
//# sourceMappingURL=use-cell-pointer.d.ts.map