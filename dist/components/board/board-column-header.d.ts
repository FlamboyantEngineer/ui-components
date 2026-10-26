import { type ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import type { BoardColumnDrag } from './use-board-drag.js';
/** A column header's view of its column. */
export interface BoardColumnHeaderProps {
    columnKey: Key;
    title: string;
    /** The id of the title, which names the column's cells. */
    titleId: string;
    /** The cards in the column, across lanes. */
    count: number;
    limit: number | undefined;
    /** Whether the column holds more cards than its limit. */
    isOverLimit: boolean;
    isCollapsed: boolean;
    onCollapsedChange: (isCollapsed: boolean) => void;
    /** Column reordering, while the board takes column moves. */
    drag: BoardColumnDrag | null;
    /** Moves the column one place toward the start (-1) or the end (1) by keyboard. */
    onStep: (key: Key, step: -1 | 1) => void;
    /** The caller's controls drawn at the end of the header, or nothing. */
    actions: ReactNode;
}
/**
 * A board column's header: a drag handle while the board takes column moves (Alt+Arrow keys move
 * the column too), a collapse toggle, the title, the card count against the column's limit and the
 * caller's actions.
 */
export declare function BoardColumnHeader(props: BoardColumnHeaderProps): import("react").JSX.Element;
//# sourceMappingURL=board-column-header.d.ts.map