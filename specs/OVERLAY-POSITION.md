# Overlay Position

Placement utilities for floating panels a component positions itself (menus, suggestion lists, fly-out submenus), anchored to an element or to a point such as the pointer. The solvers in `src/utils/overlay-position.ts` (with the one-axis steps in `src/utils/overlay-axis.ts`) are pure functions over rects; the measuring helpers in `src/utils/overlay-geometry.ts` only read layout, and `src/utils/overlay-auto-update.ts` tells the caller when to solve again. Callers render the result as functional inline styles (`position`, `left`, `top`, `max-width`, `max-height`, `transform-origin`) and may publish the available size as documented `--ui-*` properties. React Aria overlays position themselves and do not need these utilities.

## UIC-OVERLAY-POSITION-1 - Anchored placement

### UIC-OVERLAY-POSITION-1.1 - Side

`resolveOverlayPlacement` shall place the overlay below its anchor, `gap` pixels away (6 by default), when it fits there; above it when only that fits; and otherwise on the side with more room. The result reports the `side` (`bottom` or `top`) and the room on each side.

Implementation: `src/utils/overlay-position.ts`, `src/utils/overlay-axis.ts`
Verification: `src/utils/overlay-position.test.ts`

### UIC-OVERLAY-POSITION-1.2 - Height constraint

When the overlay is taller than the room on its chosen side, the result shall be `constrained`, with `maxHeight` equal to that room, and the overlay placed at that height; otherwise `maxHeight` is the overlay's own height.

Implementation: `src/utils/overlay-position.ts`
Verification: `src/utils/overlay-position.test.ts`

### UIC-OVERLAY-POSITION-1.3 - Alignment

The overlay shall line up with the anchor's `start` edge (the default) or `end` edge, flipping to the other edge when only that one fits, and then be clamped into the horizontal boundary. In right-to-left text (`dir: 'rtl'`) the `start` edge is the right edge.

Implementation: `src/utils/overlay-position.ts`
Verification: `src/utils/overlay-position.test.ts`

### UIC-OVERLAY-POSITION-1.4 - Viewport and content modes

In `viewport` mode (the default) the room and the clamp shall use the visible boundary, so the overlay never leaves it. In `content` mode the room shall use the boundary's whole scrollable content and the overlay is not clamped vertically, so a tall overlay extends into the scrolled-away part and scrolls with the content.

Implementation: `src/utils/overlay-position.ts`
Verification: `src/utils/overlay-position.test.ts`

### UIC-OVERLAY-POSITION-1.5 - Point anchors

`createOverlayPointRect(x, y)` shall return a zero-size anchor rect at a viewport point, so an overlay opened at the pointer is solved like one anchored to an element.

Implementation: `src/utils/overlay-position.ts`
Verification: `src/utils/overlay-position.test.ts`

### UIC-OVERLAY-POSITION-1.6 - Preferred side

`side` shall choose the side the overlay prefers: `bottom` (the default), `top`, `left` or `right`. It opens there when it fits, on the opposite side when only that fits, and otherwise on the roomier of the two (the preferred one on a tie), constrained to it: `maxHeight` above or below the anchor, `maxWidth` beside it, with `constrained` set. Beside the anchor, `gap` separates them horizontally, `start` and `end` line the overlay up with the anchor's top and bottom edges, the overlay is clamped into the horizontal boundary, and it is clamped vertically in `viewport` mode only.

Implementation: `src/utils/overlay-position.ts`, `src/utils/overlay-axis.ts`, `src/utils/overlay-geometry.ts`
Verification: `src/utils/overlay-position.test.ts`, `src/utils/overlay-geometry.test.ts`

### UIC-OVERLAY-POSITION-1.7 - Centre alignment and cross offset

`align: 'center'` shall centre the overlay on the anchor along the anchor's edge, without flipping. `crossOffset` shall then move the overlay along that edge by its value in pixels (rightward above or below the anchor, downward beside it) before it is clamped.

Implementation: `src/utils/overlay-position.ts`, `src/utils/overlay-axis.ts`
Verification: `src/utils/overlay-position.test.ts`

### UIC-OVERLAY-POSITION-1.8 - Available size and anchor point

