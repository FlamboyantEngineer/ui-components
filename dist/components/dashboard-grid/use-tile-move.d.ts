import { type DOMAttributes } from 'react';
import type { DashboardGridItem } from './dashboard-layout.js';
/** `move` shifts a tile; `resize` changes its span from its bottom end corner. */
export type TileMoveKind = 'move' | 'resize';
/** The pixels one column and one row step across, gaps included. */
export interface CellStep {
    column: number;
    row: number;
}
export interface TileMoveOptions {
    item: DashboardGridItem;
    kind: TileMoveKind;
    /** The grid's columns, which a resize never reaches past. */
    columns: number;
    /** The narrowest and shortest a resize may make the tile. */
    minColumnSpan: number;
    minRowSpan: number;
    /** Reads the cell step when a pointer move starts. */
    measureStep: () => CellStep;
    /** Shows where the tile would go. */
    onPreview: (next: DashboardGridItem) => void;
    /** Keeps the last preview; `isKeyboard` for a move made with the arrow keys. */
    onCommit: (isKeyboard: boolean) => void;
}
/**
 * Pointer drags and arrow keys that move or resize a tile by whole cells. A pointer move snaps to
 * the nearest cell, and previews again only when it reaches another cell; each arrow key press
 * moves one cell, toward the inline end for the right arrow in left-to-right text and the left
 * arrow in right-to-left text.
 */
export declare function useTileMove(options: TileMoveOptions): DOMAttributes<HTMLButtonElement>;
//# sourceMappingURL=use-tile-move.d.ts.map