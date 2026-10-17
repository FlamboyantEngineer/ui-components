// Placement math for floating panels (menus, suggestion lists, fly-outs) anchored to an element
// or a point. Pure functions over rects; `overlay-geometry.ts` measures the DOM for them.

import { clamp } from './clamp.js';

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
export type OverlaySide = 'bottom' | 'top';
/** Which anchor edge the overlay lines up with: `start` is the left edge in left-to-right text. */
export type OverlayAlign = 'start' | 'end';
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
  /** Preferred alignment; flips to the other edge when only that one fits. Defaults to `start`. */
  align?: OverlayAlign | undefined;
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
  /** The height limit to apply when `constrained`; the overlay's own height otherwise. */
  maxHeight: number;
  availableAbove: number;
  availableBelow: number;
  /** The overlay is taller than the space on its side and needs `maxHeight`. */
  constrained: boolean;
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
export const DEFAULT_OVERLAY_GUTTER = 8;
/** Space between an anchor and its overlay. */
export const DEFAULT_OVERLAY_GAP = 6;
/** How far a submenu overlaps its parent menu. */
export const DEFAULT_SUBMENU_OVERLAP = 6;

/** Like `clamp`, but a non-finite bound falls back to the low bound (or 0). */
function clampFinite(value: number, min: number, max: number): number {
  const low = Number.isFinite(min) ? min : 0;
  return clamp(value, low, Number.isFinite(max) ? max : low);
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

/** The anchor edge an overlay lines up with, flipped when only the other edge fits, and its left. */
function alignToAnchor(
  input: OverlayPlacementInput,
  horizontalRect: OverlayRect,
): { align: OverlayAlign; left: number } {
  const { anchorRect, overlaySize } = input;
  const rtl = input.dir === 'rtl';
  const leftFits = anchorRect.left + overlaySize.width <= horizontalRect.right;
  const rightFits = anchorRect.right - overlaySize.width >= horizontalRect.left;
  const preferLeftEdge = (input.align ?? 'start') === 'start' ? !rtl : rtl;
  const useLeftEdge = preferLeftEdge ? leftFits || !rightFits : !rightFits && leftFits;
  return {
    align: useLeftEdge !== rtl ? 'start' : 'end',
    left: clampFinite(
      useLeftEdge ? anchorRect.left : anchorRect.right - overlaySize.width,
      horizontalRect.left,
      horizontalRect.right - overlaySize.width,
    ),
  };
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

/**
 * Places an overlay below or above its anchor, preferring below, and lines it up with the anchor's
 * start or end edge. A side that cannot fit the overlay flips to the other; when neither fits, the
 * roomier side wins and the overlay is constrained to it. In `viewport` mode the result is clamped
 * into the visible rect; horizontally it is always clamped into the horizontal rect.
 */
export function resolveOverlayPlacement(input: OverlayPlacementInput): OverlayPlacement {
  const gap = input.gap ?? DEFAULT_OVERLAY_GAP;
  const { anchorRect, overlaySize, visibleRect } = input;
  const { content, verticalRect, horizontalRect } = resolveSolvingRects(input);

  const availableAbove = Math.max(0, Math.floor(anchorRect.top - verticalRect.top - gap));
  const availableBelow = Math.max(0, Math.floor(verticalRect.bottom - anchorRect.bottom - gap));
  const side = chooseVerticalSide(availableAbove, availableBelow, overlaySize.height);
  const available = side === 'bottom' ? availableBelow : availableAbove;
  const constrained = overlaySize.height > available;
  const maxHeight = Math.max(0, constrained ? available : overlaySize.height);

  const top = side === 'bottom' ? anchorRect.bottom + gap : anchorRect.top - gap - maxHeight;
  return {
    side,
    ...alignToAnchor(input, horizontalRect),
    top: content ? top : clampFinite(top, visibleRect.top, visibleRect.bottom - maxHeight),
    maxHeight,
    availableAbove,
    availableBelow,
    constrained,
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
