# Scroll Region

`ScrollRegion` is an area that scrolls on its own. Its root frames a native scroll viewport, so content overflow, wheel, touch and keyboard scrolling stay with the browser. Optional overlay scrollbars replace the native ones with thumbs that take no layout space and show by a visibility mode, optional markers paint a decorative overview of the content beside the native vertical scrollbar, and the root publishes how far the content reaches past each edge and whether the region is scrolling or hovered. A component that already scrolls on its own is not wrapped in a second region.

Pointer ownership and drag lifecycle cleanup follow the shared [drag interaction contract](DRAG-INTERACTIONS.md).

## UIC-SCROLL-REGION-1 - Structure

### UIC-SCROLL-REGION-1.1 - Frame and viewport

`ScrollRegion` shall render a root frame holding a `ui-scroll-region__viewport` that scrolls and holds the children. The caller's native props, `id`, `ref`, `tabIndex` and `onScroll` go to the viewport; `className`, `hidden` and caller `data-*` attributes go to the root. The viewport element stays the same across option changes.

Implementation: `src/components/scroll-region/scroll-region.tsx`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-REGION-1.2 - Options

`ScrollRegion` shall publish `data-axis` (`x`, `y` by default, `both`, `none`), `data-overscroll` (`contain` by default, `auto`), `data-scrollbar` (`native` by default, `overlay`) and `data-scrollbar-visibility` ([UIC-SCROLL-REGION-2.8](#uic-scroll-region-28---scrollbar-visibility)). It grows by default (`data-grow`), clips only for `axis="none"` unless `clip` says otherwise, and with `fill` covers its nearest positioned ancestor (`data-fill`). With `columns` it lays the children out in a grid and publishes `data-columns`, `data-min-column-width` (for `fit`), `data-space` and `data-align` as `Grid` does ([LAYOUT.md](LAYOUT.md)).

Implementation: `src/components/scroll-region/scroll-region.tsx`, `labs/reference/scroll-region.css`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

## UIC-SCROLL-REGION-2 - Overlay scrollbars

### UIC-SCROLL-REGION-2.1 - Overlay mode

With `scrollbar="overlay"` the stylesheet shall hide the native scrollbars, the viewport shall be focusable (`tabIndex` 0 unless the caller sets one), and each axis that overflows shall get a `ui-scroll-region__track` (`data-orientation` `vertical` or `horizontal`) holding one `ui-scroll-region__thumb`. The root publishes `data-overflow-y` and `data-overflow-x` for the overflowing axes. Tracks and thumbs take pointer input ([UIC-SCROLL-REGION-2.9](#uic-scroll-region-29---track-presses)).

Implementation: `src/components/scroll-region/scroll-region.tsx`, `src/components/scroll-region/overlay-scrollbars.tsx`, `labs/reference/scroll-region.css`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-REGION-2.2 - Thumb geometry

The library shall measure each track, which the stylesheet places, and size its thumb to the visible share of the content, at least 24 pixels and at most the track; the thumb's inline offset is the scroll position's share of the track's free length. In a right-to-left viewport the horizontal offset is measured from the left edge, so the thumb starts at the right.

Implementation: `src/components/scroll-region/overlay-scrollbars.tsx`, `src/components/scroll-region/use-overlay-metrics.ts`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-REGION-2.3 - Thumb semantics and keyboard

Each thumb shall be a focusable `role="scrollbar"` named by the provider's `scrollVertically` or `scrollHorizontally` string, controlling the viewport (`aria-controls`), with `aria-orientation` and its value from 0 to the scroll range. Arrow keys along its axis scroll 40 pixels, Page Up and Page Down one visible length, Home and End to the ends.

Implementation: `src/components/scroll-region/overlay-scrollbars.tsx`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-REGION-2.4 - Thumb pointer and wheel

Dragging a thumb shall keep the pointer through pointer capture and scroll the viewport in proportion to the travel; the wheel over a thumb scrolls the viewport, and not the page while the viewport can still scroll that way. At the viewport's edge the wheel scrolls the page, as a native scrollbar's does. A zoom gesture, the wheel with Ctrl or Meta held (as a trackpad pinch reports), is left to the browser and the page: it neither scrolls the viewport nor is cancelled or stopped.

Implementation: `src/components/scroll-region/overlay-scrollbars.tsx`, `src/components/scroll-region/use-thumb-wheel.ts`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-REGION-2.5 - Header inset

With `scrollbarInset="header"`, sticky headers inside the viewport that attach `useScrollRegionHeaderRef()` shall be measured, and the root publishes the tallest in `--ui-scroll-region-header-size` so the stylesheet starts the vertical track below it; Page Up and Page Down then move by the visible length below the header. Without the inset the hook returns `undefined`.

Implementation: `src/components/scroll-region/scroll-region.tsx`, `src/components/scroll-region/use-overlay-metrics.ts`, `src/components/scroll-region/overlay-scrollbars.tsx`
Verification: `src/components/scroll-region/scroll-region.test.tsx`

### UIC-SCROLL-REGION-2.6 - Content lift

When content shorter than the viewport overflows only horizontally, the root shall publish the empty height below the content in `--ui-scroll-region-content-lift`, so the stylesheet can raise the horizontal track to sit under the content; otherwise it is 0.

Implementation: `src/components/scroll-region/use-overlay-metrics.ts`, `labs/reference/scroll-region.css`
Verification: `src/components/scroll-region/scroll-region.test.tsx`

### UIC-SCROLL-REGION-2.7 - Updates and cleanup

Overlay geometry shall refresh when the viewport, its children, the headers or the tracks resize and when a child of the viewport comes or goes, at once, and when content anywhere inside the viewport mutates (nodes, text or attributes such as a class or style, so a nested change that resizes no child counts), when an image inside it loads and when the viewport scrolls, also without `ResizeObserver`, coalesced to one read per animation frame. A region observes its viewport once: the overlay geometry, the edge distances and the overview share one resize observer, one mutation observer and one frame of reads. Unchanged targets retain their size observations through content mutations; added targets are observed once and removed targets are released. Regions update independently. A focused thumb that disappears because its axis stopped overflowing returns focus to the viewport and no longer counts as focused, so its tracks hide again by the visibility mode. Unmounting releases every observer and pending frame; later reports do nothing.

Implementation: `src/components/scroll-region/use-overlay-metrics.ts`, `src/components/scroll-region/observe-viewport.ts`, `src/components/scroll-region/use-shared-viewport-observer.ts`, `src/components/scroll-region/overlay-scrollbars.tsx`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `src/components/scroll-region/observe-viewport.test.ts`

### UIC-SCROLL-REGION-2.8 - Scrollbar visibility

`scrollbarVisibility` shall choose when overlay tracks show: `auto` (the default) while their axis overflows; `always` on every axis that scrolls, even when the content fits, where the thumb spans its track and leaves the tab order; `scroll` from a scroll until `scrollbarHideDelay` milliseconds (600 by default) pass without one; `hover` while a mouse or pen pointer is over the region, for the delay after it leaves, and while scrolling as in `scroll`. A focused thumb keeps its tracks shown. A track that shows or hides follows [Enter and Exit](ENTER-EXIT.md): it publishes `data-entering` while it appears and `data-exiting` while it leaves, and stays mounted until its exit animations end.

An unmeasured track shall use a zero-length thumb rather than compute a non-finite inline size.

Implementation: `src/components/scroll-region/scroll-region.tsx`, `src/components/scroll-region/use-scroll-activity.ts`, `src/components/scroll-region/overlay-scrollbars.tsx`, `labs/reference/scroll-region.css`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-REGION-2.9 - Track presses

A primary press on an overlay track beside its thumb shall scroll the viewport one visible length toward the pointer, within the scroll range, as a native scrollbar track does. Presses on the thumb start a drag instead ([UIC-SCROLL-REGION-2.4](#uic-scroll-region-24---thumb-pointer-and-wheel)).

Implementation: `src/components/scroll-region/overlay-scrollbars.tsx`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

## UIC-SCROLL-REGION-3 - Overview

### UIC-SCROLL-REGION-3.1 - Overview paint

With `overview` markers (or `overviewLayers`) in native mode, a region whose content overflows its height shall publish `data-overview`, set `--ui-scroll-region-overview-image` on the root and render a decorative `ui-scroll-region__overview` (hidden from assistive technology, no pointer input) as tall as the viewport's visible height, for the stylesheet to place beside the scrollbar or to paint the scrollbar track with. Scrolling and the native scrollbar are untouched. Content that fits paints nothing. Removing the markers or unmounting releases the observers and the pending frame.

Implementation: `src/components/scroll-region/scroll-region.tsx`, `src/components/scroll-region/use-scroll-overview.ts`, `src/components/scroll-region/observe-viewport.ts`, `labs/reference/scroll-region.css`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-REGION-3.2 - Marker mapping

A marker (content-relative `top`, `height`, caller `color`, `priority`) shall map onto the visible height in proportion to the content height, cover at least two pixels, and win a shared pixel when its priority is lowest, whatever the marker order. Adjacent pixels of one colour form one segment, and the image paints segments in the caller's colours over a transparent ground; opacity is the stylesheet's.

Implementation: `src/utils/scroll-overview.ts`
Verification: `src/utils/scroll-overview.test.ts`

### UIC-SCROLL-REGION-3.3 - Marker layers

`overviewLayers` shall resolve priorities within each named layer, then mix the colours of layers sharing a pixel with equal weight, in layer-name order, so the result does not depend on the order the caller lists them. One layer paints exactly as the same markers passed to `overview`.

Implementation: `src/utils/scroll-overview.ts`, `src/components/scroll-region/use-scroll-overview.ts`
Verification: `src/utils/scroll-overview.test.ts`

## UIC-SCROLL-REGION-4 - Scroll state

### UIC-SCROLL-REGION-4.1 - Edge distances

A region that scrolls on some axis shall publish, in either scrollbar mode, how far the content reaches past each edge of the viewport in whole pixels: `--ui-scroll-region-overflow-y-start` (scrolled past the top), `--ui-scroll-region-overflow-y-end` (left below the bottom), `--ui-scroll-region-overflow-x-start` and `--ui-scroll-region-overflow-x-end` (past the inline start and end, so the right edge is the start right to left), with `data-overflow-y-start`, `data-overflow-y-end`, `data-overflow-x-start` and `data-overflow-x-end` while each is above zero, for the stylesheet to fade or shadow the edges; the reference stylesheet shades each such edge as deep as its distance, up to 8 pixels, mirrored right to left. They update when the viewport scrolls, resizes or its children change, without waiting for an animation frame, and once per animation frame when content deeper inside changes as overlay geometry does ([UIC-SCROLL-REGION-2.7](#uic-scroll-region-27---updates-and-cleanup)). A change that mutates nothing inside the viewport, such as a stylesheet swap, is read on the next resize or scroll. A region with `axis="none"` publishes none.

Implementation: `src/components/scroll-region/scroll-region.tsx`, `src/components/scroll-region/use-scroll-edges.ts`, `labs/reference/scroll-region.css`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-REGION-4.2 - Scrolling and hovering

The root shall publish `data-scrolling` from a scroll until `scrollbarHideDelay` milliseconds pass without one, and `data-hovering` while a mouse or pen pointer is over the region, in either scrollbar mode, so the stylesheet can fade thumbs or edges in while the reader scrolls.

Implementation: `src/components/scroll-region/scroll-region.tsx`, `src/components/scroll-region/use-scroll-activity.ts`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-REGION-4.3 - Edge callbacks

`onTopReached` shall be called when a scroll brings the viewport to the top from below it, and `onBottomReached` when a scroll brings it to the bottom from above it, for loading more content. Mounting, resizing and the region's own scrolling to the bottom call neither. The viewport's `onScroll` still reports every scroll with its position.

Implementation: `src/components/scroll-region/use-scroll-edges.ts`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-REGION-4.4 - Stick to bottom

With `stickToBottom`, the viewport shall start scrolled to the bottom and stay there when its content or size changes while the reader is at the bottom (within a pixel), as a log or a conversation does, including content that changes deeper than the viewport's children. A scroll the browser makes as the content's extent changes, such as scroll anchoring, does not release it; only the reader's own scrolling does. Scrolling up releases it, and scrolling back to the bottom pins it again.

Implementation: `src/components/scroll-region/use-scroll-edges.ts`
Verification: `src/components/scroll-region/scroll-region.test.tsx`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-REGION-4.5 - Scroll spy

`useScrollSpy(viewportRef, { ids, offset })` shall return the id of the current section of a scrolling viewport, such as a region's (its `ref`): the last of `ids` whose top has reached `offset` pixels (0 by default) below the viewport's top, the first before any has, and the last once the viewport is scrolled to its end. Ids without an element are skipped. It updates as the viewport scrolls or resizes, reading the sections' positions at most once per animation frame however many scroll events arrive, and when the ids or the offset change, for a table of contents to mark its current entry; `resolveScrollSpy(viewport, options)` exposes the rule.

Implementation: `src/components/scroll-region/use-scroll-spy.ts`
Verification: `src/components/scroll-region/use-scroll-spy.test.tsx`, `e2e/scroll-region.spec.ts`

## Hooks

| Hook                                  | Kind      | Values                                                           | Description                                                |
| ------------------------------------- | --------- | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| `ui-scroll-region`                    | root      |                                                                  | The frame.                                                 |
| `ui-scroll-region__viewport`          | slot      |                                                                  | The scrolling element.                                     |
| `ui-scroll-region__overview`          | slot      |                                                                  | Decorative overview layer.                                 |
| `ui-scroll-region__track`             | slot      |                                                                  | Overlay track of one axis, placed by the stylesheet.       |
| `ui-scroll-region__thumb`             | slot      |                                                                  | Overlay thumb.                                             |
| `data-axis`                           | attribute | `x`, `y`, `both`, `none`                                         | Scrolling axes.                                            |
| `data-overscroll`                     | attribute | `contain`, `auto`                                                | Scroll chaining.                                           |
| `data-scrollbar`                      | attribute | `native`, `overlay`                                              | Scrollbar mode.                                            |
| `data-scrollbar-visibility`           | attribute | `auto`, `always`, `scroll`, `hover`                              | When overlay tracks show.                                  |
| `data-columns`                        | attribute | `1`, `2`, `3`, `4`, `6`, `12`, `fit`, `none`                     | Grid columns of the children.                              |
| `data-min-column-width`               | attribute | `sm`, `md`, `lg`, `xl`                                           | Smallest column of `columns="fit"`.                        |
| `data-space`                          | attribute | `none`, `3xs`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl` | Grid gap.                                                  |
| `data-align`                          | attribute | `start`, `center`, `end`, `stretch`, `baseline`                  | Grid cell alignment.                                       |
| `data-orientation`                    | attribute | `vertical`, `horizontal`                                         | Track and thumb axis.                                      |
| `data-grow`                           | state     | `true`, `auto`, `none`                                           | Growth inside a flex parent.                               |
| `data-fill`                           | state     | `true`                                                           | Covers the nearest positioned ancestor.                    |
| `data-clip`                           | state     | `true`                                                           | Clips the content.                                         |
| `data-overflow-x`                     | state     | `true`                                                           | Overlay mode: the content overflows horizontally.          |
| `data-overflow-y`                     | state     | `true`                                                           | Overlay mode: the content overflows vertically.            |
| `data-overview`                       | state     | `true`                                                           | The overview paints.                                       |
| `data-overflow-y-start`               | state     | `true`                                                           | The content reaches above the viewport.                    |
| `data-overflow-y-end`                 | state     | `true`                                                           | The content reaches below the viewport.                    |
| `data-overflow-x-start`               | state     | `true`                                                           | The content reaches past the inline start.                 |
| `data-overflow-x-end`                 | state     | `true`                                                           | The content reaches past the inline end.                   |
| `data-scrolling`                      | state     | `true`                                                           | The viewport is scrolling, until the hide delay passes.    |
| `data-hovering`                       | state     | `true`                                                           | A mouse or pen pointer is over the region.                 |
| `data-entering`                       | state     | `true`                                                           | An overlay track is appearing.                             |
| `data-exiting`                        | state     | `true`                                                           | An overlay track is leaving.                               |
| `--ui-scroll-region-overview-image`   | property  |                                                                  | The overview image (`linear-gradient`).                    |
| `--ui-scroll-region-header-size`      | property  |                                                                  | Overlay mode: height of the registered headers, in pixels. |
| `--ui-scroll-region-content-lift`     | property  |                                                                  | Overlay mode: empty height below short content, in pixels. |
| `--ui-scroll-region-overflow-y-start` | property  |                                                                  | Distance scrolled past the top, in pixels.                 |
| `--ui-scroll-region-overflow-y-end`   | property  |                                                                  | Distance left below the bottom, in pixels.                 |
| `--ui-scroll-region-overflow-x-start` | property  |                                                                  | Distance scrolled past the inline start, in pixels.        |
| `--ui-scroll-region-overflow-x-end`   | property  |                                                                  | Distance left beyond the inline end, in pixels.            |
