import { type FocusEvent, type KeyboardEvent, type RefObject } from 'react';
import { type MatrixPosition } from './matrix-navigation.js';
export interface MatrixNavigationOptions {
    root: RefObject<HTMLDivElement | null>;
    rowCount: number;
    columnCount: number;
    /** Called when Enter or Space is pressed on a body cell. */
    onCellAction: (position: MatrixPosition) => void;
}
/** A matrix grid's focused cell (its single tab stop) and the props that move it. */
export interface MatrixNavigation {
    focus: MatrixPosition;
    isFocusWithin: boolean;
    gridProps: {
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
        onFocus: (event: FocusEvent<HTMLDivElement>) => void;
        onBlur: (event: FocusEvent<HTMLDivElement>) => void;
    };
}
/** The selector of the cell at `position`, through the grid's row and column indices. */
export declare function selectMatrixCell({ row, column }: MatrixPosition): string;
/**
 * Grid keyboard navigation over a matrix with a header row and a row header column: arrow keys,
 * PageUp, PageDown, Home and End (with Control or Command, Home and End reach the corners) move
 * the focused cell, which holds the grid's only tab stop and scrolls into view; focus landing on a
 * cell by pointer makes it the focused cell.
 */
export declare function useMatrixNavigation({ root, rowCount, columnCount, onCellAction, }: MatrixNavigationOptions): MatrixNavigation;
//# sourceMappingURL=use-matrix-navigation.d.ts.map