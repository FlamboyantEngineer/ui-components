import { type RefObject, type UIEvent } from 'react';
import { type MatrixColumnTracks } from './matrix-window.js';
import type { MatrixPosition } from './matrix-navigation.js';
export interface MatrixWindowOptions {
    /** The scroll container. */
    root: RefObject<HTMLDivElement | null>;
    /** The header row, whose height the rows start below. */
    header: RefObject<HTMLDivElement | null>;
    /** The corner header, whose width the columns start after. */
    corner: RefObject<HTMLDivElement | null>;
    virtualized: boolean;
    rowCount: number;
    columnCount: number;
    rowHeight: number;
    columnWidth: number;
    /** The focused cell, which stays rendered when it scrolls out of view. */
    focus: MatrixPosition;
}
/** The rows and columns a matrix renders and the tracks that place the columns. */
export interface MatrixWindow {
    rows: readonly number[];
    columns: readonly number[];
    tracks: MatrixColumnTracks;
    onScroll: (event: UIEvent<HTMLDivElement>) => void;
}
/**
 * Which rows and columns of a matrix to render: all of them, or with `virtualized` only those in
 * view of the scroll container (plus a small overscan and the focused cell), from its scroll
 * position, its size and the fixed row height and column width.
 */
export declare function useMatrixWindow(options: MatrixWindowOptions): MatrixWindow;
//# sourceMappingURL=use-matrix-window.d.ts.map