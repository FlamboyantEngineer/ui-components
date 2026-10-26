// Placement math for floating panels (menus, suggestion lists, fly-outs) anchored to an element
// or a point. Pure functions over rects; `overlay-geometry.ts` measures the DOM for them.
import { alignCrossAxis, clampFinite, resolveAnchorPoint, solveMainAxis } from './overlay-axis.js';
/** Space kept between an overlay and the boundary edges. */
export const DEFAULT_OVERLAY_GUTTER = 8;
/** Space between an anchor and its overlay. */
export const DEFAULT_OVERLAY_GAP = 6;
/** How far a submenu overlaps its parent menu. */
export const DEFAULT_SUBMENU_OVERLAP = 6;
/** The rects a placement is solved in: vertical room by mode, horizontal room as given. */
function resolveSolvingRects(input) {
    const { visibleRect } = input;
    const content = input.mode === 'content';
    return {
        content,
        verticalRect: content ? (input.contentRect ?? visibleRect) : visibleRect,
        horizontalRect: input.horizontalRect ?? visibleRect,
    };
}
function chooseVerticalSide(above, below, height) {
    if (below >= height)
        return 'bottom';
    if (above >= height)
        return 'top';
    return below >= above ? 'bottom' : 'top';
}
/** The side a submenu opens on: the reading side when it fits or has at least as much room. */
function chooseSubmenuSide(input, horizontalRect, overlap) {
    const { triggerRect, overlaySize } = input;
    const availableRight = Math.max(0, horizontalRect.right - triggerRect.right + overlap);
    const availableLeft = Math.max(0, triggerRect.left - horizontalRect.left + overlap);
    const [preferred, other, preferredRoom, otherRoom] = input.dir === 'rtl'
        ? ['left', 'right', availableLeft, availableRight]
        : ['right', 'left', availableRight, availableLeft];
    const side = preferredRoom >= overlaySize.width || preferredRoom >= otherRoom ? preferred : other;
    const left = side === 'right' ? triggerRect.right - overlap : triggerRect.left - overlaySize.width + overlap;
    return { side, left };
}
/** Copies any rect-like value (a `DOMRect`, or an object with edges) into an `OverlayRect`. */
export function toOverlayRect(rect) {
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
export function createOverlayPointRect(x, y) {
    return { left: x, top: y, right: x, bottom: y, width: 0, height: 0 };
}
/** The anchor point on the overlay's edge that faces the anchor, as a `transform-origin`. */
function resolveTransformOrigin(side, anchorRect, box) {
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
function placeVertically(input) {
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
        side: main.isHigh ? 'bottom' : 'top',
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
function placeHorizontally(input) {
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
        side: main.isHigh ? 'right' : 'left',
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
export function resolveOverlayPlacement(input) {
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
export function resolveSubmenuPlacement(input) {
    const overlap = input.overlap ?? DEFAULT_SUBMENU_OVERLAP;
    const gutter = input.gutter ?? DEFAULT_OVERLAY_GUTTER;
    const { triggerRect, overlaySize, visibleRect } = input;
    const { content, verticalRect, horizontalRect } = resolveSolvingRects(input);
    const { side, left } = chooseSubmenuSide(input, horizontalRect, overlap);
    const availableBelow = Math.max(0, verticalRect.bottom - triggerRect.top);
    const availableAbove = Math.max(0, triggerRect.bottom - verticalRect.top);
    const direction = chooseVerticalSide(availableAbove, availableBelow, overlaySize.height) === 'bottom'
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
//# sourceMappingURL=overlay-position.js.map