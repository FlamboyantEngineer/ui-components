/** A cell of a grid by zero-based row and column indices. */
export interface CellCoordinates {
    row: number;
    column: number;
}
/**
 * The A1-style reference of a cell: column letters (`A` to `Z`, then `AA`) and the one-based row
 * number, such as `C12` for row 11, column 2.
 */
export declare function formatCellReference({ row, column }: CellCoordinates): string;
/**
 * The cell an A1-style reference names, ignoring case, surrounding spaces and the `$` marks of an
 * absolute reference, or null when the text is not a single cell reference.
 */
export declare function parseCellReference(text: string): CellCoordinates | null;
//# sourceMappingURL=cell-reference.d.ts.map