# Overlay Position

Placement utilities for floating panels a component positions itself (menus, suggestion lists, fly-out submenus), anchored to an element or to a point such as the pointer. The solvers in `src/utils/overlay-position.ts` are pure functions over rects; the measuring helpers in `src/utils/overlay-geometry.ts` only read layout. Callers render the result as functional inline styles (`position`, `left`, `top`, `max-width`, `max-height`). React Aria overlays position themselves and do not need these utilities.

## UIC-OVERLAY-POSITION-1 - Anchored placement

### UIC-OVERLAY-POSITION-1.1 - Side

`resolveOverlayPlacement` shall place the overlay below its anchor, `gap` pixels away (6 by default), when it fits there; above it when only that fits; and otherwise on the side with more room. The result reports the `side` (`bottom` or `top`) and the room on each side.

Implementation: `src/utils/overlay-position.ts`
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

`resolveOverlayGeometry` shall measure an overlay's natural size and solve its placement against an anchor element or rect. An overlay wider than the boundary gets a `maxWidth` of the boundary width, kept while its remeasured width equals that limit so a wrapped overlay settles instead of oscillating, and released when the boundary grows. A constrained overlay gets a whole-pixel `maxHeight` and is placed at that height. Coordinates are whole pixels relative to the viewport for the `fixed` strategy, or to `offsetParent` (an element, or its rect and scroll offsets) for `absolute`.

Implementation: `src/utils/overlay-geometry.ts`
Verification: `src/utils/overlay-geometry.test.ts`

### UIC-OVERLAY-POSITION-3.4 - Geometry equality

`isSameOverlayGeometry` shall report whether two geometries render the same, so a caller can skip a state update that changes nothing.

Implementation: `src/utils/overlay-geometry.ts`
Verification: `src/utils/overlay-geometry.test.ts`
