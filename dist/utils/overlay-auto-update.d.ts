export interface OverlayAutoUpdateOptions {
    /** The element the overlay is anchored to. */
    anchor: Element;
    /** The overlay itself, whose size changes also call for a new solution. */
    overlay: Element;
    /** Solves and applies the overlay's placement again. */
    update: () => void;
    /** Also compare the anchor's box every animation frame, for anchors that move on their own. */
    everyFrame?: boolean | undefined;
}
/**
 * Calls `update` at once, then again, at most once per animation frame, whenever any scroll
 * container in the anchor's document scrolls, its window resizes, or the anchor or overlay changes
 * size; with `everyFrame`, also whenever the anchor's box moves. Returns the function that stops.
 */
export declare function autoUpdateOverlay({ anchor, overlay, update, everyFrame, }: OverlayAutoUpdateOptions): () => void;
//# sourceMappingURL=overlay-auto-update.d.ts.map