# Loading Overlay

The loading overlay family blocks a surface while work it depends on runs. `LoadingCard` is the status card: what is loading, how far it got and what it is doing now. `LoadingOverlay` covers a positioned surface with a scrim and centres the card on it. `LoadingRegion` is a bounded region that marks its content busy and inert and shows the overlay while `isLoading` is true. Progress beside content that stays usable is a [Progress Bar](PROGRESS-BAR.md).

## UIC-LOADING-OVERLAY-1 - Card

### UIC-LOADING-OVERLAY-1.1 - Content

`LoadingCard` shall show its `label` (the provider's `loading` string by default) in the `ui-loading-card__label` slot of a `ui-loading-card__header`, exactly one [Progress Bar](PROGRESS-BAR.md) (size `md`, no visible value) in the `ui-loading-card__progress` slot, an optional `description` in `ui-loading-card__description`, and a `ui-loading-card__footer` holding the optional `hint` and step counter. Omitted parts are not rendered, and the footer only renders when it holds something.

Implementation: `src/components/loading-overlay/loading-overlay.tsx`
Verification: `src/components/loading-overlay/loading-overlay.test.tsx`, `e2e/loading-overlay.spec.ts`

### UIC-LOADING-OVERLAY-1.2 - Progress

Without `progress`, or with `progress.isIndeterminate`, the bar shall be indeterminate and the card shows no percentage. Measured `progress` (`value`, `minValue`, `maxValue`, `valueLabel`, `formatOptions`) sets the bar's value under the progress bar's bounding rules, shows the bounded, locale-formatted whole percentage in the header's `ui-loading-card__value` slot and publishes `data-determinate` on the card.

Implementation: `src/components/loading-overlay/loading-overlay.tsx`, `src/components/progress-bar/progress-bar.tsx`
Verification: `src/components/loading-overlay/loading-overlay.test.tsx`, `e2e/loading-overlay.spec.ts`

### UIC-LOADING-OVERLAY-1.3 - Step counter

`step` (`current` of `total`) shall render the provider's `stepOfTotal` text (`6 of 9` in English) in the `ui-loading-card__step` slot only when both are whole numbers and `current` is between 1 and `total`. Steps describe real phases, independent of the percentage.

Implementation: `src/components/loading-overlay/loading-overlay.tsx`, `src/core/strings.ts`
Verification: `src/components/loading-overlay/loading-overlay.test.tsx`

### UIC-LOADING-OVERLAY-1.4 - Announcements

The card shall be a polite status region (`role="status"`) whose label and description are the announcement. The bar's container and the footer are marked `aria-live="off"`, so progress, hint and step changes stay quiet, and the percentage is hidden from assistive technology because the bar already exposes the value. The bar is named by `progress['aria-label']`, measured or indeterminate, or else by the card's label.

Implementation: `src/components/loading-overlay/loading-overlay.tsx`
Verification: `src/components/loading-overlay/loading-overlay.test.tsx`, `e2e/loading-overlay.spec.ts`

### UIC-LOADING-OVERLAY-1.5 - Hint

The hint shall render as a [Truncation Tooltip](TRUNCATION-TOOLTIP.md) in the `ui-loading-card__hint` slot, so a hint the stylesheet cuts keeps its full text in a tooltip.

Implementation: `src/components/loading-overlay/loading-overlay.tsx`, `src/components/truncation-tooltip/truncation-tooltip.tsx`
Verification: `src/components/loading-overlay/loading-overlay.test.tsx`, `e2e/loading-overlay.spec.ts`

## UIC-LOADING-OVERLAY-2 - Overlay

### UIC-LOADING-OVERLAY-2.1 - Cover

`LoadingOverlay` shall render a `ui-loading-overlay` element that the stylesheet stretches over its positioned parent, holding a `LoadingCard` built from the same props. It has no resting state: the host mounts it while the work runs and removes it when the work settles. Inside a `LoadingRegion` the reference stylesheet isolates the region and keeps its content at `z-index: 0`, so the cover paints above every part of the content it blocks, including sticky and pinned parts with in-page z-indexes (0 to 3, written down in `labs/reference/base.css`).

Implementation: `src/components/loading-overlay/loading-overlay.tsx`, `labs/reference/loading-overlay.css`
Verification: `src/components/loading-overlay/loading-overlay.test.tsx`, `e2e/loading-overlay.spec.ts`

### UIC-LOADING-OVERLAY-2.2 - Presentation

`presentation` shall publish `data-presentation`: `card` (the default) or `scrim`. A scrim draws the cover alone, without card, progress bar or status, and is hidden from assistive technology, so secondary regions that load together with a primary one share its look without repeating the announcement.

Implementation: `src/components/loading-overlay/loading-overlay.tsx`, `labs/reference/loading-overlay.css`
Verification: `src/components/loading-overlay/loading-overlay.test.tsx`, `e2e/loading-overlay.spec.ts`

### UIC-LOADING-OVERLAY-2.3 - Full screen

`fullscreen` shall publish `data-fullscreen` and render the cover through a top-layer [Portal](PORTAL.md) on the `modal` layer, in the overlay container, so the stylesheet can fix it over the viewport without being clipped or offset by the surrounding layout. A full-screen region keeps its own content inert while it loads, so keyboard users cannot reach what the cover hides. Shown while a modal is open, such as from a modal's action, the cover stays visible to assistive technology, so its status is announced, and blocks presses to the modal beneath.

Implementation: `src/components/loading-overlay/loading-overlay.tsx`, `labs/reference/loading-overlay.css`
Verification: `src/components/loading-overlay/loading-overlay.test.tsx`, `e2e/loading-overlay.spec.ts`

### UIC-LOADING-OVERLAY-2.4 - Entering and exiting

`isEntering` and `isExiting` shall publish `data-entering` and `data-exiting` on the cover. `LoadingRegion` times both with [`useEnterExit`](ENTER-EXIT.md) from the cover's `ref`: the cover enters when the region starts blocking and stays mounted, exiting, until its exit animations end after loading stops. A host that mounts `LoadingOverlay` itself does the same with the overlay's `ref`.

Implementation: `src/components/loading-overlay/loading-overlay.tsx`, `src/utils/use-enter-exit.ts`, `labs/reference/loading-overlay.css`
Verification: `src/components/loading-overlay/loading-overlay.test.tsx`, `e2e/loading-overlay.spec.ts`

## UIC-LOADING-OVERLAY-3 - Region

### UIC-LOADING-OVERLAY-3.1 - Blocking while loading

While `isLoading` is true, `LoadingRegion` shall set `data-loading` on its root, mark its `ui-loading-region__content` busy (`aria-busy="true"`) and inert (no pointer, focus or assistive-technology access) and render a `LoadingOverlay` with the given label, description, hint, progress, step and presentation beside the content. The overlay's status card is never inside a busy element, so its label is announced during the wait rather than held back until the region is ready. When loading ends, busy and inert are removed and the content is usable again; the overlay leaves once its exit ends ([UIC-LOADING-OVERLAY-2.4](#uic-loading-overlay-24---entering-and-exiting)). Keyboard focus inside the content when blocking starts moves to the region's root, which is focusable (`tabindex="-1"`) only while blocking, so focus is not lost to the document; when blocking ends, focus returns to the element that had it, unless the reader has moved focus elsewhere meanwhile.

Implementation: `src/components/loading-overlay/loading-overlay.tsx`, `src/components/loading-overlay/use-blocked-focus.ts`, `labs/reference/loading-overlay.css`
Verification: `src/components/loading-overlay/loading-overlay.test.tsx`, `e2e/loading-overlay.spec.ts`

### UIC-LOADING-OVERLAY-3.2 - Show delay

With `delay` (milliseconds), `LoadingRegion` shall stay usable and unmarked until `isLoading` has been true for that long, then block as above; loading that ends sooner never shows the overlay, marks the content busy or makes its content inert. A `LoadingOverlay` given `delay` renders nothing until it has been mounted that long.

Implementation: `src/components/loading-overlay/loading-overlay.tsx`, `src/utils/use-delayed-flag.ts`
Verification: `src/components/loading-overlay/loading-overlay.test.tsx`, `src/utils/use-delayed-flag.test.ts`, `e2e/loading-overlay.spec.ts`

### UIC-LOADING-OVERLAY-3.3 - Focus in shadow roots

`LoadingRegion` shall read focus in its own tree and follow it into open shadow roots, so the blocking and return of [UIC-LOADING-OVERLAY-3.1](#uic-loading-overlay-31---blocking-while-loading) hold for a region inside a shadow root, inside nested shadow roots, and for an element inside a shadow host within ordinary content: that element, not its host, gets focus back. Focus counts as moved elsewhere unless it sits on the region or nowhere in the page.

Implementation: `src/components/loading-overlay/use-blocked-focus.ts`, `src/utils/focus-target.ts`
Verification: `src/components/loading-overlay/loading-region-shadow.test.tsx`, `e2e/loading-overlay.spec.ts`

### UIC-LOADING-OVERLAY-3.4 - Nested regions

When `LoadingRegion`s nest, focus shall wait on the outermost region that blocks it and return to the element that had it once every region around that element has ended, whichever region starts or ends first: a region that ends while an outer one still blocks hands its return target to the outer region, and a region that ends while it holds focus inside a region still blocking moves focus to that region instead of into inert content. Focus the reader moved elsewhere meanwhile stays where it is.

Implementation: `src/components/loading-overlay/use-blocked-focus.ts`
Verification: `src/components/loading-overlay/loading-region-nested.test.tsx`, `e2e/loading-overlay.spec.ts`

### UIC-LOADING-OVERLAY-3.5 - Overlays opened from the content

`LoadingRegion` shall publish its blocking to the library's interactive overlays opened from its content (menus and submenus, field popups such as select, combobox, completion and calendar lists, and popovers: every overlay that renders `PopoverPresence`), which render outside the content in a portal. When the region starts blocking, after its `delay`, each such overlay that is open closes before the reader can act in it again, so neither a key nor a pointer can activate it; focus inside the overlay moves to the region's root and returns to the overlay's trigger once blocking ends, as in [UIC-LOADING-OVERLAY-3.1](#uic-loading-overlay-31---blocking-while-loading). Overlays opened elsewhere, such as from a sibling of the region, stay open. Inside a blocking region, an inner region's or skeleton's overlays follow the outer region. `Skeleton` applies the same policy ([UIC-SKELETON-2.3](SKELETON.md#uic-skeleton-23---overlays-opened-from-the-content)).

Implementation: `src/core/loading-boundary.tsx`, `src/components/loading-overlay/loading-overlay.tsx`, `src/components/loading-overlay/use-blocked-focus.ts`, `src/components/popover/popover-presence.tsx`
Verification: `src/components/loading-overlay/loading-region-overlays.test.tsx`, `e2e/loading-overlay.spec.ts`

## UIC-LOADING-OVERLAY-4 - Hooks

### UIC-LOADING-OVERLAY-4.1 - Hooks and caller attributes

Each component shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its own root only.

Implementation: `src/components/loading-overlay/loading-overlay.tsx`
Verification: `src/components/loading-overlay/loading-overlay.test.tsx`

## Hooks

| Hook                           | Kind      | Values          | Description                                      |
| ------------------------------ | --------- | --------------- | ------------------------------------------------ |
| `ui-loading-card`              | root      |                 | The status card (`role="status"`).               |
| `ui-loading-card__header`      | slot      |                 | Label and percentage row.                        |
| `ui-loading-card__label`       | slot      |                 | What is loading.                                 |
| `ui-loading-card__value`       | slot      |                 | The percentage, when progress is measured.       |
| `ui-loading-card__progress`    | slot      |                 | The container of the one progress bar.           |
| `ui-loading-card__description` | slot      |                 | The description, when set.                       |
| `ui-loading-card__footer`      | slot      |                 | Hint and step row, when either is set.           |
| `ui-loading-card__hint`        | slot      |                 | The current work (also `ui-truncation-tooltip`). |
| `ui-loading-card__step`        | slot      |                 | The step counter, when valid.                    |
| `ui-loading-overlay`           | root      |                 | The cover over the loading surface.              |
| `ui-loading-region`            | root      |                 | The bounded region.                              |
| `ui-loading-region__content`   | slot      |                 | The region's content; inert while loading.       |
| `data-determinate`             | state     | `true`          | The card shows measured progress.                |
| `data-presentation`            | attribute | `card`, `scrim` | Card on the scrim, or the scrim alone.           |
| `data-loading`                 | state     | `true`          | The region is loading.                           |
| `data-fullscreen`              | state     | `true`          | The cover is fixed over the viewport.            |
| `data-entering`                | state     | `true`          | The cover is playing its enter animation.        |
| `data-exiting`                 | state     | `true`          | The cover is playing its exit transition.        |
