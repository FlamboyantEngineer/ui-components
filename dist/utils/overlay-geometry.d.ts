import { type OverlayAlign, type OverlayMode, type OverlayRect, type OverlaySide } from './overlay-position.js';
/** The boundary an overlay is solved against, measured by `getOverlayBoundary`. */
export interface OverlayBoundary {
    visibleRect: OverlayRect;
    contentRect: OverlayRect;
    /** The content rect when the boundary scrolls horizontally, the visible rect otherwise. */
    horizontalRect: OverlayRect;
    hasHorizontalScroll: boolean;
    hasVerticalScroll: boolean;
}
/** An `absolute` overlay's offset parent: an element to measure, or its rect and scroll offsets. */
export type OverlayOffsetParent = HTMLElement | {
    rect: OverlayRect;
    scrollLeft: number;
    scrollTop: number;
};
export interface OverlayGeometryOptions {
    gap?: number | undefined;
    gutter?: number | undefined;
    /** The element whose visible area bounds the overlay. Defaults to the window. */
    boundaryElement?: HTMLElement | null | undefined;
    /** How the caller positions the overlay. Defaults to `fixed`. */
    strategy?: 'fixed' | 'absolute' | undefined;
    /** For `absolute`: the origin the coordinates are relative to. */
    offsetParent?: OverlayOffsetParent | null | undefined;
    mode?: OverlayMode | undefined;
    /** Preferred side. Defaults to `bottom`. */
    side?: OverlaySide | undefined;
    align?: OverlayAlign | undefined;
    /** Shift along the anchor's edge, in pixels. */
    crossOffset?: number | undefined;
    dir?: 'ltr' | 'rtl' | undefined;
}
/** Where to render a measured overlay, in pixels, as functional inline styles. */
export interface OverlayGeometry {
    strategy: 'fixed' | 'absolute';
    left: number;
    top: number;
    /** Set when the overlay is wider than the boundary. */
    maxWidth: number | null;
    /** Set when the overlay is taller than the space on its side. */
    maxHeight: number | null;
    side: OverlaySide;
    align: OverlayAlign;
    /** The overlay needs `maxHeight`. */
    constrained: boolean;
    /** The overlay needs `maxWidth`. */
    constrainedWidth: boolean;
    /** The width the overlay may take, for a measured `max-width` custom property. */
    availableWidth: number;
    /** The height the overlay may take, for a measured `max-height` custom property. */
    availableHeight: number;
    /** The point of the overlay nearest the anchor, as a CSS `transform-origin` in pixels. */
    transformOrigin: string;
}
/**
 * Measures the boundary an overlay is solved against: the window, or the visible part of
 * `boundaryElement` within the window, each inset by `gutter`; plus its scrollable content.
 */
export declare function getOverlayBoundary(boundaryElement?: HTMLElement | null, options?: {
    gutter?: number | undefined;
    ownerWindow?: Window | undefined;
}): OverlayBoundary;
/**
 * The nearest ancestor of `element` that scrolls (overflow `auto`, `scroll` or `overlay` with content
 * larger than its box), below the body. `skip` passes over ancestors that must not bound an overlay,
 * such as a one-line scrolling strip. Returns null when the page itself is the boundary.
 */
export declare function findOverlayScrollContainer(element: Element | null | undefined, options?: {
    skip?: ((ancestor: HTMLElement) => boolean) | undefined;
}): HTMLElement | null;
/**
 * Measures `overlay` at its natural size and solves its placement against `anchor` (an element or
 * a rect such as `createOverlayPointRect`). An overlay wider than the boundary gets a `maxWidth` that is
 * kept while its remeasured width equals the limit, so a wrapped overlay does not oscillate between
 * capped and natural widths; a taller one gets a `maxHeight` and is placed at that height.
 * Coordinates are relative to the viewport, or to `offsetParent` for the `absolute` strategy.
 */
export declare function resolveOverlayGeometry(overlay: HTMLElement, anchor: HTMLElement | OverlayRect, options?: OverlayGeometryOptions): OverlayGeometry;
/** Whether two geometries would render the same, to skip redundant state updates. */
export declare function isSameOverlayGeometry(a: OverlayGeometry | null | undefined, b: OverlayGeometry | null | undefined): boolean;
//# sourceMappingURL=overlay-geometry.d.ts.map