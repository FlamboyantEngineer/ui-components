import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createContext, useContext, useMemo, useState, useSyncExternalStore, } from 'react';
import { createPortal } from 'react-dom';
import { createHooks, measuredProperty } from '../../core/hooks.js';
import { omitUndefined } from '../../utils/omit-undefined.js';
import { defaultLayerZIndex, isLayerAbove } from './layers.js';
import { usePreservedTabOrder } from './tab-order.js';
const PortalContext = createContext({
    container: undefined,
    zIndex: defaultLayerZIndex,
});
const hostHooks = createHooks('portal-host');
const hooks = createHooks('portal');
const subscribeToNothing = () => () => { };
/** False on the server and during hydration, true once rendering in the browser. */
function useIsClient() {
    return useSyncExternalStore(subscribeToNothing, () => true, () => false);
}
/** Chooses the container and layer z-indexes for every `Portal` below it. */
export function PortalContainerProvider({ container, layerZIndex, children, }) {
    const parent = useContext(PortalContext);
    const value = useMemo(() => ({
        container: container === undefined ? parent.container : container,
        zIndex: layerZIndex ? { ...parent.zIndex, ...omitUndefined(layerZIndex) } : parent.zIndex,
    }), [parent, container, layerZIndex]);
    return _jsx(PortalContext.Provider, { value: value, children: children });
}
/**
 * Renders its children followed by a container element, and makes that element the container of
 * every `Portal` below. Overlays stay inside the host's part of the page and leave with it.
 */
export function PortalHost({ children, layerZIndex, className, ...rest }) {
    const [host, setHost] = useState(null);
    return (_jsxs(PortalContainerProvider, { container: host, layerZIndex: layerZIndex, children: [children, _jsx("div", { ...rest, ref: setHost, ...hostHooks.root({ className }) })] }));
}
/** The z-index of `layer` under the nearest provider, for components that position their own layer. */
export function useLayerZIndex(layer) {
    return useContext(PortalContext).zIndex[layer];
}
/**
 * The width of the element a dropdown opens from, published as `--ui-trigger-width` from the
 * building block's measurement, so stylesheets size the list without naming the building block.
 */
export const triggerWidthProperty = measuredProperty('trigger-width', 'var(--trigger-width)');
/**
 * Renders its children in the overlay container (the document body unless a provider chooses
 * another), inside a wrapper stacked by its layer. The children stay in the React tree, so context
 * and events follow the component that rendered them.
 */
export function Portal({ children, layer = 'dropdown', topLayer, inPlace = false, preserveTabOrder = false, className, ...rest }) {
    const { container, zIndex } = useContext(PortalContext);
    const isClient = useIsClient();
    const tabOrder = usePreservedTabOrder();
    const keepsTabOrder = preserveTabOrder && !inPlace;
    const isTopLayer = topLayer ?? isLayerAbove(layer, 'modal');
    const wrapper = (_jsxs("div", { ...rest, ...hooks.root({ className, data: { layer } }), ...(isTopLayer ? { 'data-react-aria-top-layer': 'true' } : {}), ref: keepsTabOrder ? tabOrder.wrapperRef : undefined, style: { position: 'absolute', top: 0, left: 0, zIndex: zIndex[layer] }, children: [keepsTabOrder ? tabOrder.startGuard : null, children, keepsTabOrder ? tabOrder.endGuard : null] }));
    if (inPlace)
        return wrapper;
    if (!isClient)
        return null;
    const target = container === undefined ? document.body : container;
    if (!target)
        return null;
    return (_jsxs(_Fragment, { children: [keepsTabOrder ? tabOrder.placeGuards : null, createPortal(wrapper, target)] }));
}
//# sourceMappingURL=portal.js.map