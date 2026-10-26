import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, Fragment, useContext, useMemo, } from 'react';
import { CollectionRendererContext } from '../../primitives/index.js';
const VisibleItemsContext = createContext(null);
/** Renders the collection's items in view; the others stay in the collection, unrendered. */
function VisibleCollectionRoot({ collection }) {
    const visible = useContext(VisibleItemsContext);
    if (!visible)
        return null;
    return (_jsx(CollectionRendererContext.Provider, { value: visible.outer, children: [...collection]
            .filter((node) => visible.keys.has(node.key))
            .map((node) => (_jsx(Fragment, { children: node.render?.(node) }, String(node.key)))) }));
}
/**
 * Renders only some top-level items of the collection component inside it (a tab list,
 * a breadcrumb trail) while keeping every item in its collection, so selection, panels and keyboard
 * navigation still know the hidden ones. Pair it with `useOverflowItems`: the same commit renders
 * the visible items, so the row measures what it shows.
 */
export function VisibleCollection({ keys, children }) {
    const outer = useContext(CollectionRendererContext);
    const renderer = useMemo(() => ({ ...outer, CollectionRoot: VisibleCollectionRoot }), [outer]);
    const visible = useMemo(() => (keys ? { keys, outer } : null), [keys, outer]);
    if (visible === null)
        return children;
    return (_jsx(CollectionRendererContext.Provider, { value: renderer, children: _jsx(VisibleItemsContext.Provider, { value: visible, children: children }) }));
}
//# sourceMappingURL=visible-collection.js.map