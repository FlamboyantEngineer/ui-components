/** One overlay layer; see `overlayLayers` for their order. */
export type OverlayLayer = (typeof overlayLayers)[number];
/** Overlay layers, lowest to highest. A portal on a later layer stacks above every earlier one. */
export declare const overlayLayers: readonly ["backdrop", "drawer", "modal", "dropdown", "context-menu", "tooltip", "toast"];
/** The z-index each layer gets unless a `PortalContainerProvider` or `PortalHost` overrides it. */
export declare const defaultLayerZIndex: Readonly<Record<OverlayLayer, number>>;
/** Whether `layer` stacks above `other` in the layer order. */
export declare function isLayerAbove(layer: OverlayLayer, other: OverlayLayer): boolean;
//# sourceMappingURL=layers.d.ts.map