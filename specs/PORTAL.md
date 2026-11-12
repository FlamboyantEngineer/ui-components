# Portal

`Portal` renders its children outside the surrounding layout, in an overlay container, while keeping them in the React tree. The container is the document body unless `PortalContainerProvider` or `PortalHost` chooses another. Every portal sits on one of a fixed, ordered set of overlay layers, so a later layer always stacks above an earlier one. A portal draws nothing of its own: the overlay inside it draws its surface, places itself and owns its semantics.

React Aria overlays (`Popover`, `Modal`, `Tooltip`, `UNSTABLE_Toast*`) portal themselves and are positioned and dismissed by React Aria. They do not go inside a `Portal`, but they render into the same container: `PortalContainerProvider` and `PortalHost` set React Aria's portal provider too (UIC-PORTAL-1.2). `Portal` is for overlays the library or a host builds without a React Aria overlay, and it cooperates with open React Aria overlays as described in [UIC-PORTAL-3.2](#uic-portal-32---react-aria-overlays).

## UIC-PORTAL-1 - Container

### UIC-PORTAL-1.1 - Rendering into the container

`Portal` shall render its children inside a wrapper element carrying `ui-portal`, appended as a child of the overlay container, which is the document body when no provider chooses one. The children stay in the React tree of the component that renders the portal: they read its context, and their React events bubble to its React ancestors, not to the ancestors of the container.

Implementation: `src/components/portal/portal.tsx`
Verification: `src/components/portal/portal.test.tsx`, `e2e/portal.spec.ts`

### UIC-PORTAL-1.2 - Choosing the container

`PortalContainerProvider` shall make its `container` element the container of every portal below it; the nearest provider wins, and a provider without `container` keeps the outer one. A `container` of `null` means the container is not available yet: portals below render nothing until it is, and never fall back to the document body. The provider shall also point React Aria's portal provider at the same container, so every library overlay below renders there, whether it is a `Portal` or a React Aria overlay: popovers, menus, selects, dialogs, drawers, the command palette, tooltips and toasts. Overlays the library portals itself render through `Portal` (floating and retained dialogs, `TourSpotlight`) or, when they position themselves against their containing block, straight into the same container with the same wait for hydration and for a container that is not ready (`AnchoredTooltip`).

Implementation: `src/components/portal/portal.tsx`
Verification: `src/components/portal/portal.test.tsx`

### UIC-PORTAL-1.3 - Portal host

`PortalHost` shall render its children followed by one container element carrying `ui-portal-host`, and make that element the container of every portal below it, so overlays stay in the host's part of the page (a themed preview, an embedded frame) and inherit what the stylesheet sets there. This holds for every library overlay (UIC-PORTAL-1.2). Removing the `PortalHost` removes its container and every portal in it. A `PortalHost` nested inside another is the container for the portals below it.

Implementation: `src/components/portal/portal.tsx`, `labs/reference/portal.css`
Verification: `src/components/portal/portal.test.tsx`, `e2e/portal.spec.ts`

### UIC-PORTAL-1.4 - Server rendering and hydration

`Portal` shall render nothing on the server and during hydration, and mount its content in the container right after hydration, so server and client markup match.

Implementation: `src/components/portal/portal.tsx`
Verification: `src/components/portal/portal.test.tsx`

### UIC-PORTAL-1.5 - Rendering in place

`inPlace` shall render the portal's wrapper where the portal is declared instead of in the container, with the same hooks, layer, z-index and top-layer mark, so an overlay can stay inline for tests or an embedded host while it keeps its layer. A portal in place also renders on the server, since it needs no container.

Implementation: `src/components/portal/portal.tsx`
Verification: `src/components/portal/portal.test.tsx`, `e2e/portal.spec.ts`

### UIC-PORTAL-1.6 - Nodes of another window

Components rendered into another window's document, a same-origin frame or a popup window a `PortalHost` sits in, shall treat that window's nodes as their own: event targets, focused elements and focus targets are recognised as nodes, elements, HTML elements and shadow roots by their node type and namespace, and events by their fields, never by the script window's constructors, so fields in the frame keep their keys, forms focus their first invalid control and cell editing, drags and focus rescue follow the target. Lint rejects `instanceof Node`, `Element`, `ShadowRoot`, an HTML or SVG element constructor or an event constructor in the library's source.

Implementation: `src/utils/is-element.ts`, `src/utils/focus-target.ts`, `eslint.config.js`
Verification: `src/utils/is-element.test.ts`

### UIC-PORTAL-1.7 - Own document and window

Components shall listen, look up and measure in the document and window of their own element (`getOwnerDocument`, `getOwnerWindow`), so in a same-origin frame or a popup window they hear that window's keys and presses, find ids in their own tree (its shadow root, else its document) and, for ids of their own parts or targets, only inside themselves, hit-test, read the focused element and computed styles, schedule animation frames and read the pixel ratio there. An overlay with no element yet reads the document of its portal container. Lint rejects the script's `document`, `window`, `getComputedStyle`, `requestAnimationFrame` and `cancelAnimationFrame` in `src/components`, except where a choice is made in render before there is an element (eye-dropper and touch-pointer support, the default portal container and the pane host a dock panel creates), where the controller owns no element, and for leaving or opening a page. Timers use the bare `setTimeout` and `clearTimeout`.

Implementation: `src/utils/owner-window.ts`, `eslint.config.js`
Verification: `src/utils/owner-window.test.ts`, `src/components/problem-list/problem-list.test.tsx`, `src/components/pdf-viewer/page-bitmap.test.ts`

### UIC-PORTAL-1.8 - Shadow roots

