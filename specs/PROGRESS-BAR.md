# Progress Bar

`ProgressBar` shows how much of a known amount of work is done, or that unmeasured work is under way, built on React Aria's `ProgressBar`. It is read-only output: it has no interactive states and announces nothing on its own; a host whose progress should be heard places it in its own status region. `Spinner` is the decorative busy glyph for unmeasured work too small for a bar. A compact ratio uses [Circular Progress](CIRCULAR-PROGRESS.md); a surface that must not be used until work finishes uses a [Loading Overlay](LOADING-OVERLAY.md).

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

Implementation: `src/components/progress-bar/progress-bar.tsx`, `labs/reference.css`
Verification: `src/components/progress-bar/progress-bar.test.tsx`, `e2e/progress-bar.spec.ts`

### UIC-PROGRESS-BAR-1.4 - Value text

The value text shall default to React Aria's locale-formatted percentage (`formatOptions` changes the format). `valueLabel` replaces it, both visibly and as `aria-valuetext`, for counts such as `2/3` or explanations such as `About a minute left`.

Implementation: `src/components/progress-bar/progress-bar.tsx`
Verification: `src/components/progress-bar/progress-bar.test.tsx`

### UIC-PROGRESS-BAR-1.5 - Truthful values

The bar shall never claim progress it did not measure: `minValue` defaults to 0 and `maxValue` to 100; a non-finite value or minimum falls back to the minimum, a non-finite or lower maximum to the minimum, and a value outside the range is bounded to it. An empty range (a total of zero) shows zero progress with `aria-valuenow` of the minimum, never completion.

Implementation: `src/components/progress-bar/progress-bar.tsx`
Verification: `src/components/progress-bar/progress-bar.test.tsx`

### UIC-PROGRESS-BAR-1.6 - Sizes

`size` shall publish `data-size`: `sm`, `md` (the default) or `lg`. The reference sheet draws 4, 6 and 8 pixel tracks.

Implementation: `src/components/progress-bar/progress-bar.tsx`, `labs/reference.css`
Verification: `src/components/progress-bar/progress-bar.test.tsx`, `e2e/progress-bar.spec.ts`

### UIC-PROGRESS-BAR-1.7 - Hooks and caller attributes

`ProgressBar` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id` and `ref` to its root.

Implementation: `src/components/progress-bar/progress-bar.tsx`
Verification: `src/components/progress-bar/progress-bar.test.tsx`

## UIC-PROGRESS-BAR-2 - Spinner

### UIC-PROGRESS-BAR-2.1 - Decorative busy glyph

`Spinner` shall render a `ui-spinner` element hidden from assistive technology (`aria-hidden="true"`), publish `data-size` (`sm`, `md` by default, `lg`; the reference sheet draws 12, 16 and 20 pixel boxes), append the caller's `className` and forward `id` and `data-*` attributes. The line it leads carries the status text and any `aria-busy`.

Implementation: `src/components/progress-bar/progress-bar.tsx`, `labs/reference.css`
Verification: `src/components/progress-bar/progress-bar.test.tsx`, `e2e/progress-bar.spec.ts`

## Hooks

| Hook                     | Kind      | Values           | Description                                                  |
| ------------------------ | --------- | ---------------- | ------------------------------------------------------------ |
| `ui-progress-bar`        | root      |                  | The progress bar (`role="progressbar"`).                     |
| `ui-progress-bar__label` | slot      |                  | The visible label, when `label` is set.                      |
| `ui-progress-bar__value` | slot      |                  | The visible value text, when determinate and shown.          |
| `ui-progress-bar__track` | slot      |                  | The track.                                                   |
| `ui-progress-bar__fill`  | slot      |                  | The fill; inline `width` is the percentage when determinate. |
| `ui-spinner`             | root      |                  | The decorative busy glyph (`<span>`).                        |
| `data-size`              | attribute | `sm`, `md`, `lg` | Track thickness, or the spinner's box size.                  |
| `data-indeterminate`     | state     | `true`           | Unmeasured progress.                                         |
