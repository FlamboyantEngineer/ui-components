# Canvas Viewport

`CanvasViewport` gives caller-rendered layers one camera and pointer lifecycle. The caller supplies geometry, hit areas, path data and connection rules. The [assembly lab](../labs/src/canvas-viewport-assembly.tsx) shows a layout shared by SVG groups, connection paths and embedded controls.

## UIC-CANVAS-VIEWPORT-1 - Scene and camera

### UIC-CANVAS-VIEWPORT-1.1 - Layers and controls

The viewport shall render a focusable group with caller-provided ARIA labelling. Its root forwards the caller's class, id, data attributes, ref and context-menu handler. The host sizes the root. Its children share one transformed world layer and can include SVG and HTML in caller-chosen stacking order. The reference sheet clips the scene at the surface after the camera transform, so direct SVG layers can draw beyond their own boxes. The `controls` slot sits beside the surface, stays untransformed and keeps its own pointer and wheel events.

Implementation: `src/components/canvas-viewport/canvas-viewport.tsx`, `labs/reference/canvas-viewport.css`
Verification: `src/components/canvas-viewport/canvas-viewport.test.tsx`, `e2e/canvas-viewport.spec.ts`

### UIC-CANVAS-VIEWPORT-1.2 - Camera and coordinates

`viewport` controls the camera and `defaultViewport` supplies the uncontrolled starting value. The default is the origin at 100%. Pan offsets are layout pixels and zoom is a positive, finite percentage. Changes report through `onViewportChange`. A descendant uses `useCanvasViewport` or the caller uses `controllerRef` to read the displayed camera, convert between client and world points, read visible world bounds or issue a camera command. Conversions account for the current client position and axis-aligned ancestor scaling. Visible bounds use the current surface size and return null until it has room.

Implementation: `src/components/canvas-viewport/use-canvas-camera.ts`, `src/utils/canvas-transform.ts`
Verification: `src/components/canvas-viewport/canvas-viewport.test.tsx`, `e2e/canvas-viewport.spec.ts`

### UIC-CANVAS-VIEWPORT-1.3 - Pan, zoom and fit

A primary drag on the surface, world layer or an empty direct SVG layer shall pan. A plain wheel pans unless a scrollable child consumes it. Ctrl or Command with the wheel zooms at the pointer. When the viewport has focus, `+`, `=` and `-` step zoom. `zoomTo` accepts a client point and defaults to the viewport centre. `fitToBounds` centres the requested rectangle using the current pane size and even padding in layout pixels, 24 by default. Padding is limited to leave room for the scene. Fit, the wheel and `zoomTo` can zoom below the lowest keyboard step of 25%. Zoom commands have a 400% maximum.

Implementation: `src/components/canvas-viewport/use-canvas-camera.ts`, `src/components/canvas-viewport/use-canvas-pointer.ts`, `src/utils/use-canvas-wheel.ts`
Verification: `src/components/canvas-viewport/canvas-viewport.test.tsx`, `e2e/canvas-viewport.spec.ts`

### UIC-CANVAS-VIEWPORT-1.4 - Transform updates

A camera-only change shall update one world transform. Stable scene children keep their component instances, so a pan can draw 100 elements and 300 paths without rerunning caller path generation.

Implementation: `src/components/canvas-viewport/canvas-viewport.tsx`
Verification: `src/components/canvas-viewport/canvas-viewport.test.tsx`, `e2e/canvas-viewport.spec.ts`

## UIC-CANVAS-VIEWPORT-2 - Interaction

### UIC-CANVAS-VIEWPORT-2.1 - Claims and cancellation

A hit target can call `claimGesture` in its bubbling `onPointerDown` with callbacks for preview, commit and cleanup. The first valid claim on the primary press wins. The viewport captures the pointer when the press reaches the surface and suppresses native drag starts while it owns the press. The gesture keeps its callbacks from the press. Preview supplies the start and current world points and current client point. Commit supplies the release coordinates. Escape, pointer cancellation, lost capture on the surface and abandoned releases invoke cleanup without commit.

Implementation: `src/components/canvas-viewport/use-canvas-pointer.ts`, `src/utils/use-pointer-drag.ts`
Verification: `src/components/canvas-viewport/canvas-viewport.test.tsx`, `e2e/canvas-viewport.spec.ts`

### UIC-CANVAS-VIEWPORT-2.2 - Focus and child controls

Embedded React controls retain focus, clicks, keys and context-menu events. Keyboard focus on an offscreen scene control pans it into view. Children can handle keys before the viewport. Right-button presses remain available for context menus.

Implementation: `src/components/canvas-viewport/canvas-viewport.tsx`, `src/components/canvas-viewport/use-canvas-camera.ts`
Verification: `src/components/canvas-viewport/canvas-viewport.test.tsx`, `e2e/canvas-viewport.spec.ts`

## UIC-CANVAS-VIEWPORT-3 - Elements and connections

### UIC-CANVAS-VIEWPORT-3.1 - Relative elements and named anchors

`CanvasElement` renders a translated SVG group with a caller-assigned `elementId`, unique in the viewport. Nested groups follow their parents. Groups can include HTML controls in SVG `foreignObject` elements. `resolveCanvasAnchors` indexes a caller-owned layout tree, adding each ancestor origin to the named local offset to obtain a world point. Callers can place anchors anywhere and keep paths attached as element positions or size-dependent offsets change.

Implementation: `src/components/canvas-viewport/canvas-element.tsx`, `src/components/canvas-viewport/canvas-elements.ts`
Verification: `src/components/canvas-viewport/canvas-viewport.test.tsx`, `e2e/canvas-viewport.spec.ts`

### UIC-CANVAS-VIEWPORT-3.2 - Creating connections

`useCanvasAnchor(anchorId)` binds a caller-rendered, labelled native button inside a `CanvasElement`. Activate an anchor with Enter or Space, Tab to another and activate it to request a connection. The keyboard source exposes `aria-pressed`. Escape or focus leaving the viewport clears it. A pointer can drag from one anchor and release over another. Pointer previews report the world point and the anchor under the pointer, if present. Keyboard previews report the source. Ending or abandoning a preview reports null. `onConnect` receives both endpoints as `{elementId, anchorId}` pairs, including endpoints on descendants of different parents. The caller decides whether to add the link. Disabled anchors refuse activation and drops.

Implementation: `src/components/canvas-viewport/use-canvas-anchor.ts`, `src/components/canvas-viewport/use-canvas-connection.ts`
Verification: `src/components/canvas-viewport/canvas-viewport.test.tsx`, `e2e/canvas-viewport.spec.ts`

## Hooks

| Hook                           | Kind | Values | Description                             |
| ------------------------------ | ---- | ------ | --------------------------------------- |
| `ui-canvas-viewport`           | root |        | The viewport group.                     |
| `ui-canvas-viewport__surface`  | slot |        | The clipped pan and zoom surface.       |
| `ui-canvas-viewport__world`    | slot |        | The shared transform and caller layers. |
| `ui-canvas-viewport__controls` | slot |        | Untransformed caller controls.          |
| `ui-canvas-viewport__anchor`   | slot |        | A caller-rendered anchor button.        |
| `ui-canvas-element`            | root |        | A positioned SVG group.                 |
