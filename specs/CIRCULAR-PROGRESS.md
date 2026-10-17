# Circular Progress

`CircularProgress` draws a ratio as a compact ring, for dense cells where a [Progress Bar](PROGRESS-BAR.md) does not fit. It is built on React Aria's `ProgressBar`, so it shares the bar's accessible value and its rules for truthful values. It is read-only and announces nothing on its own.

## UIC-CIRCULAR-PROGRESS-1 - Contract

### UIC-CIRCULAR-PROGRESS-1.1 - Element and name

`CircularProgress` shall render an element with `role="progressbar"`, named by its visible `label` (in the `ui-circular-progress__label` slot) or by `aria-label` or `aria-labelledby`, exposing `aria-valuemin`, `aria-valuemax` (0 and 100 by default), `aria-valuenow` and `aria-valuetext` (a locale-formatted percentage, or `valueLabel`). The ring is an `<svg>` in the `ui-circular-progress__ring` slot, hidden from assistive technology.

Implementation: `src/components/circular-progress/circular-progress.tsx`
Verification: `src/components/circular-progress/circular-progress.test.tsx`, `e2e/circular-progress.spec.ts`

### UIC-CIRCULAR-PROGRESS-1.2 - Ring geometry

The ring shall hold a `ui-circular-progress__track` circle and a `ui-circular-progress__fill` circle whose path length is normalised to 100 and whose `stroke-dashoffset` is 100 minus the percentage, starting at the top. These are SVG geometry attributes computed from the value; the stylesheet chooses stroke colour and width.

Implementation: `src/components/circular-progress/circular-progress.tsx`, `labs/reference.css`
Verification: `src/components/circular-progress/circular-progress.test.tsx`, `e2e/circular-progress.spec.ts`

### UIC-CIRCULAR-PROGRESS-1.3 - Truthful values

The ring shall follow the progress bar's bounding rules ([UIC-PROGRESS-BAR-1.5](PROGRESS-BAR.md)): a non-finite value falls back to the minimum, a value outside the range is bounded to it, and an empty range shows zero progress.

Implementation: `src/components/circular-progress/circular-progress.tsx`, `src/components/progress-bar/progress-bar.tsx`
Verification: `src/components/circular-progress/circular-progress.test.tsx`

### UIC-CIRCULAR-PROGRESS-1.4 - Indeterminate

With `isIndeterminate` the ring shall publish `data-indeterminate`, expose no `aria-valuenow` or `aria-valuetext`, and draw a fixed quarter arc that the stylesheet may spin.

Implementation: `src/components/circular-progress/circular-progress.tsx`, `labs/reference.css`
Verification: `src/components/circular-progress/circular-progress.test.tsx`, `e2e/circular-progress.spec.ts`

### UIC-CIRCULAR-PROGRESS-1.5 - Sizes and value text

`size` shall publish `data-size`: `sm`, `md` (the default) or `lg`; the reference sheet draws 16, 24 and 32 pixel rings. `showValueLabel` shows the value text in the `ui-circular-progress__value` slot beside the ring; it is off by default.

Implementation: `src/components/circular-progress/circular-progress.tsx`, `labs/reference.css`
Verification: `src/components/circular-progress/circular-progress.test.tsx`, `e2e/circular-progress.spec.ts`

### UIC-CIRCULAR-PROGRESS-1.6 - Hooks and caller attributes

`CircularProgress` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id` and `ref` to its root.

Implementation: `src/components/circular-progress/circular-progress.tsx`
Verification: `src/components/circular-progress/circular-progress.test.tsx`

## Hooks

| Hook                          | Kind      | Values           | Description                                  |
| ----------------------------- | --------- | ---------------- | -------------------------------------------- |
| `ui-circular-progress`        | root      |                  | The progress element (`role="progressbar"`). |
| `ui-circular-progress__ring`  | slot      |                  | The decorative `<svg>` ring.                 |
| `ui-circular-progress__track` | slot      |                  | The full circle behind the fill.             |
| `ui-circular-progress__fill`  | slot      |                  | The arc showing the ratio.                   |
| `ui-circular-progress__label` | slot      |                  | The visible label, when `label` is set.      |
| `ui-circular-progress__value` | slot      |                  | The visible value text, when shown.          |
| `data-size`                   | attribute | `sm`, `md`, `lg` | Ring size.                                   |
| `data-indeterminate`          | state     | `true`           | Unmeasured progress.                         |
