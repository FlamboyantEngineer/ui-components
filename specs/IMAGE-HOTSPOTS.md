# Image Hotspots

`ImageHotspots` shows an image the reader zooms and scrolls, with rectangular hotspot buttons over parts of it. Each hotspot is placed in percent of the image's intrinsic width and height, so it stays on its part of the image at every zoom and viewport size. The caller owns every state: pressing a hotspot passes its key to `onAction`, and the caller answers with new pressed, disabled and advisory states, which several hotspots may share.

## UIC-IMAGE-HOTSPOTS-1 - Contract

### UIC-IMAGE-HOTSPOTS-1.1 - Parts

`ImageHotspots` shall render a root `<div>` (`ui-image-hotspots`) holding, in order, a [Zoom Control](ZOOM-CONTROL.md) (`ui-image-hotspots__zoom`) and the viewport (`ui-image-hotspots__viewport`): a `role="group"` element named by the caller's `aria-label` or `aria-labelledby`, in the Tab order. The host stylesheet bounds the viewport and lets it scroll; the reference stylesheet gives it a fixed height and `overflow: auto`, and centres the canvas while it fits. The viewport holds the canvas (`ui-image-hotspots__canvas`), which holds the `<img>` (`ui-image-hotspots__image`, named by `alt`; an empty `alt` marks it decorative) and then the hotspots.

Implementation: `src/components/image-hotspots/image-hotspots.tsx`
Verification: `src/components/image-hotspots/image-hotspots.test.tsx`, `e2e/image-hotspots.spec.ts`

### UIC-IMAGE-HOTSPOTS-1.2 - Fit and zoom

The caller shall give the image's intrinsic `width` and `height` in pixels. At 100% the canvas is the largest box of the image's proportions that fits inside the viewport's client box, and the zoom scales it; the image fills the canvas. Before the viewport is measured the canvas takes the intrinsic size. The zoom is `zoom` (controlled, in percent of that fit) or `defaultZoom` (uncontrolled, `100` by default), and every request reaches `onZoomChange`. The zoom control steps through `defaultZoomLevels`; inside the viewport, `+` or `=` asks for the next level up and `-` for the next level down, without a modifier key. `showZoomReset` adds the zoom control's reset button, which asks for 100%. When the canvas grows or shrinks, the point at the viewport's centre stays in place.

Implementation: `src/components/image-hotspots/image-hotspots.tsx`, `src/components/image-hotspots/hotspot-layout.ts`, `src/components/image-hotspots/use-centred-zoom.ts`
Verification: `src/components/image-hotspots/image-hotspots.test.tsx`, `src/components/image-hotspots/hotspot-layout.test.ts`, `e2e/image-hotspots.spec.ts`

### UIC-IMAGE-HOTSPOTS-1.3 - Placing hotspots

Each entry of `hotspots` shall draw one hotspot whose rectangle is `x`, `y`, `width` and `height` in percent of the image's intrinsic width and height, measured from its top left corner whatever the text direction, and positioned in percent of the canvas, so it covers the same part of the image at every zoom and viewport size. A rectangle is kept on the image: its corner is clamped to `0`–`100` and its size to the image's far edge, and a non-finite value counts as `0`. Hotspots follow the order of `hotspots` in the Tab order, and a later one draws over an earlier one it overlaps.

Implementation: `src/components/image-hotspots/image-hotspots.tsx`, `src/components/image-hotspots/hotspot-layout.ts`
Verification: `src/components/image-hotspots/image-hotspots.test.tsx`, `src/components/image-hotspots/hotspot-layout.test.ts`, `e2e/image-hotspots.spec.ts`

### UIC-IMAGE-HOTSPOTS-1.4 - Pressing hotspots

