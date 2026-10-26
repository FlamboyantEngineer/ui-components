/** A tree item key, as React Aria collections use it. */
export type TreeKey = string | number;
/** Where a moved row lands: beside the target row, or inside it as its last child. */
export type TreeDropPosition = 'before' | 'after' | 'inside';
/** One move: the row `key` takes the slot before or after `targetKey`, or goes inside it. */
export interface TreeMove {
    /** The moved row. */
    key: TreeKey;
    /** The row the moved row lands beside or inside. */
    targetKey: TreeKey;
    /** Where the moved row lands relative to the target. */
    position: TreeDropPosition;
}
/** A drop of several rows: the rows `keys` land together before or after `targetKey`, or inside it. */
export interface TreeMultipleMove {
    /** The dragged rows. */
    keys: Iterable<TreeKey>;
    /** The row the dragged rows land beside or inside. */
    targetKey: TreeKey;
    /** Where the dragged rows land relative to the target. */
    position: TreeDropPosition;
}
/** The direction of a keyboard move: past a sibling, into the sibling above, or out of the parent. */
export type TreeMoveDirection = 'up' | 'down' | 'in' | 'out';
/** A keyboard chord on a row: which row, and which way it asks to move. */
export interface TreeKeyboardMove {
    /** The focused row. */
    key: TreeKey;
    /** The direction the chord asks for. */
    direction: TreeMoveDirection;
}
/** A visible row as the move rules see it. */
export interface TreeMoveRow<T> {
    /** The row's key. */
    key: TreeKey;
    /** The parent row's key; `null` at the top level. */
    parentKey: TreeKey | null;
    /** The caller's item. */
    item: T;
    /** Whether the row can be moved and can take a moved row right now. */
    isMovable: boolean;
    /** Whether the row's children are listed below it. */
    isExpanded: boolean;
}
/** The owner's consent for moves to another parent. */
export interface TreeMoveRules<T> {
    /**
     * Whether `item` may be placed among `parent`'s children (`null`: the top level). Without it, rows
     * only move among their own siblings.
     */
    canMoveInto?: ((item: T, parent: T | null) => boolean) | undefined;
}
/** The minimal shape of nested tree data: a key and optional children of the same shape. */
export interface TreeMoveItem<T> {
    /** The item's key, unique in the tree. */
    id: TreeKey;
    /** The item's children. */
    children?: readonly T[] | undefined;
}
export interface VisibleTreeRowsOptions<T> {
    /** The keys of rows whose children are shown. */
    expandedKeys: Iterable<TreeKey>;
    /** Children of an item. Defaults to its `children` property. */
    getChildren?: ((item: T) => readonly T[] | undefined) | undefined;
    /** Whether a row can move. Defaults to every row. */
    isMovable?: ((item: T) => boolean) | undefined;
}
/** An item's `children` property, the children trees read by default. */
export declare function readTreeChildren<T>(item: T): readonly T[] | undefined;
/** The rows a tree shows, in order: top-level items and the children of expanded items. */
export declare function getVisibleTreeRows<T extends {
    id: TreeKey;
}>(items: readonly T[], { expandedKeys, getChildren, isMovable, }: VisibleTreeRowsOptions<T>): TreeMoveRow<T>[];
/**
 * `move`, or `null` when it is not allowed or changes nothing. Both rows must be movable. A row never
 * lands inside or beside its own descendants, inside the parent it is already in, or in the slot it
 * already holds. A different parent needs the owner's `canMoveInto`.
 */
export declare function resolveTreeMove<T>(rows: readonly TreeMoveRow<T>[], move: TreeMove, rules?: TreeMoveRules<T>): TreeMove | null;
/**
 * The move a drop makes. As `resolveTreeMove`, except that nothing lands just after a row whose
 * children are listed below it: a line there reads as inside that row.
 */
export declare function resolveTreeDrop<T>(rows: readonly TreeMoveRow<T>[], move: TreeMove, rules?: TreeMoveRules<T>): TreeMove | null;
/**
 * The moves a drop of several rows makes, in the order they apply: the first row lands where the
 * drop says and each other row just after the row before it, so the rows keep their order. Rows
 * inside another dragged row move with it. `null` when one of the rows cannot go there under the
 * rules of `resolveTreeDrop`, or when the drop leaves every row where it is.
 */
export declare function resolveTreeDropMany<T>(rows: readonly TreeMoveRow<T>[], { keys, targetKey, position }: TreeMultipleMove, rules?: TreeMoveRules<T>): TreeMove[] | null;
/**
 * The move a keyboard chord makes. `up` and `down` pass the neighbouring movable sibling. With
 * `canMoveInto`, `in` moves the row into the sibling above it as its last child and `out` moves it
 * to just after its parent.
 *
 * Returns `undefined` when the chord is not a move for this row (the row cannot move, or `in`/`out`
 * without `canMoveInto`), so the caller can treat the key as ordinary navigation; `null` when the
 * chord is a move that cannot happen here (at either end, or refused).
 */
export declare function resolveTreeKeyboardMove<T>(rows: readonly TreeMoveRow<T>[], { key, direction }: TreeKeyboardMove, rules?: TreeMoveRules<T>): TreeMove | null | undefined;
/**
 * Nested items after `move`, leaving the input unchanged. Subtrees the move does not touch keep
 * their identity. A move whose row or target is missing, or whose target lies inside the moved row,
 * returns the items as they were.
 */
export declare function applyTreeMove<T extends TreeMoveItem<T>>(items: readonly T[], move: TreeMove): readonly T[];
//# sourceMappingURL=tree-reorder.d.ts.map