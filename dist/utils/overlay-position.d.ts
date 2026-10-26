/** A box in viewport coordinates, like `DOMRect`. */
export interface OverlayRect {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}
export interface OverlaySize {
    width: number;
    height: number;
}
/** The side of the anchor the overlay opens on. */
export type OverlaySide = 'bottom' | 'top' | 'left' | 'right';
/**
 * How the overlay lines up along the anchor's edge: with its `start` edge (the left edge in
 * left-to-right text, the top edge beside the anchor), its `end` edge, or centred on it.
 */
export type OverlayAlign = 'start' | 'center' | 'end';
/** The side of its trigger row a submenu opens on. */
export type SubmenuSide = 'right' | 'left';
/** Which way a submenu extends from its trigger row. */
export type SubmenuDirection = 'down' | 'up';
/**
 * `viewport`: fit the visible part of the boundary and clamp into it. `content`: use the boundary's
 * whole scrollable content, so a tall overlay may extend into the scrolled-away part and scroll with it.
 */
export type OverlayMode = 'viewport' | 'content';
export interface OverlayPlacementInput {
    anchorRect: OverlayRect;
    overlaySize: OverlaySize;
    /** The visible boundary the overlay must stay in (already inset by the gutter). */
    visibleRect: OverlayRect;
    /** The boundary's scrollable content, used in `content` mode. Defaults to `visibleRect`. */
    contentRect?: OverlayRect | undefined;
    /** The horizontal extent the overlay may use. Defaults to `visibleRect`. */
    horizontalRect?: OverlayRect | undefined;
    /** Preferred side; flips to the opposite side when only that one fits. Defaults to `bottom`. */
    side?: OverlaySide | undefined;
    /** Preferred alignment; `start` and `end` flip when only the other edge fits. Defaults to `start`. */
    align?: OverlayAlign | undefined;
    /** Shift along the anchor's edge, in pixels: rightward above or below it, downward beside it. */
    crossOffset?: number | undefined;
    /** Text direction, which decides the physical edge of `start`. Defaults to `ltr`. */
    dir?: 'ltr' | 'rtl' | undefined;
    /** Space between anchor and overlay. Defaults to 6. */
    gap?: number | undefined;
    mode?: OverlayMode | undefined;
}
export interface OverlayPlacement {
    side: OverlaySide;
    align: OverlayAlign;
    left: number;
    top: number;
    /** The height to render: the room on a `top` or `bottom` side when `constrained`, else its own. */
    maxHeight: number;
    /** The width to render: the room on a `left` or `right` side when `constrained`, else its own. */
    maxWidth: number;
    availableAbove: number;
    availableBelow: number;
    /** The width the overlay may take: the room on a `left` or `right` side, else the boundary's. */
    availableWidth: number;
    /** The height the overlay may take: the room on a `top` or `bottom` side, else the boundary's. */
    availableHeight: number;
    /** The overlay is larger than the room on its side and needs `maxHeight` (or `maxWidth` beside). */
    constrained: boolean;
    /** The point of the overlay nearest the anchor, as a CSS `transform-origin` in pixels. */
    transformOrigin: string;
}
export interface SubmenuPlacementInput {
    triggerRect: OverlayRect;
    overlaySize: OverlaySize;
    visibleRect: OverlayRect;
    contentRect?: OverlayRect | undefined;
    horizontalRect?: OverlayRect | undefined;
    /** How far the submenu overlaps its parent. Defaults to 6. */
    overlap?: number | undefined;
    /** Extra space kept free past a constrained submenu. Defaults to 8. */
    gutter?: number | undefined;
    /** Text direction, which decides the preferred side. Defaults to `ltr` (right). */
    dir?: 'ltr' | 'rtl' | undefined;
    mode?: OverlayMode | undefined;
}
export interface SubmenuPlacement {
    side: SubmenuSide;
    direction: SubmenuDirection;
    left: number;
    top: number;
    /** The height limit to apply when `constrained`; the submenu's own height otherwise. */
    maxHeight: number;
    constrained: boolean;
}
/** Space kept between an overlay and the boundary edges. */
export declare const DEFAULT_OVERLAY_GUTTER = 8;
/** Space between an anchor and its overlay. */
export declare const DEFAULT_OVERLAY_GAP = 6;
/** How far a submenu overlaps its parent menu. */
export declare const DEFAULT_SUBMENU_OVERLAP = 6;
/** Copies any rect-like value (a `DOMRect`, or an object with edges) into an `OverlayRect`. */
export declare function toOverlayRect(rect: Pick<OverlayRect, 'left' | 'top' | 'right' | 'bottom'> & Partial<OverlaySize>): OverlayRect;
/** A zero-size anchor at a viewport point, for overlays opened at the pointer. */
export declare function createOverlayPointRect(x: number, y: number): OverlayRect;
/**
 * Places an overlay on a side of its anchor (below unless `side` prefers another) and lines it up
 * with the anchor's start or end edge, or its centre, shifted by `crossOffset`. A side that cannot
 * fit the overlay flips to the opposite one; when neither fits, the roomier side wins and the
 * overlay is constrained to it. Horizontally the result is always clamped into the horizontal
 * rect; vertically only in `viewport` mode.
 */
export declare function resolveOverlayPlacement(input: OverlayPlacementInput): OverlayPlacement;
/**
 * Places a submenu beside its trigger row, overlapping the parent menu slightly. It opens on the
 * reading-direction side when it fits there or has more room there, and on the other side otherwise.
 * It extends down from the row when it fits, up when only that fits, else toward the roomier side,
 * constrained to it.
 */
export declare function resolveSubmenuPlacement(input: SubmenuPlacementInput): SubmenuPlacement;
//# sourceMappingURL=overlay-position.d.ts.map