Each hotspot shall be a bare [Button](BUTTON.md) (`ui-image-hotspots__hotspot`) named by its `label`. A press, Enter or Space calls `onAction` with the hotspot's `id` and nothing else, and changes no state of its own. A hotspot with `isPressed` is a toggle button: it states `aria-pressed` (`true` or `false`) and publishes `data-selected` while pressed. Hotspots with keys of their own may show the same caller state, each pressed together.

Implementation: `src/components/image-hotspots/image-hotspots.tsx`
Verification: `src/components/image-hotspots/image-hotspots.test.tsx`, `e2e/image-hotspots.spec.ts`

### UIC-IMAGE-HOTSPOTS-1.5 - Disabled hotspots

A hotspot with `isDisabled` shall stay in the Tab order with `aria-disabled="true"` and `data-disabled`, so its name and message can be read, and refuse every press, so `onAction` is not called.

Implementation: `src/components/image-hotspots/image-hotspots.tsx`
Verification: `src/components/image-hotspots/image-hotspots.test.tsx`, `e2e/image-hotspots.spec.ts`

### UIC-IMAGE-HOTSPOTS-1.6 - Advisory status

A hotspot's `tone` shall publish `data-tone` on it. A non-blank `message` shows as text (`ui-image-hotspots__message`, with the same `data-tone`) placed on the canvas at the rectangle's bottom left corner, and describes the hotspot through `aria-describedby`.

Implementation: `src/components/image-hotspots/image-hotspots.tsx`
Verification: `src/components/image-hotspots/image-hotspots.test.tsx`, `e2e/image-hotspots.spec.ts`

### UIC-IMAGE-HOTSPOTS-1.7 - Changing the image

The root shall publish the image's load status as `data-status`: `loading` from each new `src` until it loads, then `loaded`, or `error` when it fails. A new `src` replaces the `<img>`, so a report from the previous image never settles the new one. A failed image leaves the canvas and its hotspots in place and shows the provider's `imageLoadFailed` string, from `alt` (or `src` when `alt` is blank), as an alert (`ui-image-hotspots__error`).

Implementation: `src/components/image-hotspots/image-hotspots.tsx`
Verification: `src/components/image-hotspots/image-hotspots.test.tsx`, `e2e/image-hotspots.spec.ts`

### UIC-IMAGE-HOTSPOTS-1.8 - Hooks and caller attributes

The surface shall carry the hooks below, append the caller's `className`, forward caller `data-*` attributes, `id` and `ref` to its root, and give `aria-label`, `aria-labelledby` and `aria-details` to the viewport.

Implementation: `src/components/image-hotspots/image-hotspots.tsx`, `labs/reference/image-hotspots.css`
Verification: `src/components/image-hotspots/image-hotspots.test.tsx`, `e2e/image-hotspots.spec.ts`

## Hooks

| Hook                          | Kind      | Values                                            | Description                                                |
| ----------------------------- | --------- | ------------------------------------------------- | ---------------------------------------------------------- |
| `ui-image-hotspots`           | root      |                                                   | The root `<div>`.                                          |
| `ui-image-hotspots__zoom`     | slot      |                                                   | The zoom control (also `ui-zoom-control`).                 |
| `ui-image-hotspots__viewport` | slot      |                                                   | The scrolling, focusable `role="group"` around the canvas. |
| `ui-image-hotspots__canvas`   | slot      |                                                   | The box the image fills, sized by the fit and the zoom.    |
| `ui-image-hotspots__image`    | slot      |                                                   | The `<img>`.                                               |
| `ui-image-hotspots__error`    | slot      |                                                   | The alert shown when the image failed to load.             |
| `ui-image-hotspots__hotspot`  | slot      |                                                   | One hotspot button (also `ui-button`).                     |
| `ui-image-hotspots__message`  | slot      |                                                   | A hotspot's advisory text under its rectangle.             |
| `data-status`                 | state     | `loading`, `loaded`, `error`                      | On the root: the image's load status.                      |
| `data-tone`                   | attribute | `neutral`, `info`, `success`, `warning`, `danger` | On a hotspot and its message: the advisory tone.           |
