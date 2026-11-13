# Scroll Overview

`ScrollOverview` paints where markers sit in a scroll container's content, scaled to the container's visible height, so a reader sees at a glance where matches, comments or changes are in a long document. It works with any element that scrolls, given by `scrollRef`; [Scroll Region](SCROLL-REGION.md) paints the same overview itself (UIC-SCROLL-REGION-3). The component only paints: where the strip goes (beside a scrollbar, over a track, in a gutter) is the stylesheet's.

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

Without `onMarkerActivate` the strip shall be decorative and let presses through (`pointer-events: none` inline). With it, the root publishes `data-interactive` and a press on the strip finds the marker drawn at that pixel (the lowest priority among those covering it), scrolls the container so the marker's top is at its top, and calls `onMarkerActivate` with the marker as given. A press where no marker is drawn does nothing. The strip stays hidden from assistive technology, so keyboard and screen reader users reach the same places through the host's own navigation.

Implementation: `src/components/scroll-overview/scroll-overview.tsx`, `src/components/scroll-overview/scroll-overview-markers.ts`
Verification: `src/components/scroll-overview/scroll-overview.test.tsx`, `e2e/scroll-overview.spec.ts`

## Hooks

| Hook                         | Kind     | Values | Description                                        |
| ---------------------------- | -------- | ------ | -------------------------------------------------- |
| `ui-scroll-overview`         | root     |        | The overview strip.                                |
| `data-empty`                 | state    | `true` | Nothing paints.                                    |
| `data-interactive`           | state    | `true` | A press on a marker scrolls to it.                 |
| `--ui-scroll-overview-image` | property |        | The overview image (`linear-gradient`), or `none`. |
