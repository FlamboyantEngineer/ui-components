// Placement math for floating panels (menus, suggestion lists, fly-outs) anchored to an element
// or a point. Pure functions over rects; `overlay-geometry.ts` measures the DOM for them.

import { alignCrossAxis, clampFinite, resolveAnchorPoint, solveMainAxis } from './overlay-axis.js';
import { DEFAULT_OVERLAY_GAP } from './overlay-defaults.js';

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

/** The rects a placement is solved in: vertical room by mode, horizontal room as given. */
function resolveSolvingRects(input: OverlayPlacementInput) {
  const { visibleRect } = input;
  const content = input.mode === 'content';
  return {
    content,
    verticalRect: content ? (input.contentRect ?? visibleRect) : visibleRect,
    horizontalRect: input.horizontalRect ?? visibleRect,
  };
}

/** Copies any rect-like value (a `DOMRect`, or an object with edges) into an `OverlayRect`. */
export function toOverlayRect(
  rect: Pick<OverlayRect, 'left' | 'top' | 'right' | 'bottom'> & Partial<OverlaySize>,
): OverlayRect {
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: typeof rect.width === 'number' ? rect.width : rect.right - rect.left,
    height: typeof rect.height === 'number' ? rect.height : rect.bottom - rect.top,
  };
}

/** A zero-size anchor at a viewport point, for overlays opened at the pointer. */
export function createOverlayPointRect(x: number, y: number): OverlayRect {
  return { left: x, top: y, right: x, bottom: y, width: 0, height: 0 };
}

/** The anchor point on the overlay's edge that faces the anchor, as a `transform-origin`. */
function resolveTransformOrigin(
  side: OverlaySide,
  anchorRect: OverlayRect,
  box: { left: number; top: number; width: number; height: number },
): string {
  if (side === 'top' || side === 'bottom') {
    const x = resolveAnchorPoint(anchorRect.left, anchorRect.right, {
      low: box.left,
      size: box.width,
    });
    return `${x}px ${side === 'top' ? Math.round(box.height) : 0}px`;
  }
  const y = resolveAnchorPoint(anchorRect.top, anchorRect.bottom, {
    low: box.top,
    size: box.height,
  });
  return `${side === 'left' ? Math.round(box.width) : 0}px ${y}px`;
}

/** Places an overlay above or below its anchor, lined up horizontally. */
function placeVertically(input: OverlayPlacementInput) {
  const { anchorRect, overlaySize, visibleRect } = input;
  const { content, verticalRect, horizontalRect } = resolveSolvingRects(input);
  const main = solveMainAxis({
    anchorLow: anchorRect.top,
    anchorHigh: anchorRect.bottom,
    size: overlaySize.height,
    boundLow: verticalRect.top,
    boundHigh: verticalRect.bottom,
    gap: input.gap ?? DEFAULT_OVERLAY_GAP,
    prefersHigh: input.side !== 'top',
  });
  const cross = alignCrossAxis({
    anchorLow: anchorRect.left,
    anchorHigh: anchorRect.right,
    size: overlaySize.width,
    boundLow: horizontalRect.left,
    boundHigh: horizontalRect.right,
    align: input.align ?? 'start',
    startIsLow: input.dir !== 'rtl',
    offset: input.crossOffset ?? 0,
    clamps: true,
  });
  return {
    main,
    side: main.isHigh ? ('bottom' as const) : ('top' as const),
    align: cross.align,
    left: cross.position,
    top: content
      ? main.position
      : clampFinite(main.position, visibleRect.top, visibleRect.bottom - main.size),
    width: overlaySize.width,
    height: main.size,
    availableWidth: Math.floor(horizontalRect.width),
    availableHeight: main.isHigh ? main.roomHigh : main.roomLow,
  };
}

/** Places an overlay left or right of its anchor, lined up vertically. */
function placeHorizontally(input: OverlayPlacementInput) {
  const { anchorRect, overlaySize, visibleRect } = input;
  const { content, verticalRect, horizontalRect } = resolveSolvingRects(input);
  const main = solveMainAxis({
    anchorLow: anchorRect.left,
    anchorHigh: anchorRect.right,
    size: overlaySize.width,
    boundLow: horizontalRect.left,
    boundHigh: horizontalRect.right,
    gap: input.gap ?? DEFAULT_OVERLAY_GAP,
    prefersHigh: input.side === 'right',
  });
  const crossRect = content ? verticalRect : visibleRect;
  const cross = alignCrossAxis({
    anchorLow: anchorRect.top,
    anchorHigh: anchorRect.bottom,
    size: overlaySize.height,
    boundLow: crossRect.top,
    boundHigh: crossRect.bottom,
    align: input.align ?? 'start',
    startIsLow: true,
    offset: input.crossOffset ?? 0,
    clamps: !content,
  });
  return {
    main,
    side: main.isHigh ? ('right' as const) : ('left' as const),
    align: cross.align,
    left: clampFinite(main.position, horizontalRect.left, horizontalRect.right - main.size),
    top: cross.position,
    width: main.size,
    height: overlaySize.height,
    availableWidth: main.isHigh ? main.roomHigh : main.roomLow,
    availableHeight: Math.floor(crossRect.height),
  };
}

/**
 * Places an overlay on a side of its anchor (below unless `side` prefers another) and lines it up
 * with the anchor's start or end edge, or its centre, shifted by `crossOffset`. A side that cannot
 * fit the overlay flips to the opposite one; when neither fits, the roomier side wins and the
 * overlay is constrained to it. Horizontally the result is always clamped into the horizontal
 * rect; vertically only in `viewport` mode.
 */
export function resolveOverlayPlacement(input: OverlayPlacementInput): OverlayPlacement {
  const beside = input.side === 'left' || input.side === 'right';
  const placed = beside ? placeHorizontally(input) : placeVertically(input);
  const { verticalRect } = resolveSolvingRects(input);
  const gap = input.gap ?? DEFAULT_OVERLAY_GAP;
  const { anchorRect } = input;
  return {
    side: placed.side,
    align: placed.align,
    left: placed.left,
    top: placed.top,
    maxHeight: placed.height,
    maxWidth: placed.width,
    availableAbove: Math.max(0, Math.floor(anchorRect.top - verticalRect.top - gap)),
    availableBelow: Math.max(0, Math.floor(verticalRect.bottom - anchorRect.bottom - gap)),
    availableWidth: placed.availableWidth,
    availableHeight: placed.availableHeight,
    constrained: placed.main.constrained,
    transformOrigin: resolveTransformOrigin(placed.side, anchorRect, placed),
  };
}
