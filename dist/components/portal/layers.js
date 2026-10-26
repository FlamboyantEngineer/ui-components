/** Overlay layers, lowest to highest. A portal on a later layer stacks above every earlier one. */
export const overlayLayers = [
    'backdrop',
    'drawer',
    'modal',
    'dropdown',
    'context-menu',
    'tooltip',
    'toast',
];
/** The z-index each layer gets unless a `PortalContainerProvider` or `PortalHost` overrides it. */
export const defaultLayerZIndex = Object.freeze({
    backdrop: 100,
    drawer: 110,
    modal: 120,
    dropdown: 130,
    'context-menu': 140,
    tooltip: 150,
    toast: 160,
});
/** Whether `layer` stacks above `other` in the layer order. */
export function isLayerAbove(layer, other) {
    return overlayLayers.indexOf(layer) > overlayLayers.indexOf(other);
}
//# sourceMappingURL=layers.js.map