# Progress Bar

`ProgressBar` shows work toward completion, as a linear track or circular ring. `Meter`, in the same family, shows a measured quantity inside a known range, such as storage used or a battery's charge: it has the meter role, judges its tone by thresholds and never claims progress or completion. The output has no interactive state and announces nothing on its own; a host can place changing progress in a status region. `Spinner` is a decorative or named busy glyph. A [Loading Overlay](LOADING-OVERLAY.md) blocks a surface while work finishes.

## UIC-PROGRESS-BAR-1 - Progress bar

### UIC-PROGRESS-BAR-1.1 - Element and name

`ProgressBar` shall render an element with `role="progressbar"`, named by its visible `label` (drawn in the `ui-progress-bar__label` slot) or by `aria-label` or `aria-labelledby`. It exposes `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and its value text as `aria-valuetext`, and draws a `ui-progress-bar__track` holding a `ui-progress-bar__fill`.

Implementation: `src/components/progress-bar/progress-bar.tsx`
Verification: `src/components/progress-bar/progress-bar.test.tsx`, `e2e/progress-bar.spec.ts`

### UIC-PROGRESS-BAR-1.2 - Determinate progress

A determinate bar shall set the fill's inline `width` to the value's percentage of the range and show its value text in the `ui-progress-bar__value` slot. `showValueLabel={false}` hides the visible value text while the bar keeps its accessible value.

Implementation: `src/components/progress-bar/progress-bar.tsx`
Verification: `src/components/progress-bar/progress-bar.test.tsx`, `e2e/progress-bar.spec.ts`

### UIC-PROGRESS-BAR-1.3 - Indeterminate progress

With `isIndeterminate` the bar shall publish `data-indeterminate`, expose no `aria-valuenow` or `aria-valuetext`, show no value text and give the fill no width, so the stylesheet animates it without claiming a level.

Implementation: `src/components/progress-bar/progress-bar.tsx`, `labs/reference/progress-bar.css`
Verification: `src/components/progress-bar/progress-bar.test.tsx`, `e2e/progress-bar.spec.ts`

### UIC-PROGRESS-BAR-1.4 - Value text

The value text shall default to a locale-formatted percentage (`formatOptions` changes the format). `valueLabel`, plain text, replaces it, both visibly and as `aria-valuetext`, for counts such as `2/3` or explanations such as `About a minute left`; blank text, or a value that is not text, keeps the formatted value. Being plain text, it reads the same as it shows, and the `valueText` a `render` callback receives is always a string.

Implementation: `src/components/progress-bar/progress-bar.tsx`
Verification: `src/components/progress-bar/progress-bar.test.tsx`, `src/components/progress-bar/progress-value-label.test.tsx`, `e2e/progress-bar.spec.ts`

### UIC-PROGRESS-BAR-1.5 - Truthful values

The bar shall never claim progress it did not measure: `minValue` defaults to 0 and `maxValue` to 100; a non-finite value or minimum falls back to the minimum, a non-finite or lower maximum to the minimum, and a value outside the range is bounded to it. An empty range (a total of zero) shows zero progress with `aria-valuenow` of the minimum, never completion. A range wider than the largest number, such as `-Number.MAX_VALUE` to `Number.MAX_VALUE`, keeps its true share: the fill or ring, the default value text and a loading card's percentage all agree (its middle is 50%).

Implementation: `src/components/progress-bar/progress-bar.tsx`, `src/components/progress-bar/progress-root.tsx`
Verification: `src/components/progress-bar/progress-bar.test.tsx`, `src/components/progress-bar/progress-range.test.tsx`

### UIC-PROGRESS-BAR-1.6 - Sizes

`size` shall publish `data-size`: `sm`, `md` (the default) or `lg`. The reference sheet draws 4, 6 and 8 pixel tracks.

Implementation: `src/components/progress-bar/progress-bar.tsx`, `labs/reference/progress-bar.css`
Verification: `src/components/progress-bar/progress-bar.test.tsx`, `e2e/progress-bar.spec.ts`

### UIC-PROGRESS-BAR-1.7 - Hooks and caller attributes

`ProgressBar` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id` and `ref` to its root.

