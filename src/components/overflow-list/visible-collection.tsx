'use client';

import {
  createContext,
  Fragment,
  useContext,
  useMemo,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { CollectionRendererContext, type CollectionRenderer } from '../../primitives/index.js';
import type { Key } from '../../core/props.js';

type CollectionRootProps = ComponentProps<CollectionRenderer['CollectionRoot']>;

export interface VisibleCollectionProps {
  /** The keys of the items to render; `null` renders every item. */
  keys: ReadonlySet<Key> | null;
  /** The library collection component whose items it filters (a tab list, a breadcrumb trail). */
  children: ReactNode;
}

interface VisibleItems {
  keys: ReadonlySet<Key>;
  /** The renderer the items' own collections (a menu inside an item) use. */
  outer: CollectionRenderer;
}

const VisibleItemsContext = createContext<VisibleItems | null>(null);

/** Renders the collection's items in view; the others stay in the collection, unrendered. */
function VisibleCollectionRoot({ collection }: CollectionRootProps) {
  const visible = useContext(VisibleItemsContext);
  if (!visible) return null;
  return (
    <CollectionRendererContext.Provider value={visible.outer}>
      {[...collection]
        .filter((node) => visible.keys.has(node.key))
        .map((node) => (
          <Fragment key={String(node.key)}>{node.render?.(node)}</Fragment>
        ))}
    </CollectionRendererContext.Provider>
  );
}

/**
 * Renders only some top-level items of the collection component inside it (a tab list,
 * a breadcrumb trail) while keeping every item in its collection, so selection, panels and keyboard
 * navigation still know the hidden ones. Pair it with `useOverflowItems`: the same commit renders
 * the visible items, so the row measures what it shows.
 */
export function VisibleCollection({ keys, children }: VisibleCollectionProps) {
  const outer = useContext(CollectionRendererContext);
  const renderer = useMemo<CollectionRenderer>(
    () => ({ ...outer, CollectionRoot: VisibleCollectionRoot }),
    [outer],
  );
  const visible = useMemo(() => (keys ? { keys, outer } : null), [keys, outer]);
  if (visible === null) return children;
  return (
    <CollectionRendererContext.Provider value={renderer}>
      <VisibleItemsContext.Provider value={visible}>{children}</VisibleItemsContext.Provider>
    </CollectionRendererContext.Provider>
  );
}
