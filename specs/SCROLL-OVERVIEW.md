# Scroll Overview

`ScrollOverview` is a custom vertical scrollbar for a scroll container whose native scrollbar the host hides (for example with `scrollbar-width: none`): a track that paints where markers sit in the container's content, scaled to its visible height, so a reader sees at a glance where matches, comments or changes are in a long document, and a thumb over the marks that follows and drives the scroll position. It works with any element that scrolls, given by `scrollRef`; [Scroll Region](SCROLL-REGION.md) paints the same overview under its own overlay thumb (UIC-SCROLL-REGION-3). Where the track goes (beside the container, over its edge, in a gutter) is the stylesheet's.

## UIC-SCROLL-OVERVIEW-1 - Markers

### UIC-SCROLL-OVERVIEW-1.1 - Paint

`ScrollOverview` shall render a `ui-scroll-overview` element, hidden from assistive technology, as tall as the container's visible height (`height` inline), and publish the overview image as `--ui-scroll-overview-image`: `markers`, or the named `layers` that replace them, mapped and mixed exactly as UIC-SCROLL-REGION-3.2 and 3.3 describe, and `none` when nothing paints, which the root publishes as `data-empty`, as it does while the content fits the container. The root takes the caller's `ref`, `className`, `id` and `data-*` attributes.

Implementation: `src/components/scroll-overview/scroll-overview.tsx`, `src/utils/scroll-overview.ts`
Verification: `src/components/scroll-overview/scroll-overview.test.tsx`, `e2e/scroll-overview.spec.ts`

### UIC-SCROLL-OVERVIEW-1.2 - Element markers

A marker may name an `element` (with its `color` and `priority`) in place of a content `top` and `height`. The overview shall measure the element's box from the top of the container's scrolled content, so the mark sits where the element is whatever the scroll position, and measure again on the next frame when the container or a marked element resizes, the content changes (nodes, text or attributes anywhere inside), an image in it loads, or fonts finish loading. An element outside the container, or no longer in the document, marks nothing. The observers and the pending frame are released when the markers change or the overview unmounts. Markers are compared by their fields, so markers or layers written inline, new objects with equal fields on each render, neither rebuild the observers nor measure again.

Implementation: `src/components/scroll-overview/scroll-overview.tsx`, `src/components/scroll-overview/scroll-overview-markers.ts`, `src/utils/observe-viewport.ts`, `src/utils/same-overview-layers.ts`
Verification: `src/components/scroll-overview/scroll-overview.test.tsx`, `e2e/scroll-overview.spec.ts`

### UIC-SCROLL-OVERVIEW-1.3 - Activating a marker

Without `onMarkerActivate` a press on the track beside the thumb shall page the container one visible height toward it (UIC-SCROLL-OVERVIEW-1.4). With it, the root publishes `data-interactive` and a press on the track finds the marker drawn at that pixel (the lowest priority among those covering it), scrolls the container so the marker's top is at its top, and calls `onMarkerActivate` with the marker as given. A press where no marker is drawn pages toward it. The track stays hidden from assistive technology, so keyboard and screen reader users reach the same places through the host's own navigation.

Implementation: `src/components/scroll-overview/scroll-overview.tsx`, `src/components/scroll-overview/scroll-overview-markers.ts`
Verification: `src/components/scroll-overview/scroll-overview.test.tsx`, `e2e/scroll-overview.spec.ts`

### UIC-SCROLL-OVERVIEW-1.4 - Thumb

While the content overflows the container, the overview shall draw a `ui-scroll-overview__thumb` over the marks (the root publishes `data-scrollable`), as long as the visible share of the content, at least 24 pixels, and placed along the track as far as the container is scrolled; it follows the container's scrolling at most once a frame. While the content fits, the thumb is hidden with the native `hidden` attribute. Dragging the thumb with the primary button scrolls the container in proportion to the thumb's travel, under an ancestor `transform: scale()` too; the drag keeps the pointer captured until release and its click neither pages nor activates a marker. A press on the track beside the thumb pages the container one visible height toward the press, unless a marker is pressed (UIC-SCROLL-OVERVIEW-1.3). The thumb, like the track, is hidden from assistive technology and takes no focus: the container scrolls from the keyboard natively. The reference sheet draws the thumb translucent, so the marks under it show through.

Implementation: `src/components/scroll-overview/scroll-overview.tsx`, `src/components/scroll-overview/scroll-overview-thumb.tsx`, `labs/reference/scroll-overview.css`
Verification: `src/components/scroll-overview/scroll-overview.test.tsx`, `e2e/scroll-overview.spec.ts`

## Hooks

| Hook                         | Kind     | Values | Description                                        |
| ---------------------------- | -------- | ------ | -------------------------------------------------- |
| `ui-scroll-overview`         | root     |        | The overview track.                                |
| `ui-scroll-overview__thumb`  | slot     |        | The thumb over the marks.                          |
| `data-empty`                 | state    | `true` | Nothing paints.                                    |
| `data-interactive`           | state    | `true` | A press on a marker scrolls to it.                 |
| `data-scrollable`            | state    | `true` | The content overflows; the thumb shows.            |
| `--ui-scroll-overview-image` | property |        | The overview image (`linear-gradient`), or `none`. |
