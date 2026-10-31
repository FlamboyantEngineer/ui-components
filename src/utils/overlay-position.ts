// Placement math for floating panels (menus, suggestion lists, fly-outs) anchored to an element
// or a point. Pure functions over rects; `overlay-geometry.ts` measures the DOM for them.

import { alignCrossAxis, clampFinite, resolveAnchorPoint, solveMainAxis } from './overlay-axis.js';
import {
  DEFAULT_OVERLAY_GAP,
  DEFAULT_OVERLAY_GUTTER,
  DEFAULT_SUBMENU_OVERLAP,
} from './overlay-defaults.js';

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

/** The rects a placement is solved in: vertical room by mode, horizontal room as given. */
function resolveSolvingRects(input: OverlayPlacementInput | SubmenuPlacementInput) {
  const { visibleRect } = input;
  const content = input.mode === 'content';
  return {
    content,
    verticalRect: content ? (input.contentRect ?? visibleRect) : visibleRect,
    horizontalRect: input.horizontalRect ?? visibleRect,
  };
}

function chooseVerticalSide(above: number, below: number, height: number): OverlaySide {
  if (below >= height) return 'bottom';
  if (above >= height) return 'top';
  return below >= above ? 'bottom' : 'top';
}

/** The side a submenu opens on: the reading side when it fits or has at least as much room. */
function chooseSubmenuSide(
  input: SubmenuPlacementInput,
  horizontalRect: OverlayRect,
  overlap: number,
) {
  const { triggerRect, overlaySize } = input;
  const availableRight = Math.max(0, horizontalRect.right - triggerRect.right + overlap);
  const availableLeft = Math.max(0, triggerRect.left - horizontalRect.left + overlap);
  const [preferred, other, preferredRoom, otherRoom]: [SubmenuSide, SubmenuSide, number, number] =
    input.dir === 'rtl'
      ? ['left', 'right', availableLeft, availableRight]
      : ['right', 'left', availableRight, availableLeft];
  const side = preferredRoom >= overlaySize.width || preferredRoom >= otherRoom ? preferred : other;
  const left =
    side === 'right' ? triggerRect.right - overlap : triggerRect.left - overlaySize.width + overlap;
  return { side, left };
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

/**
 * Places a submenu beside its trigger row, overlapping the parent menu slightly. It opens on the
 * reading-direction side when it fits there or has more room there, and on the other side otherwise.
 * It extends down from the row when it fits, up when only that fits, else toward the roomier side,
 * constrained to it.
 */
export function resolveSubmenuPlacement(input: SubmenuPlacementInput): SubmenuPlacement {
  const overlap = input.overlap ?? DEFAULT_SUBMENU_OVERLAP;
  const gutter = input.gutter ?? DEFAULT_OVERLAY_GUTTER;
  const { triggerRect, overlaySize, visibleRect } = input;
  const { content, verticalRect, horizontalRect } = resolveSolvingRects(input);
  const { side, left } = chooseSubmenuSide(input, horizontalRect, overlap);

  const availableBelow = Math.max(0, verticalRect.bottom - triggerRect.top);
  const availableAbove = Math.max(0, triggerRect.bottom - verticalRect.top);
  const direction: SubmenuDirection =
    chooseVerticalSide(availableAbove, availableBelow, overlaySize.height) === 'bottom'
      ? 'down'
      : 'up';
  const available = direction === 'down' ? availableBelow : availableAbove;
  const constrained = overlaySize.height > available;
  const height = Math.max(0, constrained ? available : overlaySize.height);
  const top = direction === 'down' ? triggerRect.top : triggerRect.bottom - height;

  return {
    side,
    direction,
    left: clampFinite(left, horizontalRect.left, horizontalRect.right - overlaySize.width),
    top: content ? top : clampFinite(top, visibleRect.top, visibleRect.bottom - height),
    maxHeight: constrained ? Math.max(0, height - gutter) : overlaySize.height,
    constrained,
  };
}