The result shall report `availableWidth` and `availableHeight`, the room the overlay may take: on its side of the anchor along the side's axis, and the boundary's extent along the other axis. `transformOrigin` shall be the point of the overlay's edge that faces the anchor nearest the anchor's middle, clamped into the overlay, as a CSS `transform-origin` in whole pixels (`30px 0px` for an overlay below), so an overlay can grow out of its anchor. `resolveOverlayGeometry` returns the same three values.

Implementation: `src/utils/overlay-position.ts`, `src/utils/overlay-axis.ts`, `src/utils/overlay-geometry.ts`
Verification: `src/utils/overlay-position.test.ts`, `src/utils/overlay-geometry.test.ts`

## UIC-OVERLAY-POSITION-2 - Submenus

### UIC-OVERLAY-POSITION-2.1 - Submenu side

`resolveSubmenuPlacement` shall place a submenu beside its trigger row, overlapping the parent by `overlap` pixels (6 by default), on the reading-direction side (right, or left with `dir: 'rtl'`) when it fits there or has at least as much room there, and on the other side otherwise; it is then clamped into the horizontal boundary.

Implementation: `src/utils/overlay-position.ts`
Verification: `src/utils/overlay-position.test.ts`

### UIC-OVERLAY-POSITION-2.2 - Submenu direction

The submenu shall extend `down` from the top of its trigger row when it fits, `up` from the bottom of the row when only that fits, and otherwise toward the side with more room, constrained to it with `maxHeight` equal to that room less `gutter` (8 by default). In `viewport` mode it is clamped into the visible boundary.

Implementation: `src/utils/overlay-position.ts`
Verification: `src/utils/overlay-position.test.ts`

## UIC-OVERLAY-POSITION-3 - Measuring

### UIC-OVERLAY-POSITION-3.1 - Boundary

`getOverlayBoundary` shall measure the window, or the part of a boundary element visible in the window, inset by `gutter`, as `visibleRect`; the scrollable content as `contentRect`; and as `horizontalRect` the content rect when the boundary scrolls horizontally, the visible rect otherwise.

Implementation: `src/utils/overlay-geometry.ts`
Verification: `src/utils/overlay-geometry.test.ts`

### UIC-OVERLAY-POSITION-3.2 - Scroll container

`findOverlayScrollContainer` shall return the nearest ancestor below the body whose overflow is `auto`, `scroll` or `overlay` and whose content is larger than its box, passing over ancestors for which `skip` returns true, and null when the page is the boundary.

Implementation: `src/utils/overlay-geometry.ts`
Verification: `src/utils/overlay-geometry.test.ts`

### UIC-OVERLAY-POSITION-3.3 - Measured geometry

`resolveOverlayGeometry` shall measure an overlay's natural size and solve its placement against an anchor element or rect, taking the solver's `side`, `align` and `crossOffset`. Above or below the anchor, an overlay wider than the boundary gets a `maxWidth` of the boundary width; beside it, an overlay wider than the room on its side gets a `maxWidth` of that room, and one taller than the boundary a `maxHeight` of the boundary height. A width limit is kept while the remeasured width equals it, so a wrapped overlay settles instead of oscillating, and released when the room grows. A constrained overlay gets a whole-pixel `maxHeight` and is placed at that height. Coordinates are whole pixels relative to the viewport for the `fixed` strategy, or to `offsetParent` (an element, or its rect and scroll offsets) for `absolute`.

Implementation: `src/utils/overlay-geometry.ts`
Verification: `src/utils/overlay-geometry.test.ts`

### UIC-OVERLAY-POSITION-3.4 - Geometry equality

`isSameOverlayGeometry` shall report whether two geometries render the same, so a caller can skip a state update that changes nothing.

Implementation: `src/utils/overlay-geometry.ts`
Verification: `src/utils/overlay-geometry.test.ts`

### UIC-OVERLAY-POSITION-3.5 - Auto-update

`autoUpdateOverlay({ anchor, overlay, update })` shall call `update` at once and then, at most once per animation frame, after any scroll in the anchor's document, a resize of its window, or a size change of the anchor or the overlay, from the timers and observers of the anchor's own window. `everyFrame` also compares the anchor's box every animation frame and calls `update` when it moved. The returned function removes every listener, observer and pending frame.

Implementation: `src/utils/overlay-auto-update.ts`
Verification: `src/utils/overlay-auto-update.test.ts`
