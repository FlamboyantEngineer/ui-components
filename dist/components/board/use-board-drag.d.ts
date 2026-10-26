import { type RefObject } from 'react';
import type { Key } from '../../core/props.js';
import type { CollectionDropTarget } from '../../utils/use-reorder-drag-and-drop.js';
import { type BoardCellAddress, type BoardColumnMove, type BoardLayout, type BoardMove } from './board-moves.js';
/** What every cell's drag and drop shares while the board takes card moves. */
export interface BoardCardDrag {
    /** The media type the board's cards carry, unique to the board, so other boards refuse them. */
    dragType: string;
    /** The move a drop of the dragged card on `target` in the cell `address` makes. */
    resolveDrop: (address: BoardCellAddress, target: CollectionDropTarget) => BoardMove | null;
    /** Records the card a drag started from. */
    setDragging: (key: Key | null) => void;
    /** Reports the move of an accepted drop. */
    drop: (address: BoardCellAddress, target: CollectionDropTarget) => void;
    /** The text a dragged card carries to other drop targets. */
    getTextValue: (key: Key) => string;
}
/** What every column header's drag and drop shares while the board takes column moves. */
export interface BoardColumnDrag {
    dragType: string;
    /** The column being dragged. */
    dragging: RefObject<Key | null>;
    /** The move a drop of the dragged column on `targetKey` makes. */
    resolveDrop: (targetKey: Key) => BoardColumnMove | null;
    onMove: (move: BoardColumnMove) => void;
}
interface CardDragSource {
    layout: BoardLayout;
    onMove: ((move: BoardMove) => void) | undefined;
    getTextValue: (key: Key) => string;
}
interface ColumnDragSource {
    columns: readonly Key[];
    onMove: ((move: BoardColumnMove) => void) | undefined;
}
/**
 * The board's card drag and drop, shared by its cells: one move operation on a media type of its
 * own, each drop checked against the cards the board last rendered. `null` without `onMove`.
 */
export declare function useBoardCardDrag(source: CardDragSource): BoardCardDrag | null;
/** The board's column drag and drop, shared by its column headers. `null` without `onMove`. */
export declare function useBoardColumnDrag(source: ColumnDragSource): BoardColumnDrag | null;
export {};
//# sourceMappingURL=use-board-drag.d.ts.map