import type { Key } from '../../core/props.js';
import type { TableColumn, TableRow } from './table-rows.js';
/** `cell` selects one cell at a time; `range` also selects rectangles of cells; `none` neither. */
export type TableCellSelectionMode = 'none' | 'cell' | 'range';
/** A cell, by its row's key and its column's id. */
export interface TableCellPosition {
    rowKey: Key;
    columnId: string;
}
/** A rectangle of cells, from the anchor where selecting started to the focus where it ends. */
export interface TableCellRange {
    anchor: TableCellPosition;
    focus: TableCellPosition;
}
/** A rectangle of the cell grid by inclusive row and column indices. */
export interface CellBounds {
    top: number;
    bottom: number;
    start: number;
    end: number;
}
/** The cells a reader sees: data rows in display order and the drawn data columns. */
export interface CellGrid<T> {
    rows: readonly T[];
    columns: readonly TableColumn<T>[];
    /** Row indices by the collection key the row element carries in `data-key`. */
    rowIndex: ReadonlyMap<string, number>;
    columnIndex: ReadonlyMap<string, number>;
}
/** Where a cell of a range sits: inside it, and on which of its edges. */
export interface RangeCellPlace {
    isInRange: boolean;
    isTop: boolean;
    isBottom: boolean;
    isStart: boolean;
    isEnd: boolean;
    /** The bottom end cell, which holds the fill handle. */
    isCorner: boolean;
}
/** A one-cell range at `position`. */
export declare function createCellRange(position: TableCellPosition): TableCellRange;
/** The grid of the visible rows and drawn columns, with lookups by key and id. */
export declare function createCellGrid<T extends TableRow>(rows: readonly T[], columns: readonly TableColumn<T>[]): CellGrid<T>;
/** The cell at row and column indices, if both are in the grid. */
export declare function getCellPosition<T extends TableRow>(grid: CellGrid<T>, at: {
    row: number;
    column: number;
}): TableCellPosition | null;
/** A cell's row and column indices, or null when the grid does not show it. */
export declare function locateCell<T>(grid: CellGrid<T>, position: TableCellPosition): {
    row: number;
    column: number;
} | null;
/** The rectangle a range covers, or null when the grid shows neither of its corners. */
export declare function getRangeBounds<T>(grid: CellGrid<T>, range: TableCellRange | null): CellBounds | null;
/** The cell `rows` and `columns` steps from `position`, kept inside the grid. */
export declare function stepCell<T extends TableRow>(grid: CellGrid<T>, position: TableCellPosition, step: {
    rows: number;
    columns: number;
}): TableCellPosition;
/** Where the cell at row and column indices sits in `bounds`. */
export declare function placeInBounds(bounds: CellBounds | null, at: {
    row: number;
    column: number;
}): RangeCellPlace;
/** The rows and columns of `bounds`, each cell as its row and column. */
export declare function listBoundsCells<T>(grid: CellGrid<T>, bounds: CellBounds): {
    row: T;
    column: TableColumn<T>;
}[][];
/** The range spanning `bounds`, anchored at its top start cell. */
export declare function createBoundsRange<T extends TableRow>(grid: CellGrid<T>, bounds: CellBounds): TableCellRange | null;
/** Whether two ranges cover the same cells from the same anchor. */
export declare function isSameCellRange(left: TableCellRange | null, right: TableCellRange | null): boolean;
/** The data cell of the table whose root is `root` that holds `target`, if any. */
export declare function findDataCell(target: EventTarget | null, root: HTMLElement): HTMLElement | null;
/** The position of a data cell element in the grid, or null for cells the grid does not hold. */
export declare function readCellPosition<T extends TableRow>(grid: CellGrid<T>, cell: HTMLElement): TableCellPosition | null;
//# sourceMappingURL=table-cell-range.d.ts.map