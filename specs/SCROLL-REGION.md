# Scroll Region

`ScrollRegion` is an area that scrolls on its own. Its root frames a native scroll viewport, so content overflow, wheel, touch and keyboard scrolling stay with the browser. Optional overlay scrollbars replace the native ones with thumbs that take no layout space, and optional markers paint a decorative overview of the content beside the native vertical scrollbar. A component that already scrolls on its own is not wrapped in a second region.

## UIC-SCROLL-REGION-1 - Structure

### UIC-SCROLL-REGION-1.1 - Frame and viewport

`ScrollRegion` shall render a root frame holding a `ui-scroll-region__viewport` that scrolls and holds the children. The caller's native props, `id`, `ref`, `tabIndex` and `onScroll` go to the viewport; `className`, `hidden` and caller `data-*` attributes go to the root. The viewport element stays the same across option changes.

Implementation: `src/components/scroll-region/scroll-region.tsx`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-REGION-1.2 - Options

`ScrollRegion` shall publish `data-axis` (`x`, `y` by default, `both`, `none`), `data-overscroll` (`contain` by default, `auto`) and `data-scrollbar` (`native` by default, `overlay`). It grows by default (`data-grow`), clips only for `axis="none"` unless `clip` says otherwise, and with `fill` covers its nearest positioned ancestor (`data-fill`). With `columns` it lays the children out in a grid and publishes `data-columns`, `data-min-column-width` (for `fit`), `data-space` and `data-align` as `Grid` does ([LAYOUT.md](LAYOUT.md)).

Implementation: `src/components/scroll-region/scroll-region.tsx`, `labs/reference.css`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

## UIC-SCROLL-REGION-2 - Overlay scrollbars

### UIC-SCROLL-REGION-2.1 - Overlay mode

With `scrollbar="overlay"` the stylesheet shall hide the native scrollbars, the viewport shall be focusable (`tabIndex` 0 unless the caller sets one), and each axis that overflows shall get a `ui-scroll-region__track` (`data-orientation` `vertical` or `horizontal`) holding one `ui-scroll-region__thumb`. The root publishes `data-overflow-y` and `data-overflow-x` for the overflowing axes. Tracks let pointer input through to the content; thumbs take it.

Implementation: `src/components/scroll-region/scroll-region.tsx`, `src/components/scroll-region/overlay-scrollbars.tsx`, `labs/reference.css`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-REGION-2.2 - Thumb geometry

The library shall measure each track, which the stylesheet places, and size its thumb to the visible share of the content, at least 24 pixels and at most the track; the thumb's inline offset is the scroll position's share of the track's free length. In a right-to-left viewport the horizontal offset is measured from the left edge, so the thumb starts at the right.

Implementation: `src/components/scroll-region/overlay-scrollbars.tsx`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-REGION-2.3 - Thumb semantics and keyboard

Each thumb shall be a focusable `role="scrollbar"` named by the provider's `scrollVertically` or `scrollHorizontally` string, controlling the viewport (`aria-controls`), with `aria-orientation` and its value from 0 to the scroll range. Arrow keys along its axis scroll 40 pixels, Page Up and Page Down one visible length, Home and End to the ends.

Implementation: `src/components/scroll-region/overlay-scrollbars.tsx`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-REGION-2.4 - Thumb pointer and wheel

Dragging a thumb shall keep the pointer through pointer capture and scroll the viewport in proportion to the travel; the wheel over a thumb scrolls the viewport.

Implementation: `src/components/scroll-region/overlay-scrollbars.tsx`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-REGION-2.5 - Header inset

With `scrollbarInset="header"`, sticky headers inside the viewport that attach `useScrollRegionHeaderRef()` shall be measured, and the root publishes the tallest in `--ui-scroll-region-header-size` so the stylesheet starts the vertical track below it; Page Up and Page Down then move by the visible length below the header. Without the inset the hook returns `undefined`.

Implementation: `src/components/scroll-region/scroll-region.tsx`, `src/components/scroll-region/overlay-scrollbars.tsx`
Verification: `src/components/scroll-region/scroll-region.test.tsx`

### UIC-SCROLL-REGION-2.6 - Content lift

When content shorter than the viewport overflows only horizontally, the root shall publish the empty height below the content in `--ui-scroll-region-content-lift`, so the stylesheet can raise the horizontal track to sit under the content; otherwise it is 0.

Implementation: `src/components/scroll-region/overlay-scrollbars.tsx`, `labs/reference.css`
Verification: `src/components/scroll-region/scroll-region.test.tsx`

### UIC-SCROLL-REGION-2.7 - Updates and cleanup