Implementation: `src/components/progress-bar/progress-bar.tsx`
Verification: `src/components/progress-bar/progress-bar.test.tsx`

### UIC-PROGRESS-BAR-1.8 - Completion and status

A determinate bar whose bounded value equals its maximum, in a range that is not empty, shall publish `data-complete`; an indeterminate bar and an empty range never do. `tone` shall publish `data-tone`: `neutral` (the default, work running normally), `success`, `warning` or `danger`, so the stylesheet colours a bar that finished, needs attention or failed. The tone is never the only signal: the label or value text states the outcome.

Implementation: `src/components/progress-bar/progress-bar.tsx`, `labs/reference/progress-bar.css`
Verification: `src/components/progress-bar/progress-bar.test.tsx`, `e2e/progress-bar.spec.ts`

## UIC-PROGRESS-BAR-2 - Spinner

### UIC-PROGRESS-BAR-2.1 - Decorative busy glyph

`Spinner` shall render a `ui-spinner` element hidden from assistive technology (`aria-hidden="true"`), publish `data-size` (`sm`, `md` by default, `lg`; the reference sheet draws 12, 16 and 20 pixel boxes), append the caller's `className` and forward `id`, `ref` (its `<span>`) and `data-*` attributes. The line it leads carries the status text and any `aria-busy`.

Implementation: `src/components/progress-bar/progress-bar.tsx`, `labs/reference/progress-bar.css`
Verification: `src/components/progress-bar/progress-bar.test.tsx`, `e2e/progress-bar.spec.ts`

### UIC-PROGRESS-BAR-2.2 - Standalone spinner

A `Spinner` given `label` shall stand alone: the same `ui-spinner` `<span>`, with its size, becomes an indeterminate progress bar (`role="progressbar"`, no `aria-valuenow`) named by the label, and is no longer hidden from assistive technology. It stays phrasing content, so it may sit within a sentence or any element that allows only inline content, and it renders without development warnings. Use it where no surrounding text states the busy status; a spinner that leads such a line stays decorative.

Implementation: `src/components/progress-bar/progress-bar.tsx`
Verification: `src/components/progress-bar/progress-bar.test.tsx`, `e2e/progress-bar.spec.ts`

## UIC-PROGRESS-BAR-3 - Unified options

### UIC-PROGRESS-BAR-3.1 - Shape

`shape` shall select a linear track (the default) or a circular ring, on `ProgressBar` and `Meter` alike, and publish it as `data-shape`. A circular meter keeps its bounded value, thresholds and meter role, and is never indeterminate or complete.

Implementation: `src/components/progress-bar/progress-bar.tsx`, `src/components/progress-bar/meter.tsx`, `src/components/progress-bar/progress-ring.tsx`
Verification: `src/components/progress-bar/progress-bar.test.tsx`, `src/components/progress-bar/meter.test.tsx`, `e2e/unified-options.spec.ts`

## UIC-PROGRESS-BAR-4 - Segmented progress

### UIC-PROGRESS-BAR-4.1 - Segments

With `segments`, an ordered list of work units (`id`, `label`, and `state`: `complete`, `current` or `pending`), `ProgressBar` shall stay one `role="progressbar"` element and publish `data-segmented`. Its `ui-progress-bar__track` holds one `ui-progress-bar__segment` per unit, in the caller's order and with no fill, each publishing its drawn state as `data-state`. Segments are plain decorative elements, so the bar has no nested progress bars or semantic descendants.

Implementation: `src/components/progress-bar/progress-segments.tsx`, `labs/reference/progress-bar.css`
Verification: `src/components/progress-bar/progress-segments.test.tsx`, `e2e/progress-bar-segments.spec.ts`

### UIC-PROGRESS-BAR-4.2 - Value

The bar's range shall be 0 to the number of units and its value the number of `complete` units. The current unit does not count as completed: one completed unit of seven is `aria-valuenow="1"` and 14%, with the second segment current. The visible value text is the provider's `segmentCount` string (`1/7 · 14%`), with counts and percentage formatted for the locale.

