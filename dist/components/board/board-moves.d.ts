import type { Key } from '../../core/props.js';
import type { CollectionDropTarget } from '../../utils/use-reorder-drag-and-drop.js';
/** Which side of its target a moved card or column lands on. */
export type BoardMovePosition = 'before' | 'after';
/** A card move: the card `key` lands in the cell of `column` and `lane`, beside `targetKey`. */
export interface BoardMove {
    /** The moved card. */
    key: Key;
    /** The column it lands in. */
    column: Key;
    /** The lane it lands in; `null` on a board without lanes. */
    lane: Key | null;
    /** The card it lands beside, or `null` when the cell holds no other card. */
    targetKey: Key | null;
    /** Which side of the target it lands on; `after` when there is no target. */
    position: BoardMovePosition;
}
/** A column move: the column `key` takes the slot before or after the column `targetKey`. */
export interface BoardColumnMove {
    /** The moved column. */
    key: Key;
    /** The column it lands beside. */
    targetKey: Key;
    /** Which side of the target it lands on. */
    position: BoardMovePosition;
}
/** A cell of the board: one column in one lane (`null` without lanes). */
export interface BoardCellAddress {
    column: Key;
    lane: Key | null;
}
/** The direction of a keyboard card move, in reading order. */
export type BoardMoveDirection = 'up' | 'down' | 'previous' | 'next';
/** The cards of every cell in order, and the columns a keyboard move can reach. */
export interface BoardLayout {
    /** The cards of each cell, by column, then by lane. */
    cells: ReadonlyMap<Key, ReadonlyMap<Key | null, readonly Key[]>>;
    /** Each card's cell. */
    addresses: ReadonlyMap<Key, BoardCellAddress>;
    /** The columns cards can move into by keyboard, in order (collapsed columns are left out). */
    openColumns: readonly Key[];
}
export interface BoardLayoutOptions<T> {
    columns: readonly Key[];
    /** The lanes in order, or `[null]` for a board without lanes. */
    lanes: readonly (Key | null)[];
    collapsedColumns: ReadonlySet<Key>;
    items: readonly T[];
    getKey: (item: T) => Key;
    getColumn: (item: T) => Key;
    getLane: ((item: T) => Key) | undefined;
}
/** The cards of one cell, in order. */
export declare function getCellCards(layout: BoardLayout, { column, lane }: BoardCellAddress): readonly Key[];
/**
 * Sorts the items into the board's cells, keeping their order. Items whose column (or lane, on a
 * board with lanes) is not on the board are left out.
 */
export declare function createBoardLayout<T>(options: BoardLayoutOptions<T>): BoardLayout;
/**
 * The move a drop of the card `key` on `target` in the cell `address` makes, or `null` where it may
 * not land or would stay where it is. A drop on a card, rather than beside it, is refused; a drop on
 * the cell itself lands after its last card.
 */
export declare function resolveBoardDrop(layout: BoardLayout, { key, address, target }: {
    key: Key;
    address: BoardCellAddress;
    target: CollectionDropTarget;
}): BoardMove | null;
/**
 * The move a keyboard chord makes: `up` and `down` pass the neighbouring card of the cell, and
 * `previous` and `next` take the card to the same place in the neighbouring open column of its lane.
 * Returns `undefined` when `key` is not a card of the board, and `null` at either end.
 */
export declare function resolveBoardKeyboardMove(layout: BoardLayout, { key, direction }: {
    key: Key;
    direction: BoardMoveDirection;
}): BoardMove | null | undefined;
/**
 * The move a drop of the column `key` on the column `targetKey` makes: the dragged column takes the
 * target's slot, landing after it when it comes from the left and before it otherwise. `null` when
 * either is missing or they are the same column.
 */
export declare function resolveColumnDrop(columns: readonly Key[], { key, targetKey }: {
    key: Key;
    targetKey: Key;
}): BoardColumnMove | null;
/** The move of the column `key` one place toward the start (-1) or the end (1), or `null` there. */
export declare function stepColumnMove(columns: readonly Key[], key: Key, step: -1 | 1): BoardColumnMove | null;
/**
 * The items after a card move, leaving the input unchanged: the moved item takes its new cell
 * through `place` (which returns the item with its column and lane set) and lands beside its target,
 * or at the end without one.
 */
export declare function applyBoardMove<T extends {
    id: Key;
}>(items: readonly T[], move: BoardMove, place: (item: T, cell: BoardCellAddress) => T): T[];
/** The columns after a column move, leaving the input unchanged. */
export declare function applyColumnMove<T extends {
    id: Key;
}>(columns: readonly T[], move: BoardColumnMove): T[];
//# sourceMappingURL=board-moves.d.ts.map