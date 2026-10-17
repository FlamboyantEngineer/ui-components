import {
  createContext,
  Fragment,
  useContext,
  useMemo,
  type ComponentProps,
  type ReactNode,
} from 'react';
import {
  CollectionRendererContext,
  type CollectionRenderer,
  type Key,
} from 'react-aria-components';

type CollectionRootProps = ComponentProps<CollectionRenderer['CollectionRoot']>;

interface VisibleTabsProps {
  /** The keys of the tabs to render; `null` renders every tab. */
  keys: ReadonlySet<Key> | null;
  children: ReactNode;
}

const VisibleTabsContext = createContext<ReadonlySet<Key> | null>(null);

/** Renders the list's tabs that are in view; the others stay in the collection, unrendered. */
function VisibleTabsRoot({ collection }: CollectionRootProps) {
  const keys = useContext(VisibleTabsContext);
  return [...collection]
    .filter((node) => keys === null || keys.has(node.key))
    .map((node) => <Fragment key={String(node.key)}>{node.render?.(node)}</Fragment>);
}

/**
 * Renders only some of a tab list's tabs while keeping every tab in React Aria's collection, so
 * selection, panels and keyboard navigation still know the hidden ones.
 */
export function VisibleTabs({ keys, children }: VisibleTabsProps) {
  const outer = useContext(CollectionRendererContext);
  const renderer = useMemo<CollectionRenderer>(
    () => ({ ...outer, CollectionRoot: VisibleTabsRoot }),
    [outer],
  );
  if (keys === null) return children;
  return (
    <CollectionRendererContext.Provider value={renderer}>
      <VisibleTabsContext.Provider value={keys}>{children}</VisibleTabsContext.Provider>
    </CollectionRendererContext.Provider>
  );
}