Overlay geometry shall refresh when the viewport, its children, the headers or the tracks resize, when content mutates and when the viewport scrolls, also without `ResizeObserver`, coalesced to one read per animation frame. Regions update independently. A focused thumb that disappears because its axis stopped overflowing returns focus to the viewport. Unmounting releases every observer and pending frame.

Implementation: `src/components/scroll-region/overlay-scrollbars.tsx`
Verification: `src/components/scroll-region/scroll-region.test.tsx`

## UIC-SCROLL-REGION-3 - Overview

### UIC-SCROLL-REGION-3.1 - Overview paint

With `overview` markers (or `overviewLayers`) in native mode, a region whose content overflows its height shall publish `data-overview`, set `--ui-scroll-region-overview-image` on the root and render a decorative `ui-scroll-region__overview` (hidden from assistive technology, no pointer input) as tall as the viewport's visible height, for the stylesheet to place beside the scrollbar or to paint the scrollbar track with. Scrolling and the native scrollbar are untouched. Content that fits paints nothing. Removing the markers or unmounting releases the observers and the pending frame.

Implementation: `src/components/scroll-region/scroll-region.tsx`, `src/components/scroll-region/use-scroll-overview.ts`, `labs/reference.css`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-REGION-3.2 - Marker mapping

A marker (content-relative `top`, `height`, caller `color`, `priority`) shall map onto the visible height in proportion to the content height, cover at least two pixels, and win a shared pixel when its priority is lowest, whatever the marker order. Adjacent pixels of one colour form one segment, and the image paints segments in the caller's colours over a transparent ground; opacity is the stylesheet's.

Implementation: `src/utils/scroll-overview.ts`
Verification: `src/utils/scroll-overview.test.ts`

### UIC-SCROLL-REGION-3.3 - Marker layers

`overviewLayers` shall resolve priorities within each named layer, then mix the colours of layers sharing a pixel with equal weight, in layer-name order, so the result does not depend on the order the caller lists them. One layer paints exactly as the same markers passed to `overview`.

Implementation: `src/utils/scroll-overview.ts`, `src/components/scroll-region/use-scroll-overview.ts`
Verification: `src/utils/scroll-overview.test.ts`

## Hooks

| Hook                                | Kind      | Values                                                                        | Description                                                |
| ----------------------------------- | --------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `ui-scroll-region`                  | root      |                                                                               | The frame.                                                 |
| `ui-scroll-region__viewport`        | slot      |                                                                               | The scrolling element.                                     |
| `ui-scroll-region__overview`        | slot      |                                                                               | Decorative overview layer.                                 |
| `ui-scroll-region__track`           | slot      |                                                                               | Overlay track of one axis, placed by the stylesheet.       |
| `ui-scroll-region__thumb`           | slot      |                                                                               | Overlay thumb.                                             |
| `data-axis`                         | attribute | `x`, `y`, `both`, `none`                                                      | Scrolling axes.                                            |
| `data-overscroll`                   | attribute | `contain`, `auto`                                                             | Scroll chaining.                                           |
| `data-scrollbar`                    | attribute | `native`, `overlay`                                                           | Scrollbar mode.                                            |
| `data-columns`                      | attribute | `1`, `2`, `3`, `4`, `6`, `12`, `fit`, `none`                                  | Grid columns of the children.                              |
| `data-min-column-width`             | attribute | `sm`, `md`, `lg`, `xl`                                                        | Smallest column of `columns="fit"`.                        |
| `data-space`                        | attribute | `none`, `3xs`, `2xs`, `xs`, `compact`, `sm`, `sm-plus`, `relaxed`, `md`, `lg` | Grid gap.                                                  |
| `data-align`                        | attribute | `start`, `center`, `end`, `stretch`, `baseline`                               | Grid cell alignment.                                       |
| `data-orientation`                  | attribute | `vertical`, `horizontal`                                                      | Track and thumb axis.                                      |
| `data-grow`                         | state     | `true`, `auto`, `none`                                                        | Growth inside a flex parent.                               |
| `data-fill`                         | state     | `true`                                                                        | Covers the nearest positioned ancestor.                    |
| `data-clip`                         | state     | `true`                                                                        | Clips the content.                                         |
| `data-overflow-x`                   | state     | `true`                                                                        | Overlay mode: the content overflows horizontally.          |
| `data-overflow-y`                   | state     | `true`                                                                        | Overlay mode: the content overflows vertically.            |
| `data-overview`                     | state     | `true`                                                                        | The overview paints.                                       |
| `--ui-scroll-region-overview-image` | property  |                                                                               | The overview image (`linear-gradient`).                    |
| `--ui-scroll-region-header-size`    | property  |                                                                               | Overlay mode: height of the registered headers, in pixels. |
| `--ui-scroll-region-content-lift`   | property  |                                                                               | Overlay mode: empty height below short content, in pixels. |
