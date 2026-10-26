import type { Key } from '../../core/props.js';
import { type TreeKeyboardMove, type TreeMove } from '../../utils/tree-reorder.js';
import { type CollectionDragAndDropOptions } from '../../utils/use-reorder-drag-and-drop.js';
import type { TreeItemData } from './tree.js';
import type { TreeExpansion } from './use-tree-expansion.js';
/** The owner's half of a reorderable tree: which rows move, where they may go, and what to do. */
export interface TreeReorderOptions<T> {
    /** Whether a row can be moved. Defaults to every row. Disabled rows never move. */
    canMove?: ((item: T) => boolean) | undefined;
    /**
     * Whether `item` may be placed among `parent`'s children (`null`: the top level). Without it,
     * rows only move among their own siblings.
     */
    canMoveInto?: ((item: T, parent: T | null) => boolean) | undefined;
    /** Reports one move. The tree never reorders its own items: apply the move and render the result. */
    onMove: (move: TreeMove) => void;
    /**
     * Reports the moves of several selected rows dragged together, in the order they apply. Without
     * it, a drag of several rows reports nothing.
     */
    onMoveMany?: ((moves: readonly TreeMove[]) => void) | undefined;
}
/** What reordering reads from the tree. */
export interface TreeReorderSource<T extends TreeItemData> {
    items: readonly T[];
    reorder: TreeReorderOptions<T> | undefined;
    disabledKeys: Iterable<Key> | undefined;
    expansion: TreeExpansion;
    getChildren: (item: T) => readonly T[] | undefined;
    getTextValue: (item: T) => string;
}
/** A reorderable tree's drag and drop options and keyboard moves. */
export interface TreeReorder {
    /** The options the tree hands to `useDragAndDrop`. */
    dragAndDrop: CollectionDragAndDropOptions;
    /** Whether the visible row `key` can be moved. */
    isMovable: (key: Key) => boolean;
    /** The `aria-keyshortcuts` value of a movable row. */
    keyShortcuts: string;
    /** Reports the move a chord makes; returns whether the chord belongs to reordering. */
    moveByKeyboard: (request: TreeKeyboardMove) => boolean;
}
/**
 * Reordering for the tree: pointer and keyboard drag and drop, plus Alt+Arrow moves, each checked
 * against the rows the tree last rendered. `null` while the tree is not reorderable.
 */
export declare function useTreeReorder<T extends TreeItemData>(source: TreeReorderSource<T>): TreeReorder | null;
//# sourceMappingURL=use-tree-reorder.d.ts.map