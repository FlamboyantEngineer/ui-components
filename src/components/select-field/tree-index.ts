// The loaded nodes of a tree select field's hierarchy, by key: where each sits, its ancestors and
// descendants, and the chosen keys read and changed against them.

import type { Key } from '../../core/props.js';
import { requireDefined } from '../../utils/require-defined.js';

/** A loaded node: the item, its parent's key (`null` at the top) and its place in reading order. */
interface TreeIndexEntry<T> {
  item: T;
  parent: Key | null;
  order: number;
}

export type TreeIndex<T> = ReadonlyMap<Key, TreeIndexEntry<T>>;

/** Reuses shared parent paths while checking a fixed set of selected ancestors. */
function createAncestorCheck<T>(index: TreeIndex<T>, chosen: ReadonlySet<Key>) {
  const known = new Map<Key, boolean>();
  return (key: Key) => {
    const pending = new Set<Key>();
    let parent = index.get(key)?.parent ?? null;
    let covered = false;
    while (parent !== null && !pending.has(parent)) {
      if (chosen.has(parent)) {
        covered = true;
        break;
      }
      const previous = known.get(parent);
      if (previous !== undefined) {
        covered = previous;
        break;
      }
      pending.add(parent);
      parent = index.get(parent)?.parent ?? null;
    }
    for (const ancestor of pending) known.set(ancestor, covered);
    return covered;
  };
}

/** Indexes every loaded node of `items` by its `id`, in reading (depth-first) order. */
export function indexTreeItems<T extends { id: Key }>(
  items: readonly T[],
  getChildren: (item: T) => readonly T[] | undefined,
): TreeIndex<T> {
  const index = new Map<Key, TreeIndexEntry<T>>();
  const stack = [{ items, parent: null as Key | null, position: 0 }];
  while (stack.length > 0) {
    const frame = requireDefined(stack.at(-1));
    const item = frame.items[frame.position++];
    if (!item) {
      stack.pop();
      continue;
    }
    if (index.has(item.id)) continue;
    index.set(item.id, { item, parent: frame.parent, order: index.size });
    const children = getChildren(item);
    if (children?.length) stack.push({ items: children, parent: item.id, position: 0 });
  }
  return index;
}

/** The distinct ancestors of loaded keys, visiting a shared parent path only once. */
export function collectAncestorKeys<T>(index: TreeIndex<T>, keys: Iterable<Key>): Set<Key> {
  const ancestors = new Set<Key>();
  for (const key of keys) {
    let parent = index.get(key)?.parent ?? null;
    while (parent !== null && !ancestors.has(parent)) {
      ancestors.add(parent);
      parent = index.get(parent)?.parent ?? null;
    }
  }
  return ancestors;
}

/** The keys of the ancestors of `key`, from the top level down; none for an unknown key. */
export function getAncestorKeys<T>(index: TreeIndex<T>, key: Key): Key[] {
  return [...collectAncestorKeys(index, [key])].reverse();
}

/** `keys` in reading order; keys of nodes not loaded follow, in their own order. */
export function orderChosenKeys<T>(keys: Iterable<Key>, index: TreeIndex<T>): Key[] {
  const rank = (key: Key) => index.get(key)?.order ?? Number.MAX_SAFE_INTEGER;
  return [...new Set(keys)].sort((a, b) => rank(a) - rank(b));
}

/** The chosen keys none of whose ancestors is chosen: one entry per chosen branch. */
export function getTopChosenKeys<T>(keys: readonly Key[], index: TreeIndex<T>): Key[] {
  const hasChosenAncestor = createAncestorCheck(index, new Set(keys));
  return keys.filter((key) => !hasChosenAncestor(key));
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
  const isDescendant = createAncestorCheck(index, new Set([key]));
  return keys.filter(
    (candidate) => candidate !== key && !ancestors.has(candidate) && !isDescendant(candidate),
  );
}

/**
 * A cascading choice made whole against the loaded tree: a chosen branch takes every loaded
 * descendant along, such as children loaded or added after it was chosen, so a branch is never
 * claimed whole while some of its loaded children are not chosen. The result is in reading order.
 */
export function settleCascadeKeys<T>(keys: readonly Key[], index: TreeIndex<T>): Key[] {
  const chosen = new Set(keys);
  const entries = [...index.entries()].sort(([, a], [, b]) => a.order - b.order);
  for (const [key, entry] of entries) {
    if (entry.parent !== null && chosen.has(entry.parent)) chosen.add(key);
  }
  return chosen.size === keys.length ? [...keys] : orderChosenKeys(chosen, index);
}
