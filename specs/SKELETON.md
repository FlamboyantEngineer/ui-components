# Skeleton

`Skeleton` stands in for content that is loading. Without children it is a decorative placeholder block of a given shape; around real content it keeps that content's layout under the placeholder while loading and reveals it once loaded, without remounting it. `SkeletonText` is a decorative placeholder for a paragraph. How placeholders look and whether they shimmer or pulse is the host stylesheet's concern; the library publishes the shape, the loading state and whether the placeholder may animate. A card whose body is loading uses [Card](CARD.md)'s `isLoading`; a surface that must not be used until work finishes uses a [Loading Overlay](LOADING-OVERLAY.md).

## UIC-SKELETON-1 - Placeholder block

### UIC-SKELETON-1.1 - Block

A `Skeleton` without children (or with children that render nothing) shall render an empty `ui-skeleton` `<div>` hidden from assistive technology (`aria-hidden="true"`), which the stylesheet draws as the placeholder while it publishes `data-loading`.

Implementation: `src/components/skeleton/skeleton.tsx`, `labs/reference/skeleton.css`
Verification: `src/components/skeleton/skeleton.test.tsx`, `e2e/skeleton.spec.ts`

### UIC-SKELETON-1.2 - Shapes

`shape` shall publish `data-shape`: `text` (a line of text), `rectangle` (the default, a block such as media) or `circle` (a round avatar). The reference sheet draws a text line at the text's size, a rectangle across its container and a 40 pixel circle; a host sizes a placeholder through its `className`.

Implementation: `src/components/skeleton/skeleton.tsx`, `labs/reference/skeleton.css`
Verification: `src/components/skeleton/skeleton.test.tsx`, `e2e/skeleton.spec.ts`

### UIC-SKELETON-1.3 - Animation switch

While loading, a skeleton shall publish `data-animated` unless `animated={false}`, so the stylesheet animates only placeholders that allow it. The library animates nothing; the reference sheet pulses animated placeholders unless the reader prefers reduced motion.

Implementation: `src/components/skeleton/skeleton.tsx`, `labs/reference/skeleton.css`
Verification: `src/components/skeleton/skeleton.test.tsx`, `e2e/skeleton.spec.ts`

### UIC-SKELETON-1.4 - Hooks and caller attributes

`Skeleton` and `SkeletonText` shall carry the hooks below, append the caller's `className`, and forward `id` and caller `data-*` attributes to their root; caller attributes never replace a hook attribute.

Implementation: `src/components/skeleton/skeleton.tsx`
Verification: `src/components/skeleton/skeleton.test.tsx`

## UIC-SKELETON-2 - Loading content

### UIC-SKELETON-2.1 - Wrapped content

A `Skeleton` with children shall render them inside a `ui-skeleton__content` element within its root. While `isLoading` (the default) the root publishes `data-loading` and the content element is `inert`, so its controls take no focus or input, and keeps its layout, so the placeholder covers the space the content will fill; the reference sheet hides the content and draws the placeholder in the root, in the shape of `data-shape`.

Implementation: `src/components/skeleton/skeleton.tsx`, `labs/reference/skeleton.css`
Verification: `src/components/skeleton/skeleton.test.tsx`, `e2e/skeleton.spec.ts`

### UIC-SKELETON-2.2 - Revealing content

When `isLoading` turns false the skeleton shall drop `data-loading`, `data-animated`, `aria-busy`, `inert` and `aria-hidden`, so the content shows and works, and keep the same elements, so the content is not remounted and keeps its state.

Implementation: `src/components/skeleton/skeleton.tsx`
Verification: `src/components/skeleton/skeleton.test.tsx`, `e2e/skeleton.spec.ts`

### UIC-SKELETON-2.3 - Overlays opened from the content

While loading, `Skeleton` shall close the library's interactive overlays opened from its content, as `LoadingRegion` does ([UIC-LOADING-OVERLAY-3.5](LOADING-OVERLAY.md#uic-loading-overlay-35---overlays-opened-from-the-content)), so a menu that renders outside the hidden content in a portal cannot be activated. A skeleton has no focusable root, so it does not hold focus: the overlay's own focus restoration applies.

Implementation: `src/core/loading-boundary.tsx`, `src/components/skeleton/skeleton.tsx`, `src/components/popover/popover-presence.tsx`
Verification: `src/components/loading-overlay/loading-region-overlays.test.tsx`

## UIC-SKELETON-3 - Text placeholder

### UIC-SKELETON-3.1 - Lines

`SkeletonText` shall render a `ui-skeleton-text` element hidden from assistive technology holding `lines` (3 by default, at least 1; a fraction is truncated and a value that is not a finite number gives 3) text skeletons, each also a `ui-skeleton-text__line`, which pass on `animated`. The reference sheet shortens the last of several lines.

Implementation: `src/components/skeleton/skeleton.tsx`, `labs/reference/skeleton.css`
Verification: `src/components/skeleton/skeleton.test.tsx`, `e2e/skeleton.spec.ts`

## UIC-SKELETON-4 - Accessibility

### UIC-SKELETON-4.1 - Busy region and hidden placeholders

A skeleton around content shall set `aria-busy="true"` on its root while loading and hide the content from assistive technology (`aria-hidden="true"` and `inert` on the content element), so assistive technology neither reads nor reaches the placeholder and waits for the loaded content. Placeholder blocks and text placeholders are always hidden from assistive technology, so the region holding them states its own busy status. Skeletons take no role and no tab stop.

Implementation: `src/components/skeleton/skeleton.tsx`
Verification: `src/components/skeleton/skeleton.test.tsx`, `e2e/skeleton.spec.ts`

## Hooks

| Hook                     | Kind      | Values                        | Description                                                           |
| ------------------------ | --------- | ----------------------------- | --------------------------------------------------------------------- |
| `ui-skeleton`            | root      |                               | A placeholder block, or the loading region around content.            |
| `ui-skeleton__content`   | slot      |                               | The wrapped content, inert and hidden while loading.                  |
| `ui-skeleton-text`       | root      |                               | A text placeholder.                                                   |
| `ui-skeleton-text__line` | slot      |                               | One line of a text placeholder (also `ui-skeleton`).                  |
| `data-shape`             | attribute | `text`, `rectangle`, `circle` | The placeholder's shape.                                              |
| `data-loading`           | state     | `true`                        | The content is loading: draw the placeholder.                         |
| `data-animated`          | state     | `true`                        | While loading, unless `animated={false}`: the stylesheet may animate. |
