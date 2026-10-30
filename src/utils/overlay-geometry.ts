// Measures the DOM for overlay placement: the boundary an overlay must stay in, the scroll container
// that bounds it, and the measured geometry to render. Nothing here writes to the DOM.

import {
  DEFAULT_OVERLAY_GUTTER,
  resolveOverlayPlacement,
  toOverlayRect,
  type OverlayAlign,
  type OverlayMode,
  type OverlayPlacement,
  type OverlayRect,
  type OverlaySide,
  type OverlaySize,
} from './overlay-position.js';
import { isShallowEqual } from './is-shallow-equal.js';

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
export type OverlayOffsetParent =
  | HTMLElement
  | { rect: OverlayRect; scrollLeft: number; scrollTop: number };

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

/** A solved placement and the limits it needs, before conversion to the positioning origin. */
interface SolvedGeometry {
  placement: OverlayPlacement;
  maxWidth: number | null;
  maxHeight: number | null;
}

type Edges = Pick<OverlayRect, 'left' | 'top' | 'right' | 'bottom'>;

/** The scrollable extent of a boundary, the origin of its content and its visible box. */
interface BoundaryExtent {
  visibleRect: OverlayRect;
  contentLeft: number;
  contentTop: number;
  scrollWidth: number;
  scrollHeight: number;
  clientWidth: number;
  clientHeight: number;
}

const scrollingOverflow = /(auto|scroll|overlay)/;

