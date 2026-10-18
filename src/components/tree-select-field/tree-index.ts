// The loaded nodes of a tree select field's hierarchy, by key: where each sits, its ancestors and
// descendants, and the chosen keys read and changed against them.

import type { Key } from '../../core/props.js';

/** A loaded node: the item, its parent's key (`null` at the top) and its place in reading order. */
export interface TreeIndexEntry<T> {
  item: T;
  parent: Key | null;
  order: number;
}

export type TreeIndex<T> = ReadonlyMap<Key, TreeIndexEntry<T>>;

/** Indexes every loaded node of `items` by its `id`, in reading (depth-first) order. */
export function indexTreeItems<T extends { id: Key }>(
  items: readonly T[],
  getChildren: (item: T) => readonly T[] | undefined,
): TreeIndex<T> {
  const index = new Map<Key, TreeIndexEntry<T>>();
  const visit = (level: readonly T[], parent: Key | null) => {
    for (const item of level) {
      index.set(item.id, { item, parent, order: index.size });
      visit(getChildren(item) ?? [], item.id);
    }
  };
  visit(items, null);
  return index;
}

/** The keys of the ancestors of `key`, from the top level down; none for an unknown key. */
export function getAncestorKeys<T>(index: TreeIndex<T>, key: Key): Key[] {
  const ancestors: Key[] = [];
  let parent = index.get(key)?.parent ?? null;
  while (parent !== null && !ancestors.includes(parent)) {
    ancestors.unshift(parent);
    parent = index.get(parent)?.parent ?? null;
  }
  return ancestors;
}

/** `keys` in reading order; keys of nodes not loaded follow, in their own order. */
export function orderChosenKeys<T>(keys: Iterable<Key>, index: TreeIndex<T>): Key[] {
  const rank = (key: Key) => index.get(key)?.order ?? Number.MAX_SAFE_INTEGER;
  return [...new Set(keys)].sort((a, b) => rank(a) - rank(b));
}

/** The chosen keys none of whose ancestors is chosen: one entry per chosen branch. */
export function getTopChosenKeys<T>(keys: readonly Key[], index: TreeIndex<T>): Key[] {
  const chosen = new Set(keys);
  return keys.filter(
    (key) => !getAncestorKeys(index, key).some((ancestor) => chosen.has(ancestor)),
  );
}

/**
 * `keys` without `key`; with `cascade`, also without its descendants and ancestors, as a cascading
 * selection drops them along with it.
 */
export function removeChosenKey<T>(
  keys: readonly Key[],
  { key, index, cascade }: { key: Key; index: TreeIndex<T>; cascade: boolean },
): Key[] {
  if (!cascade) return keys.filter((candidate) => candidate !== key);
  const ancestors = new Set(getAncestorKeys(index, key));
  return keys.filter(
    (candidate) =>
      candidate !== key &&
      !ancestors.has(candidate) &&
      !getAncestorKeys(index, candidate).includes(key),
  );
}
