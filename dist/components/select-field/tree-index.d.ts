import type { Key } from '../../core/props.js';
/** A loaded node: the item, its parent's key (`null` at the top) and its place in reading order. */
export interface TreeIndexEntry<T> {
    item: T;
    parent: Key | null;
    order: number;
}
export type TreeIndex<T> = ReadonlyMap<Key, TreeIndexEntry<T>>;
/** Indexes every loaded node of `items` by its `id`, in reading (depth-first) order. */
export declare function indexTreeItems<T extends {
    id: Key;
}>(items: readonly T[], getChildren: (item: T) => readonly T[] | undefined): TreeIndex<T>;
/** The distinct ancestors of loaded keys, visiting a shared parent path only once. */
export declare function collectAncestorKeys<T>(index: TreeIndex<T>, keys: Iterable<Key>): Set<Key>;
/** The keys of the ancestors of `key`, from the top level down; none for an unknown key. */
export declare function getAncestorKeys<T>(index: TreeIndex<T>, key: Key): Key[];
/** `keys` in reading order; keys of nodes not loaded follow, in their own order. */
export declare function orderChosenKeys<T>(keys: Iterable<Key>, index: TreeIndex<T>): Key[];
/** The chosen keys none of whose ancestors is chosen: one entry per chosen branch. */
export declare function getTopChosenKeys<T>(keys: readonly Key[], index: TreeIndex<T>): Key[];
/**
 * `keys` without `key`; with `cascade`, also without its descendants and ancestors, as a cascading
 * selection drops them along with it.
 */
export declare function removeChosenKey<T>(keys: readonly Key[], { key, index, cascade }: {
    key: Key;
    index: TreeIndex<T>;
    cascade: boolean;
}): Key[];
//# sourceMappingURL=tree-index.d.ts.map