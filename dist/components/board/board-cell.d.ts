import { type ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import type { BoardCellAddress } from './board-moves.js';
import type { BoardCardDrag } from './use-board-drag.js';
/** Scrolls the virtualized cell holding the card `key` toward it; other cells ignore the call. */
export type BoardCardReveal = (key: Key) => void;
/** What every cell of a board draws its cards with. */
export interface BoardCellOptions<T> {
    renderCard: (item: T) => ReactNode;
    getTextValue: (item: T) => string;
    onAction: ((key: Key) => void) | undefined;
    onAddCard: ((cell: BoardCellAddress) => void) | undefined;
    /** The `aria-keyshortcuts` of a card while the board takes card moves. */
    keyShortcuts: string | undefined;
    virtualized: boolean;
    drag: BoardCardDrag | null;
    /** Where each virtualized cell registers its `BoardCardReveal` for focus after a move. */
    reveals: Set<BoardCardReveal>;
}
export interface BoardCellProps<T> {
    address: BoardCellAddress;
    /** The cell's cards, in order. */
    items: readonly T[];
    isCollapsed: boolean;
    isOverLimit: boolean;
    /** The ids of the column title and, with lanes, the lane title, which name the cell. */
    labelledBy: string;
    options: BoardCellOptions<T>;
}
/**
 * One column of one lane: its cards, then the add-card button when the board takes new cards. A
 * collapsed column's cell stays as an empty placeholder so the lanes keep their columns aligned.
 */
export declare function BoardCell<T extends {
    id: Key;
}>(props: BoardCellProps<T>): import("react").JSX.Element;
//# sourceMappingURL=board-cell.d.ts.map