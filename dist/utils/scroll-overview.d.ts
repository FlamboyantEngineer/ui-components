/** A marked range of the scrolled content, in CSS pixels from the top of the content. */
export interface ScrollOverviewMarker {
    top: number;
    height: number;
    /** Any CSS colour the caller chooses, for example a custom property of the host stylesheet. */
    color: string;
    /** Where markers share an overview pixel, the lowest priority wins. */
    priority: number;
}
/** A named set of markers. Each layer resolves its own overlaps before layers are combined. */
export interface ScrollOverviewLayer {
    name: string;
    markers: readonly ScrollOverviewMarker[];
}
/** A run of overview pixels with one colour. */
export interface ScrollOverviewSegment {
    top: number;
    height: number;
    color: string;
}
/** The smallest overview height of a marker, so a one-line mark in a long document stays visible. */
export declare const SCROLL_OVERVIEW_MIN_MARKER = 2;
/**
 * Projects markers onto `viewportHeight` overview pixels for content `scrollHeight` pixels tall.
 * Every marker covers at least two pixels, the lowest priority wins a shared pixel whatever the
 * marker order, and adjacent pixels of one colour merge into one segment. Content that fits the
 * viewport has no overview.
 */
export declare function resolveScrollOverviewSegments(markers: readonly ScrollOverviewMarker[], viewportHeight: number, scrollHeight: number): ScrollOverviewSegment[];
/**
 * Resolves each layer on its own, then combines layers that share a pixel with equal weight, in
 * layer-name order so the result does not depend on the order the caller lists them. A single layer
 * resolves exactly as `resolveScrollOverviewSegments`.
 */
export declare function resolveLayeredScrollOverviewSegments(layers: readonly ScrollOverviewLayer[], viewportHeight: number, scrollHeight: number): ScrollOverviewSegment[];
/**
 * A vertical `linear-gradient` painting each segment in its colour over a transparent ground, for a
 * box `height` pixels tall, or `none` when there is nothing to paint. Opacity is left to the
 * stylesheet.
 */
export declare function buildScrollOverviewImage(segments: readonly ScrollOverviewSegment[], height: number): string;
//# sourceMappingURL=scroll-overview.d.ts.map