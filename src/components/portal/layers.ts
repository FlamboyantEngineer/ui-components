/** Overlay layers, lowest to highest. A portal on a later layer stacks above every earlier one. */
export const overlayLayers = [
  'backdrop',
  'drawer',
  'modal',
  'dropdown',
  'context-menu',
  'tooltip',
  'toast',
] as const;

export type OverlayLayer = (typeof overlayLayers)[number];

/** The z-index each layer gets unless a `PortalContainerProvider` or `PortalHost` overrides it. */
export const defaultLayerZIndex: Readonly<Record<OverlayLayer, number>> = Object.freeze({
  backdrop: 100,
  drawer: 110,
  modal: 120,
  dropdown: 130,
  'context-menu': 140,
  tooltip: 150,
  toast: 160,
});

/** Whether `layer` stacks above `other` in the layer order. */
export function isLayerAbove(layer: OverlayLayer, other: OverlayLayer): boolean {
  return overlayLayers.indexOf(layer) > overlayLayers.indexOf(other);
}
