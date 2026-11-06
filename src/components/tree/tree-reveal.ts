'use client';

import { type Ref, useRef } from 'react';
import type { CollectionRevealMiss } from '../../core/events.js';
import type { Key } from '../../core/props.js';
import { type RevealLayout, useCollectionHandle } from '../../utils/use-collection-handle.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { walkTree } from '../../utils/walk-tree.js';
import type { TreeHandle, TreeItemData } from './tree-props.js';

type ReadChildren<T> = (item: T) => readonly T[] | undefined;

/** The ids from the top-level item down to the item with `key`, or `null` without one. */
function findPath<T extends TreeItemData>(
  items: readonly T[],
  { key, getChildren }: { key: Key; getChildren: ReadChildren<T> },
): Key[] | null {
  for (const item of items) {
    if (item.id === key) return [item.id];
    const below = findPath(getChildren(item) ?? [], { key, getChildren });
    if (below) return [item.id, ...below];
  }
  return null;
}

interface TreeHandleOptions<T extends TreeItemData> {
  /** Every item, as the caller gives them, and how to reach their children. */
  all: { items: readonly T[]; getChildren: ReadChildren<T> };
  /** The items the filter keeps, and how to reach their kept children. */
  shown: { items: readonly T[]; getChildren: ReadChildren<T> };
  /** The rows whose children show, ancestors revealed by a filter included. */
  expandedKeys: ReadonlySet<Key>;
  isVirtualized: boolean;
  /** The caller's ref to the tree's root. */
  ref?: Ref<HTMLDivElement> | undefined;
}

/**
 * Why the tree does not show an item now: no loaded item has the id, the filter hides it, or an
 * ancestor holding it is collapsed.
 */
function locateTreeItem<T extends TreeItemData>(
  key: Key,
  { all, shown, expandedKeys }: Omit<TreeHandleOptions<T>, 'isVirtualized' | 'ref'>,
): CollectionRevealMiss | null {
  let isKnown = false;
  for (const item of walkTree(all.items, all.getChildren)) isKnown ||= item.id === key;
  if (!isKnown) return 'missing';
  const path = findPath(shown.items, { key, getChildren: shown.getChildren });
  if (!path) return 'filtered';
  return path.slice(0, -1).every((id) => expandedKeys.has(id)) ? null : 'collapsed';
}

/**
 * The tree's handle on `handleRef`, revealing rows by id whether or not they are drawn. It returns
 * the ref for the tree's element, merged with the caller's, and the ref that receives the layout a
 * virtualized tree draws with, which places the rows it has not drawn; the tree's element is what
 * scrolls then.
 */
export function useTreeHandle<T extends TreeItemData>(
  handleRef: Ref<TreeHandle> | undefined,
  { isVirtualized, ref, ...parts }: TreeHandleOptions<T>,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<RevealLayout>(null);
  useCollectionHandle(handleRef, {
    locate: (key) => locateTreeItem(key, parts),
    getRoot: () => rootRef.current,
    virtual: isVirtualized
      ? { getLayout: () => layoutRef.current, getScroller: () => rootRef.current }
      : null,
  });
  return { ref: useMergedRefs(ref, rootRef), layoutRef };
}
