// Placement math for floating panels (menus, suggestion lists, fly-outs) anchored to an element
// or a point. Pure functions over rects, plus helpers that measure the DOM; nothing here writes to
// the DOM. Callers render the result as functional inline styles.

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

/** Space kept between an overlay and the boundary edges. */
export const DEFAULT_OVERLAY_GUTTER = 8;
/** Space between an anchor and its overlay. */
export const DEFAULT_OVERLAY_GAP = 6;
/** How far a submenu overlaps its parent menu. */
export const DEFAULT_SUBMENU_OVERLAP = 6;

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
  align?: OverlayAlign | undefined;
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
}

function clamp(value: number, min: number, max: number): number {
  const low = Number.isFinite(min) ? min : 0;
  const high = Math.max(low, Number.isFinite(max) ? max : low);
  return Math.min(Math.max(low, value), high);
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
export function overlayPointRect(x: number, y: number): OverlayRect {
  return { left: x, top: y, right: x, bottom: y, width: 0, height: 0 };
}

function rectFrom(left: number, top: number, right: number, bottom: number): OverlayRect {
  return {
    left,
    top,
    right,
    bottom,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function verticalSide(above: number, below: number, height: number): OverlaySide {
  if (below >= height) return 'bottom';
  if (above >= height) return 'top';
  return below >= above ? 'bottom' : 'top';
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
  const content = input.mode === 'content';
  const verticalRect = content ? (input.contentRect ?? visibleRect) : visibleRect;
  const horizontalRect = input.horizontalRect ?? visibleRect;

  const availableAbove = Math.max(0, Math.floor(anchorRect.top - verticalRect.top - gap));
  const availableBelow = Math.max(0, Math.floor(verticalRect.bottom - anchorRect.bottom - gap));
  const side = verticalSide(availableAbove, availableBelow, overlaySize.height);
  const available = side === 'bottom' ? availableBelow : availableAbove;
  const constrained = overlaySize.height > available;
  const maxHeight = Math.max(0, constrained ? available : overlaySize.height);

  const rtl = input.dir === 'rtl';
  const leftFits = anchorRect.left + overlaySize.width <= horizontalRect.right;
  const rightFits = anchorRect.right - overlaySize.width >= horizontalRect.left;
  const preferLeftEdge = (input.align ?? 'start') === 'start' ? !rtl : rtl;
  const useLeftEdge = preferLeftEdge ? leftFits || !rightFits : !rightFits && leftFits;
  const align: OverlayAlign = useLeftEdge !== rtl ? 'start' : 'end';
  const left = clamp(
    useLeftEdge ? anchorRect.left : anchorRect.right - overlaySize.width,
    horizontalRect.left,
    horizontalRect.right - overlaySize.width,
  );

  const top = side === 'bottom' ? anchorRect.bottom + gap : anchorRect.top - gap - maxHeight;
  return {
    side,
    align,
    left,
    top: content ? top : clamp(top, visibleRect.top, visibleRect.bottom - maxHeight),
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
  const content = input.mode === 'content';
  const verticalRect = content ? (input.contentRect ?? visibleRect) : visibleRect;
  const horizontalRect = input.horizontalRect ?? visibleRect;

  const availableRight = Math.max(0, horizontalRect.right - triggerRect.right + overlap);
  const availableLeft = Math.max(0, triggerRect.left - horizontalRect.left + overlap);
  const [preferred, other, preferredRoom, otherRoom]: [SubmenuSide, SubmenuSide, number, number] =
    input.dir === 'rtl'
      ? ['left', 'right', availableLeft, availableRight]
      : ['right', 'left', availableRight, availableLeft];
  const side = preferredRoom >= overlaySize.width || preferredRoom >= otherRoom ? preferred : other;
  const preferredLeft =
    side === 'right' ? triggerRect.right - overlap : triggerRect.left - overlaySize.width + overlap;

  const availableBelow = Math.max(0, verticalRect.bottom - triggerRect.top);
  const availableAbove = Math.max(0, triggerRect.bottom - verticalRect.top);
  const direction: SubmenuDirection =
    verticalSide(availableAbove, availableBelow, overlaySize.height) === 'bottom' ? 'down' : 'up';
  const available = direction === 'down' ? availableBelow : availableAbove;
  const constrained = overlaySize.height > available;
  const height = Math.max(0, constrained ? available : overlaySize.height);
  const preferredTop = direction === 'down' ? triggerRect.top : triggerRect.bottom - height;

  return {
    side,
    direction,
    left: clamp(preferredLeft, horizontalRect.left, horizontalRect.right - overlaySize.width),
    top: content ? preferredTop : clamp(preferredTop, visibleRect.top, visibleRect.bottom - height),
    maxHeight: constrained ? Math.max(0, height - gutter) : overlaySize.height,
    constrained,
  };
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

  if (!boundaryElement) {
    const { documentElement, body } = view.document;
    const scrollWidth = Math.max(
      view.innerWidth,
      documentElement?.scrollWidth ?? 0,
      body?.scrollWidth ?? 0,
    );
    const scrollHeight = Math.max(
      view.innerHeight,
      documentElement?.scrollHeight ?? 0,
      body?.scrollHeight ?? 0,
    );
    const visibleRect = rectFrom(
      gutter,
      gutter,
      Math.max(gutter, view.innerWidth - gutter),
      Math.max(gutter, view.innerHeight - gutter),
    );
    const contentLeft = gutter - view.scrollX;
    const contentTop = gutter - view.scrollY;
    const contentRect = rectFrom(
      contentLeft,
      contentTop,
      Math.max(contentLeft, scrollWidth - view.scrollX - gutter),
      Math.max(contentTop, scrollHeight - view.scrollY - gutter),
    );
    const hasHorizontalScroll = scrollWidth > view.innerWidth + 1;
    return {
      visibleRect,
      contentRect,
      horizontalRect: hasHorizontalScroll ? contentRect : visibleRect,
      hasHorizontalScroll,
      hasVerticalScroll: scrollHeight > view.innerHeight + 1,
    };
  }

  const box = boundaryElement.getBoundingClientRect();
  const visibleRect = rectFrom(
    Math.max(gutter, box.left + gutter),
    Math.max(gutter, box.top + gutter),
    Math.min(view.innerWidth - gutter, box.right - gutter),
    Math.min(view.innerHeight - gutter, box.bottom - gutter),
  );
  const scrollWidth = Math.max(boundaryElement.scrollWidth, boundaryElement.clientWidth);
  const scrollHeight = Math.max(boundaryElement.scrollHeight, boundaryElement.clientHeight);
  const contentLeft = box.left - boundaryElement.scrollLeft + gutter;
  const contentTop = box.top - boundaryElement.scrollTop + gutter;
  const contentRect = rectFrom(
    contentLeft,
    contentTop,
    Math.max(contentLeft, box.left - boundaryElement.scrollLeft + scrollWidth - gutter),
    Math.max(contentTop, box.top - boundaryElement.scrollTop + scrollHeight - gutter),
  );
  const hasHorizontalScroll = scrollWidth > boundaryElement.clientWidth + 1;
  return {
    visibleRect,
    contentRect,
    horizontalRect: hasHorizontalScroll ? contentRect : visibleRect,
    hasHorizontalScroll,
    hasVerticalScroll: scrollHeight > boundaryElement.clientHeight + 1,
  };
}

const SCROLLING = /(auto|scroll|overlay)/;

/**
 * The nearest ancestor of `element` that scrolls (overflow `auto`, `scroll` or `overlay` with content
 * larger than its box), below the body. `skip` passes over ancestors that must not bound an overlay,
 * such as a one-line scrolling strip. Returns null when the page itself is the boundary.
 */
export function findOverlayScrollContainer(
  element: Element | null | undefined,
  options: { skip?: ((ancestor: HTMLElement) => boolean) | undefined } = {},
): HTMLElement | null {
  let current = element?.parentElement ?? null;
  while (current) {
    const document = current.ownerDocument;
    if (current === document.documentElement || current === document.body) return null;
    if (!options.skip?.(current)) {
      const style = document.defaultView?.getComputedStyle(current);
      const scrollsY =
        SCROLLING.test(style?.overflowY ?? '') && current.scrollHeight > current.clientHeight + 1;
      const scrollsX =
        SCROLLING.test(style?.overflowX ?? '') && current.scrollWidth > current.clientWidth + 1;
      if (scrollsY || scrollsX) return current;
    }
    current = current.parentElement;
  }
  return null;
}

function offsetOrigin(parent: OverlayOffsetParent) {
  if ('getBoundingClientRect' in parent) {
    return {
      rect: toOverlayRect(parent.getBoundingClientRect()),
      scrollLeft: parent.scrollLeft,
      scrollTop: parent.scrollTop,
    };
  }
  return parent;
}

/**
 * Measures `overlay` at its natural size and solves its placement against `anchor` (an element or
 * a rect such as `overlayPointRect`). An overlay wider than the boundary gets a `maxWidth` that is
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
  const measured = overlay.getBoundingClientRect();
  const naturalWidth = Math.max(overlay.scrollWidth, overlay.offsetWidth, measured.width);
  const naturalHeight = Math.max(overlay.scrollHeight, overlay.offsetHeight, measured.height);
  const widthLimit = Math.max(1, Math.floor(horizontalRect.width));
  const constrainedWidth = naturalWidth > horizontalRect.width || naturalWidth >= widthLimit;
  const width = constrainedWidth ? widthLimit : naturalWidth;
  const anchorRect =
    'getBoundingClientRect' in anchor ? toOverlayRect(anchor.getBoundingClientRect()) : anchor;

  const solve = (height: number) =>
    resolveOverlayPlacement({
      anchorRect,
      overlaySize: { width, height },
      visibleRect: boundary.visibleRect,
      contentRect: mode === 'content' ? boundary.contentRect : boundary.visibleRect,
      horizontalRect,
      align: options.align,
      dir: options.dir,
      gap: options.gap,
      mode,
    });

  let placement = solve(naturalHeight);
  const maxHeight = placement.constrained ? Math.max(1, Math.floor(placement.maxHeight)) : null;
  if (maxHeight !== null) placement = solve(Math.min(naturalHeight, maxHeight));

  let { left, top } = placement;
  if (strategy === 'absolute' && options.offsetParent) {
    const origin = offsetOrigin(options.offsetParent);
    left = left - origin.rect.left + origin.scrollLeft;
    top = top - origin.rect.top + origin.scrollTop;
  }

  return {
    strategy,
    left: Math.round(left),
    top: Math.round(top),
    maxWidth: constrainedWidth ? width : null,
    maxHeight,
    side: placement.side,
    align: placement.align,
    constrained: maxHeight !== null,
    constrainedWidth,
  };
}

/** Whether two geometries would render the same, to skip redundant state updates. */
export function isSameOverlayGeometry(
  a: OverlayGeometry | null | undefined,
  b: OverlayGeometry | null | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.strategy === b.strategy &&
    a.left === b.left &&
    a.top === b.top &&
    a.maxWidth === b.maxWidth &&
    a.maxHeight === b.maxHeight &&
    a.side === b.side &&
    a.align === b.align &&
    a.constrained === b.constrained &&
    a.constrainedWidth === b.constrainedWidth
  );
}
