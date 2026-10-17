# Portal

`Portal` renders its children outside the surrounding layout, in an overlay container, while keeping them in the React tree. The container is the document body unless `PortalContainerProvider` or `PortalHost` chooses another. Every portal sits on one of a fixed, ordered set of overlay layers, so a later layer always stacks above an earlier one. A portal draws nothing of its own: the overlay inside it draws its surface, places itself and owns its semantics.

React Aria overlays (`Popover`, `Modal`, `Tooltip`, `UNSTABLE_Toast*`) portal themselves into the document body, or into the container set with React Aria's own portal provider, and are positioned and dismissed by React Aria. They do not go inside a `Portal`. `Portal` is for overlays the library or a host builds without a React Aria overlay, and it cooperates with open React Aria overlays as described in [UIC-PORTAL-3.2](#uic-portal-32---react-aria-overlays).

## UIC-PORTAL-1 - Container

### UIC-PORTAL-1.1 - Rendering into the container

`Portal` shall render its children inside a wrapper element carrying `ui-portal`, appended as a child of the overlay container, which is the document body when no provider chooses one. The children stay in the React tree of the component that renders the portal: they read its context, and their React events bubble to its React ancestors, not to the ancestors of the container.

Implementation: `src/components/portal/portal.tsx`
Verification: `src/components/portal/portal.test.tsx`, `e2e/portal.spec.ts`

### UIC-PORTAL-1.2 - Choosing the container

`PortalContainerProvider` shall make its `container` element the container of every portal below it; the nearest provider wins, and a provider without `container` keeps the outer one. A `container` of `null` means the container is not available yet: portals below render nothing until it is, and never fall back to the document body.

Implementation: `src/components/portal/portal.tsx`
Verification: `src/components/portal/portal.test.tsx`

### UIC-PORTAL-1.3 - Portal host

`PortalHost` shall render its children followed by one container element carrying `ui-portal-host`, and make that element the container of every portal below it, so overlays stay in the host's part of the page (a themed preview, an embedded frame) and inherit what the stylesheet sets there. Removing the `PortalHost` removes its container and every portal in it. A `PortalHost` nested inside another is the container for the portals below it.

Implementation: `src/components/portal/portal.tsx`, `labs/reference/portal.css`
Verification: `src/components/portal/portal.test.tsx`, `e2e/portal.spec.ts`

### UIC-PORTAL-1.4 - Server rendering and hydration

`Portal` shall render nothing on the server and during hydration, and mount its content in the container right after hydration, so server and client markup match.

Implementation: `src/components/portal/portal.tsx`
Verification: `src/components/portal/portal.test.tsx`

## UIC-PORTAL-2 - Layers

### UIC-PORTAL-2.1 - Layer order

The library shall define seven overlay layers, lowest to highest: `backdrop`, `drawer`, `modal`, `dropdown`, `context-menu`, `tooltip` and `toast`, exported in that order as `overlayLayers`. `Portal` shall publish its `layer` in `data-layer`; the default is `dropdown`.

Implementation: `src/components/portal/layers.ts`, `src/components/portal/portal.tsx`
Verification: `src/components/portal/portal.test.tsx`, `e2e/portal.spec.ts`

### UIC-PORTAL-2.2 - Stacking

The portal wrapper shall be positioned absolutely at the top left of its containing block and carry the z-index of its layer as a functional inline style, so content on a later layer stacks above content on an earlier one whatever order they mount in, and portals on one layer stack in mount order. The default z-indexes are 100, 110, 120, 130, 140, 150 and 160 in layer order. `layerZIndex` on `PortalContainerProvider` or `PortalHost` replaces the z-index of the layers it lists, merged over the outer provider's, and `useLayerZIndex(layer)` returns the value in effect, for components that position their own layer (for example to pass to a React Aria `Popover`, whose own inline z-index is 100000).

Implementation: `src/components/portal/portal.tsx`, `src/components/portal/layers.ts`
Verification: `src/components/portal/portal.test.tsx`, `e2e/portal.spec.ts`

## UIC-PORTAL-3 - Accessibility and React Aria

### UIC-PORTAL-3.1 - No semantics of its own

The portal wrapper and the portal host shall add no role, accessible name, tab stop or focus management. The overlay inside owns them; because the container follows the page in document order, an overlay that belongs to a trigger references it by id (`aria-controls`, `aria-describedby`) and manages its own focus.

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

## Hooks

| Hook             | Kind      | Values                                                                        | Description                                                           |
| ---------------- | --------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `ui-portal`      | root      |                                                                               | The wrapper a portal renders in its container.                        |
| `ui-portal-host` | root      |                                                                               | The container element a `PortalHost` renders after its children.      |
| `data-layer`     | attribute | `backdrop`, `drawer`, `modal`, `dropdown`, `context-menu`, `tooltip`, `toast` | The portal's overlay layer; its z-index is set inline from the layer. |
