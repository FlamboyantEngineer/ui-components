/** A cell of the grid: `-1` is the header row or the row header column. */
export interface MatrixPosition {
    row: number;
    column: number;
}
export interface MatrixKeyOptions {
    key: string;
    /** Control or Command was held: Home and End then reach the first and last rows too. */
    isPrimaryModifier: boolean;
    isRightToLeft: boolean;
    rowCount: number;
    columnCount: number;
    /** Rows PageUp and PageDown move by. */
    pageSize: number;
}
/**
 * The cell a key moves focus to from `position`, or null for a key that does not move it. Arrow
 * keys move one cell (left and right swap in right-to-left text), PageUp and PageDown a page of
 * rows, Home and End to the start or end of the row, and with Control or Command to the first or
 * last cell of the grid.
 */
export declare function moveMatrixFocus(position: MatrixPosition, options: MatrixKeyOptions): MatrixPosition | null;
/** `position` moved inside a grid that shrank to `rowCount` rows and `columnCount` columns. */
export declare function clampMatrixPosition(position: MatrixPosition, rowCount: number, columnCount: number): MatrixPosition;
//# sourceMappingURL=matrix-navigation.d.ts.map