`enableShadowRoots()` shall turn on support for rendering inside shadow roots, as web components hold the library, for the whole page: presses, focus moves, focus containment and outside-press checks follow events and focus across shadow boundaries, through React Aria's shadow DOM support. A host calls it once before rendering into a shadow root; it cannot be turned off, and without it presses on the library's buttons inside a shadow root may not register. Ids a component looks up inside itself are found in its own tree and never outside the component (UIC-PORTAL-1.7).

Implementation: `src/components/portal/shadow-roots.ts`, `src/primitives/flags.ts`
Verification: `e2e/merge-view.spec.ts`, `e2e/text-diff.spec.ts`, `e2e/redline-compare.spec.ts`, `e2e/annotation-layer.spec.ts`

## UIC-PORTAL-2 - Layers

### UIC-PORTAL-2.1 - Layer order

The library shall define seven overlay layers, lowest to highest: `backdrop`, `drawer`, `modal`, `dropdown`, `context-menu`, `tooltip` and `toast`, exported in that order as `overlayLayers`; `isLayerAbove(layer, other)` reports whether one layer stacks above another. `Portal` shall publish its `layer` in `data-layer`; the default is `dropdown`.

Implementation: `src/components/portal/layers.ts`, `src/components/portal/portal.tsx`
Verification: `src/components/portal/portal.test.tsx`, `e2e/portal.spec.ts`

### UIC-PORTAL-2.2 - Stacking

The portal wrapper shall be positioned absolutely at the top left of its containing block and carry the z-index of its layer as a functional inline style, so content on a later layer stacks above content on an earlier one whatever order they mount in, and portals on one layer stack in mount order. The default z-indexes are 100, 110, 120, 130, 140, 150 and 160 in layer order. `layerZIndex` on `PortalContainerProvider` or `PortalHost` replaces the z-index of the layers it lists, merged over the outer provider's, and `useLayerZIndex(layer)` returns the value in effect, for components that position their own layer (for example to pass to a React Aria `Popover`, whose own inline z-index is 100000).

Implementation: `src/components/portal/portal.tsx`, `src/components/portal/layers.ts`
Verification: `src/components/portal/portal.test.tsx`, `e2e/portal.spec.ts`

## UIC-PORTAL-3 - Accessibility and React Aria

### UIC-PORTAL-3.1 - No semantics of its own

The portal wrapper and the portal host shall add no role, accessible name, tab stop or focus management, unless `preserveTabOrder` asks for focus guards ([UIC-PORTAL-3.4](#uic-portal-34---preserved-tab-order)). The overlay inside owns them; because the container follows the page in document order, an overlay that belongs to a trigger references it by id (`aria-controls`, `aria-describedby`) and manages its own focus.

Implementation: `src/components/portal/portal.tsx`
Verification: `src/components/portal/portal.test.tsx`, `e2e/portal.spec.ts`

### UIC-PORTAL-3.2 - React Aria overlays

A portal on a layer above `modal` (`dropdown`, `context-menu`, `tooltip`, `toast`) shall be marked as a top layer for React Aria (`data-react-aria-top-layer`), so that while a React Aria modal is open its content is not hidden from assistive technology or made inert, focus can move into it from the modal, and using it does not dismiss React Aria overlays. `topLayer` turns the mark on or off for any layer. A portal opened while a modal is open stays reachable as long as its container is not inside content the modal has hidden; the document body never is.

Implementation: `src/components/portal/portal.tsx`
Verification: `src/components/portal/portal.test.tsx`, `e2e/portal.spec.ts`

### UIC-PORTAL-3.3 - Hooks and caller attributes

`Portal` and `PortalHost` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to their element.

Implementation: `src/components/portal/portal.tsx`
Verification: `src/components/portal/portal.test.tsx`

### UIC-PORTAL-3.4 - Preserved tab order

With `preserveTabOrder`, Tab shall move into the portal's content and out of it as if the content sat where the portal is declared: from the element before that place to the content's first tab stop, from its last tab stop to the element after that place, and back the same way with Shift+Tab. CSS-hidden controls and controls inside hidden ancestors, including assigned slots, shadow wrappers and shadow hosts, shall be skipped in both directions across all supported browsers, including when `checkVisibility` is absent or supports only its legacy visibility option. A descendant restoring `visibility:visible` stays reachable; transparent controls and controls inside `display:contents` wrappers stay eligible. Content without a visible tab stop is passed over without stopping on a guard, and the content is skipped when the document's own order reaches it at the container. Tab stops follow the browser's own: a radio group is one stop, its checked button, or with none checked its first button (as Chromium enters it either way); positive `tabIndex` values are not given their earlier place. At the ends of the page's tab order, focus leaves the document as it would without the portal, and coming back starts again at the page's first (or, with Shift+Tab, last) stop: before Tab moves, the guards and content that would only lead out of the page are taken out of the tab order until focus lands again. This holds for several portals, portals nested in another's content, `PortalHost` containers and containers placed before or after where the portals are declared. The portal renders this with two empty focus guards where it is declared and one at each end of its wrapper; each moves focus on as soon as it receives it, so the guards are never a stop of their own. A portal in place keeps the document's order without guards.

Implementation: `src/components/portal/portal.tsx`, `src/components/portal/tab-order.tsx`, `src/utils/tabbable.ts`
Verification: `src/components/portal/portal.test.tsx`, `src/utils/tabbable.test.ts`, `e2e/portal.spec.ts`

## Hooks

| Hook             | Kind      | Values                                                                        | Description                                                           |
| ---------------- | --------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `ui-portal`      | root      |                                                                               | The wrapper a portal renders in its container.                        |
| `ui-portal-host` | root      |                                                                               | The container element a `PortalHost` renders after its children.      |
| `data-layer`     | attribute | `backdrop`, `drawer`, `modal`, `dropdown`, `context-menu`, `tooltip`, `toast` | The portal's overlay layer; its z-index is set inline from the layer. |