/** A rect from its edges, with a size that never goes below zero. */
function createRectFromEdges({ left, top, right, bottom }: Edges): OverlayRect {
  return {
    left,
    top,
    right,
    bottom,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function measureWindowExtent(view: Window, gutter: number): BoundaryExtent {
  const { documentElement, body } = view.document;
  return {
    visibleRect: createRectFromEdges({
      left: gutter,
      top: gutter,
      right: Math.max(gutter, view.innerWidth - gutter),
      bottom: Math.max(gutter, view.innerHeight - gutter),
    }),
    contentLeft: gutter - view.scrollX,
    contentTop: gutter - view.scrollY,
    scrollWidth: Math.max(
      view.innerWidth,
      documentElement?.scrollWidth ?? 0,
      body?.scrollWidth ?? 0,
    ),
    scrollHeight: Math.max(
      view.innerHeight,
      documentElement?.scrollHeight ?? 0,
      body?.scrollHeight ?? 0,
    ),
    clientWidth: view.innerWidth,
    clientHeight: view.innerHeight,
  };
}

function measureElementExtent(element: HTMLElement, view: Window, gutter: number): BoundaryExtent {
  const box = element.getBoundingClientRect();
  return {
    visibleRect: createRectFromEdges({
      left: Math.max(gutter, box.left + gutter),
      top: Math.max(gutter, box.top + gutter),
      right: Math.min(view.innerWidth - gutter, box.right - gutter),
      bottom: Math.min(view.innerHeight - gutter, box.bottom - gutter),
    }),
    contentLeft: box.left - element.scrollLeft + gutter,
    contentTop: box.top - element.scrollTop + gutter,
    scrollWidth: Math.max(element.scrollWidth, element.clientWidth),
    scrollHeight: Math.max(element.scrollHeight, element.clientHeight),
    clientWidth: element.clientWidth,
    clientHeight: element.clientHeight,
  };
}

function toBoundary(extent: BoundaryExtent, gutter: number): OverlayBoundary {
  const { visibleRect, contentLeft, contentTop } = extent;
  // The gutter insets the content box at both ends of each axis.
  const contentRect = createRectFromEdges({
    left: contentLeft,
    top: contentTop,
    right: Math.max(contentLeft, contentLeft + extent.scrollWidth - 2 * gutter),
    bottom: Math.max(contentTop, contentTop + extent.scrollHeight - 2 * gutter),
  });
  const hasHorizontalScroll = extent.scrollWidth > extent.clientWidth + 1;
  return {
    visibleRect,
    contentRect,
    horizontalRect: hasHorizontalScroll ? contentRect : visibleRect,
    hasHorizontalScroll,
    hasVerticalScroll: extent.scrollHeight > extent.clientHeight + 1,
  };
}

function isScrollContainer(element: HTMLElement): boolean {
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  const scrollsY =
    scrollingOverflow.test(style?.overflowY ?? '') &&
    element.scrollHeight > element.clientHeight + 1;
  const scrollsX =
    scrollingOverflow.test(style?.overflowX ?? '') && element.scrollWidth > element.clientWidth + 1;
  return scrollsY || scrollsX;
}

function resolveOffsetOrigin(parent: OverlayOffsetParent) {
  if ('getBoundingClientRect' in parent) {
    return {
      rect: toOverlayRect(parent.getBoundingClientRect()),
      scrollLeft: parent.scrollLeft,
      scrollTop: parent.scrollTop,
    };
  }
  return parent;
}

function measureNaturalSize(overlay: HTMLElement): OverlaySize {
  const measured = overlay.getBoundingClientRect();
  return {
    width: Math.max(overlay.scrollWidth, overlay.offsetWidth, measured.width),
    height: Math.max(overlay.scrollHeight, overlay.offsetHeight, measured.height),
  };
}

/**
 * The whole-pixel limit for a size that does not fit `room`, or null. A size already at the limit
 * keeps it, so a wrapped overlay settles instead of oscillating between capped and natural sizes.
 */
function resolveLimit(size: number, room: number): number | null {
  const limit = Math.max(1, Math.floor(room));
  return size > room || size >= limit ? limit : null;
}

/** Above or below the anchor: the width is capped by the boundary, the height by the room. */
function solveAboveOrBelow(
  natural: OverlaySize,
  horizontalRect: OverlayRect,
  solve: (size: OverlaySize) => OverlayPlacement,
): SolvedGeometry {
  const maxWidth = resolveLimit(natural.width, horizontalRect.width);
  const width = maxWidth ?? natural.width;
  let placement = solve({ width, height: natural.height });
  const maxHeight = placement.constrained ? Math.max(1, Math.floor(placement.maxHeight)) : null;
  if (maxHeight !== null) placement = solve({ width, height: Math.min(natural.height, maxHeight) });
  return { placement, maxWidth, maxHeight };
}

/** Left or right of the anchor: the height is capped by the boundary, the width by the room. */
function solveBeside(
  natural: OverlaySize,
  crossRect: OverlayRect,
  solve: (size: OverlaySize) => OverlayPlacement,
): SolvedGeometry {
  const maxHeight =
    natural.height > crossRect.height ? Math.max(1, Math.floor(crossRect.height)) : null;
  const height = maxHeight ?? natural.height;
  let placement = solve({ width: natural.width, height });
  const maxWidth = resolveLimit(natural.width, placement.availableWidth);
  if (maxWidth !== null) placement = solve({ width: maxWidth, height });
  return { placement, maxWidth, maxHeight };
}

/**
 * Measures the boundary an overlay is solved against: the window, or the visible part of
 * `boundaryElement` within the window, each inset by `gutter`; plus its scrollable content.
 */
export function getOverlayBoundary(
  boundaryElement?: HTMLElement | null,
  options: { gutter?: number | undefined; ownerWindow?: Window | undefined } = {},
): OverlayBoundary {
  const gutter = options.gutter ?? 0;
  const view = options.ownerWindow ?? boundaryElement?.ownerDocument.defaultView ?? window;
  const extent = boundaryElement
    ? measureElementExtent(boundaryElement, view, gutter)
    : measureWindowExtent(view, gutter);
  return toBoundary(extent, gutter);
}

/**
 * The nearest ancestor of `element` that scrolls (overflow `auto`, `scroll` or `overlay` with content
 * larger than its box), below the body. `skip` passes over ancestors that must not bound an overlay,
 * such as a one-line scrolling strip. Returns null when the page itself is the boundary.
 */
export function findOverlayScrollContainer(
  element: Element | null | undefined,
  options: { skip?: ((ancestor: HTMLElement) => boolean) | undefined } = {},
): HTMLElement | null {
  for (let current = element?.parentElement; current; current = current.parentElement) {
    const { documentElement, body } = current.ownerDocument;
    if (current === documentElement || current === body) return null;
    if (!options.skip?.(current) && isScrollContainer(current)) return current;
  }
  return null;
}

/**
 * Measures `overlay` at its natural size and solves its placement against `anchor` (an element or
 * a rect such as `createOverlayPointRect`). An overlay wider than the boundary gets a `maxWidth` that is
 * kept while its remeasured width equals the limit, so a wrapped overlay does not oscillate between
 * capped and natural widths; a taller one gets a `maxHeight` and is placed at that height.
 * Coordinates are relative to the viewport, or to `offsetParent` for the `absolute` strategy.
 */
export function resolveOverlayGeometry(
  overlay: HTMLElement,
  anchor: HTMLElement | OverlayRect,
  options: OverlayGeometryOptions = {},
): OverlayGeometry {
  const strategy = options.strategy ?? 'fixed';
  const mode = options.mode ?? 'viewport';
  const boundary = getOverlayBoundary(options.boundaryElement, {
    gutter: options.gutter ?? DEFAULT_OVERLAY_GUTTER,
    ownerWindow: overlay.ownerDocument.defaultView ?? undefined,
  });
  const horizontalRect = mode === 'content' ? boundary.horizontalRect : boundary.visibleRect;
  const contentRect = mode === 'content' ? boundary.contentRect : boundary.visibleRect;
  const anchorRect =
    'getBoundingClientRect' in anchor ? toOverlayRect(anchor.getBoundingClientRect()) : anchor;
  const solve = (overlaySize: OverlaySize) =>
    resolveOverlayPlacement({
      anchorRect,
      overlaySize,
      visibleRect: boundary.visibleRect,
      contentRect,
      horizontalRect,
      side: options.side,
      align: options.align,
      crossOffset: options.crossOffset,
      dir: options.dir,
      gap: options.gap,
      mode,
    });
  const natural = measureNaturalSize(overlay);
  const { placement, maxWidth, maxHeight } =
    options.side === 'left' || options.side === 'right'
      ? solveBeside(natural, contentRect, solve)
      : solveAboveOrBelow(natural, horizontalRect, solve);

  const origin =
    strategy === 'absolute' && options.offsetParent
      ? resolveOffsetOrigin(options.offsetParent)
      : null;
  const left = origin ? placement.left - origin.rect.left + origin.scrollLeft : placement.left;
  const top = origin ? placement.top - origin.rect.top + origin.scrollTop : placement.top;

  return {
    strategy,
    left: Math.round(left),
    top: Math.round(top),
    maxWidth,
    maxHeight,
    side: placement.side,
    align: placement.align,
    constrained: maxHeight !== null,
    constrainedWidth: maxWidth !== null,
    availableWidth: placement.availableWidth,
    availableHeight: placement.availableHeight,
    transformOrigin: placement.transformOrigin,
  };
}

/** Whether two geometries would render the same, to skip redundant state updates. */
export function isSameOverlayGeometry(
  a: OverlayGeometry | null | undefined,
  b: OverlayGeometry | null | undefined,
): boolean {
  return isShallowEqual(a, b);
}
