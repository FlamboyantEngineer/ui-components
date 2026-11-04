'use client';

import {
  type ComponentProps,
  createContext,
  Fragment,
  type ReactNode,
  useContext,
  useMemo,
} from 'react';
import type { Key } from '../../core/props.js';
import { type CollectionRenderer, CollectionRendererContext } from '../../primitives/index.js';

type CollectionRootProps = ComponentProps<CollectionRenderer['CollectionRoot']>;

export interface VisibleCollectionProps {
  /** The keys of the items to render; `null` renders every item. */
  keys: ReadonlySet<Key> | null;
  /** The library collection component whose items it filters (a tab list, a breadcrumb trail). */
  children: ReactNode;
}

interface VisibleItems {
  /** `null` renders every item. */
  keys: ReadonlySet<Key> | null;
  /** The renderer the items' own collections (a menu inside an item) use. */
  outer: CollectionRenderer;
}

const VisibleItemsContext = createContext<VisibleItems | null>(null);

/**
 * Renders the collection's items in view; the others stay in the collection, unrendered. It
 * renders every item while nothing is filtered too, so filtering never changes the items' parent.
 */
function VisibleCollectionRoot({ collection }: CollectionRootProps) {
  const visible = useContext(VisibleItemsContext);
  const keys = visible?.keys;
  // The same elements while the collection and the keys stay the same, so a parent's own update
  // (a scroll) does not draw the items again.
  const items = useMemo(
    () =>
      [...collection]
        .filter((node) => keys?.has(node.key) ?? true)
        .map((node) => <Fragment key={String(node.key)}>{node.render?.(node)}</Fragment>),
    [collection, keys],
  );
  if (!visible) return null;
  return <CollectionRendererContext value={visible.outer}>{items}</CollectionRendererContext>;
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
  const visible = useMemo(() => ({ keys, outer }), [keys, outer]);
  return (
    <CollectionRendererContext value={renderer}>
      <VisibleItemsContext value={visible}>{children}</VisibleItemsContext>
    </CollectionRendererContext>
  );
}