Implementation: `src/components/progress-bar/progress-segments.tsx`, `src/core/strings/common.ts`
Verification: `src/components/progress-bar/progress-segments.test.tsx`

### UIC-PROGRESS-BAR-4.3 - Current unit

The bar's `aria-valuetext` shall be the provider's `segmentProgress` string, which names the current unit by its `label` (`1 of 7 done, 14%, Draft in progress`), so the current unit never depends on colour alone. The reference sheet also draws the current segment striped, a shape cue beside its colour.

Implementation: `src/components/progress-bar/progress-segments.tsx`, `labs/reference/progress-bar.css`
Verification: `src/components/progress-bar/progress-segments.test.tsx`, `e2e/progress-bar-segments.spec.ts`

### UIC-PROGRESS-BAR-4.4 - Read-only aggregate

A sequence with no `current` unit shall read as aggregate progress: the spoken value states only the count and percentage (`3 of 7 done, 43%`) and no segment is current.

Implementation: `src/components/progress-bar/progress-segments.tsx`
Verification: `src/components/progress-bar/progress-segments.test.tsx`

### UIC-PROGRESS-BAR-4.5 - Empty and completed sequences

An empty list shall draw an empty track with a range of 0 to 0 and `0 of 0 done, 0%`, never completion. When every unit is `complete`, the bar publishes `data-complete` as an ordinary bar at its maximum does ([UIC-PROGRESS-BAR-1.8](#uic-progress-bar-18---completion-and-status)).

Implementation: `src/components/progress-bar/progress-segments.tsx`
Verification: `src/components/progress-bar/progress-segments.test.tsx`, `e2e/progress-bar-segments.spec.ts`

### UIC-PROGRESS-BAR-4.6 - Invalid input

With `segments`, the bar shall ignore `value`, `minValue`, `maxValue`, `formatOptions`, `isIndeterminate` and `shape`: it is always a determinate linear progress bar whose value comes from the units. Only the first `current` unit is current; later `current` units and units with an unknown state draw as `pending` and do not count.

Implementation: `src/components/progress-bar/progress-segments.tsx`
Verification: `src/components/progress-bar/progress-segments.test.tsx`

### UIC-PROGRESS-BAR-4.7 - Value text overrides

`valueLabel` shall replace both the visible and the spoken value text, as on an ordinary bar, so a host that sets it names the current unit itself. `showValueLabel={false}` hides the visible text and keeps the spoken one. A provider can replace `segmentCount` and `segmentProgress`.

Implementation: `src/components/progress-bar/progress-segments.tsx`
Verification: `src/components/progress-bar/progress-segments.test.tsx`

### UIC-PROGRESS-BAR-4.8 - Size, tone and caller attributes

A segmented bar shall publish `data-size` and `data-tone` and forward the caller's `className`, `id`, `ref` and `data-*` attributes as an ordinary bar does. The reference sheet colours completed segments with the tone (success once every unit is complete), keeps the label and value on one row above the track, and narrows the gaps between segments when there are many, so a long sequence fits a narrow container without overflowing.

Implementation: `src/components/progress-bar/progress-segments.tsx`, `labs/reference/progress-bar.css`
Verification: `src/components/progress-bar/progress-segments.test.tsx`, `e2e/progress-bar-segments.spec.ts`

### UIC-PROGRESS-BAR-4.9 - Identity

A segment shall keep its element across renders by its `id`. Numeric and text ids, such as `1` and `'1'`, identify distinct units.

Implementation: `src/components/progress-bar/progress-segments.tsx`
Verification: `src/components/progress-bar/progress-segments.test.tsx`

## UIC-PROGRESS-BAR-11 - Contract

### UIC-PROGRESS-BAR-11.1 - Element and name

`ProgressBar` shall render an element with `role="progressbar"`, named by its visible `label` (in the `ui-progress-bar__label` slot) or by `aria-label` or `aria-labelledby`, exposing `aria-valuemin`, `aria-valuemax` (0 and 100 by default), `aria-valuenow` and `aria-valuetext` (a locale-formatted percentage, or `valueLabel`). The ring is an `<svg>` in the `ui-progress-bar__ring` slot, hidden from assistive technology.

Implementation: `src/components/progress-bar/progress-bar.tsx`
Verification: `src/components/progress-bar/progress-ring.test.tsx`, `e2e/progress-ring.spec.ts`

### UIC-PROGRESS-BAR-11.2 - Ring geometry

The ring shall hold a `ui-progress-bar__track` circle and a `ui-progress-bar__fill` circle whose path length is normalised to 100 and whose `stroke-dashoffset` is 100 minus the percentage, starting at the top. A full ring (100%) draws its fill without `stroke-dasharray` or `stroke-dashoffset`, one closed stroke, so no seam shows where a dash would end at its own start; any value short of the maximum keeps the dash and its sliver of gap. These are SVG geometry attributes computed from the value; the stylesheet chooses stroke colour and width.

Implementation: `src/components/progress-bar/progress-bar.tsx`, `labs/reference/progress-bar.css`
Verification: `src/components/progress-bar/progress-ring.test.tsx`, `e2e/progress-ring.spec.ts`

### UIC-PROGRESS-BAR-11.3 - Truthful values

The ring shall follow the progress bar's bounding rules ([UIC-PROGRESS-BAR-1.5](PROGRESS-BAR.md)): a non-finite value falls back to the minimum, a value outside the range is bounded to it, and an empty range shows zero progress.

Implementation: `src/components/progress-bar/progress-bar.tsx`, `src/components/progress-bar/progress-bar.tsx`
Verification: `src/components/progress-bar/progress-ring.test.tsx`

### UIC-PROGRESS-BAR-11.4 - Indeterminate

With `isIndeterminate` the ring shall publish `data-indeterminate`, expose no `aria-valuenow` or `aria-valuetext`, and draw a fixed quarter arc that the stylesheet may spin. The reference sheet rotates the ring around its center without applying the linear fill's sliding animation to the arc.

Implementation: `src/components/progress-bar/progress-bar.tsx`, `labs/reference/progress-bar.css`
Verification: `src/components/progress-bar/progress-ring.test.tsx`, `e2e/progress-ring.spec.ts`

### UIC-PROGRESS-BAR-11.5 - Sizes and value text

`size` shall publish `data-size`: `sm`, `md` (the default) or `lg`; the reference sheet draws 16, 24 and 32 pixel rings. `showValueLabel` shows the value text in the `ui-progress-bar__value` slot beside the ring; it is off by default.

Implementation: `src/components/progress-bar/progress-bar.tsx`, `labs/reference/progress-bar.css`
Verification: `src/components/progress-bar/progress-ring.test.tsx`, `e2e/progress-ring.spec.ts`

### UIC-PROGRESS-BAR-11.6 - Hooks and caller attributes

`ProgressBar` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id` and `ref` to its root.

Implementation: `src/components/progress-bar/progress-bar.tsx`
Verification: `src/components/progress-bar/progress-ring.test.tsx`

### UIC-PROGRESS-BAR-11.7 - Completion and status

The ring shall publish `data-complete` when its bounded value reaches the maximum of a range that is not empty, and `data-tone` (`neutral` by default, `success`, `warning` or `danger`) from `tone`, as the progress bar does ([UIC-PROGRESS-BAR-1.8](PROGRESS-BAR.md#uic-progress-bar-18---completion-and-status)).

Implementation: `src/components/progress-bar/progress-bar.tsx`, `src/components/progress-bar/progress-bar.tsx`, `labs/reference/progress-bar.css`
Verification: `src/components/progress-bar/progress-ring.test.tsx`, `e2e/progress-ring.spec.ts`

## UIC-PROGRESS-BAR-21 - Meter

### UIC-PROGRESS-BAR-21.1 - Parts

`Meter` shall render a `ui-meter` element holding its visible `label` in a `ui-meter__label` slot when one is given, its value text in a `ui-meter__value` slot, and a `ui-meter__track` holding a `ui-meter__fill`; a circular meter draws a `ui-meter__ring` holding the track and fill circles instead ([UIC-PROGRESS-BAR-11.2](#uic-progress-bar-112---ring-geometry)). It is built on the meter building block, separate from the progress bar, and takes none of the progress bar's progress-only props (`isIndeterminate`, `segments`).

Implementation: `src/components/progress-bar/meter.tsx`, `src/components/progress-bar/progress-root.tsx`
Verification: `src/components/progress-bar/meter.test.tsx`, `e2e/progress-meter.spec.ts`

### UIC-PROGRESS-BAR-21.2 - Fill and value text

The fill's inline `width` shall be the value's percentage of the range. `showValueLabel={false}` hides the visible value text while the meter keeps its accessible value; a ring shows none unless `showValueLabel` is set.

Implementation: `src/components/progress-bar/meter.tsx`
Verification: `src/components/progress-bar/meter.test.tsx`, `e2e/progress-meter.spec.ts`

### UIC-PROGRESS-BAR-21.3 - Value text

The value text shall default to a locale-formatted percentage; `formatOptions` changes the format (a unit such as gigabytes formats the value itself), and `valueLabel`, plain text, replaces the text, both visibly and as `aria-valuetext`. Blank text keeps the formatted value.

Implementation: `src/components/progress-bar/meter.tsx`
Verification: `src/components/progress-bar/meter.test.tsx`, `src/components/progress-bar/progress-value-label.test.tsx`, `e2e/progress-meter.spec.ts`

### UIC-PROGRESS-BAR-21.4 - Truthful values

The meter shall bound its range as a progress bar does ([UIC-PROGRESS-BAR-1.5](#uic-progress-bar-15---truthful-values)): `minValue` defaults to 0 and `maxValue` to 100, non-finite numbers fall back to the minimum, the maximum is never below the minimum, and the value stays inside the range, below zero as above it. An empty range shows an empty fill. A meter is never indeterminate and never publishes `data-complete`, even at its maximum.

Implementation: `src/components/progress-bar/meter.tsx`, `src/components/progress-bar/progress-root.tsx`
Verification: `src/components/progress-bar/meter.test.tsx`

### UIC-PROGRESS-BAR-21.5 - Sizes

`size` shall publish `data-size`: `sm`, `md` (the default) or `lg`. The reference sheet draws 4, 6 and 8 pixel tracks and 16, 24 and 32 pixel rings, as for a progress bar.

Implementation: `src/components/progress-bar/meter.tsx`, `labs/reference/progress-bar.css`
Verification: `src/components/progress-bar/meter.test.tsx`, `e2e/progress-meter.spec.ts`

### UIC-PROGRESS-BAR-21.6 - Tone

`tone` shall publish `data-tone`: `neutral` (no judgement), `success`, `warning` or `danger`. Without `tone` the meter publishes the tone of its thresholds ([UIC-PROGRESS-BAR-21.7](#uic-progress-bar-217---thresholds)), or `neutral` when it has none. The tone is never the only signal: the label, value text or description states what the value means.

Implementation: `src/components/progress-bar/meter.tsx`, `labs/reference/progress-bar.css`
Verification: `src/components/progress-bar/meter.test.tsx`, `e2e/progress-meter.spec.ts`

### UIC-PROGRESS-BAR-21.7 - Thresholds

`low`, `high` and `optimum` shall split the range into regions as the HTML `meter` element does: `low` (the minimum by default, bounded to the range) ends the low region, `high` (the maximum by default, bounded between `low` and the maximum) starts the high region, and `optimum` (the middle by default, bounded to the range) marks the best region. A value in the optimum's region is `success`. With the optimum between the boundaries, a value below `low` or above `high` is `warning`; with the optimum below `low` or above `high`, a value between the boundaries is `warning` and one in the opposite region `danger`. A value on a boundary counts as between them. `resolveMeterTone` exposes the same judgement.

Implementation: `src/components/progress-bar/progress-meter.ts`
Verification: `src/components/progress-bar/meter.test.tsx`, `e2e/progress-meter.spec.ts`

### UIC-PROGRESS-BAR-21.8 - Hooks and caller attributes

`Meter` shall carry the hooks below, append the caller's `className`, forward `id`, `ref` and caller `data-*` attributes to its root, and take `render`, typed `ElementRender<'div', MeterValues>` (`percentage` and `valueText`); caller attributes never replace a hook attribute.

Implementation: `src/components/progress-bar/meter.tsx`
Verification: `src/components/progress-bar/meter.test.tsx`

### UIC-PROGRESS-BAR-21.9 - Description

A `description` shall render in a `ui-meter__description` slot after the track and describe the meter (`aria-describedby`, after any the caller gives). Content that renders nothing draws no slot and no description.

Implementation: `src/components/progress-bar/meter.tsx`
Verification: `src/components/progress-bar/meter.test.tsx`, `e2e/progress-meter.spec.ts`

### UIC-PROGRESS-BAR-21.10 - Server rendering

A meter shall render the same markup on the server as in the browser, so hydrating it keeps the server's elements and reports no mismatch.

Implementation: `src/components/progress-bar/meter.tsx`
Verification: `src/components/progress-bar/meter.test.tsx`

## UIC-PROGRESS-BAR-22 - Meter accessibility

### UIC-PROGRESS-BAR-22.1 - Role and name

The meter's root shall have `role="meter"`, be named by its visible `label` or by `aria-label` or `aria-labelledby`, and expose `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and its value text as `aria-valuetext`.

Implementation: `src/components/progress-bar/meter.tsx`
Verification: `src/components/progress-bar/meter.test.tsx`, `e2e/progress-meter.spec.ts`

### UIC-PROGRESS-BAR-22.2 - Read-only output

A meter shall take no tab stop and handle no keys or pointer input; it announces nothing on its own, so a host whose value should be heard places it in its own status region.

Implementation: `src/components/progress-bar/meter.tsx`
Verification: `src/components/progress-bar/meter.test.tsx`, `e2e/progress-meter.spec.ts`

## Hooks

| Hook                       | Kind      | Values                                    | Description                                                  |
| -------------------------- | --------- | ----------------------------------------- | ------------------------------------------------------------ |
| `ui-progress-bar`          | root      |                                           | The progress bar (`role="progressbar"`).                     |
| `ui-progress-bar__label`   | slot      |                                           | The visible label, when `label` is set.                      |
| `ui-progress-bar__value`   | slot      |                                           | The visible value text, when determinate and shown.          |
| `ui-progress-bar__track`   | slot      |                                           | The track.                                                   |
| `ui-progress-bar__fill`    | slot      |                                           | The fill; inline `width` is the percentage when determinate. |
| `ui-progress-bar__ring`    | slot      |                                           | The decorative `<svg>` ring.                                 |
| `ui-progress-bar__segment` | slot      |                                           | One unit of a segmented bar.                                 |
| `data-state`               | attribute | `complete`, `current`, `pending`          | A segment's drawn state.                                     |
| `data-segmented`           | state     | `true`                                    | The bar draws `segments` instead of a fill.                  |
| `ui-meter`                 | root      |                                           | The meter (`role="meter"`).                                  |
| `ui-meter__label`          | slot      |                                           | The meter's visible label, when `label` is set.              |
| `ui-meter__value`          | slot      |                                           | The meter's visible value text, when shown.                  |
| `ui-meter__track`          | slot      |                                           | The meter's track, or the ring's track circle.               |
| `ui-meter__fill`           | slot      |                                           | The meter's fill; inline `width` is the percentage.          |
| `ui-meter__ring`           | slot      |                                           | The circular meter's decorative `<svg>` ring.                |
| `ui-meter__description`    | slot      |                                           | The meter's description, when `description` is set.          |
| `ui-spinner`               | root      |                                           | The decorative busy glyph (`<span>`).                        |
| `data-size`                | attribute | `sm`, `md`, `lg`                          | Track thickness, ring size, or the spinner's box size.       |
| `data-shape`               | attribute | `linear`, `circular`                      | Track appearance.                                            |
| `data-tone`                | attribute | `neutral`, `success`, `warning`, `danger` | The work's status, or what a measured value means.           |
| `data-indeterminate`       | state     | `true`                                    | Unmeasured progress.                                         |
| `data-complete`            | state     | `true`                                    | Measured progress reached the maximum.                       |
