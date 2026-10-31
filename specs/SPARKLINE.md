# Sparkline

`Sparkline` draws a series of numbers as a word-sized line or area with no axes, such as a week of daily counts beside a figure or in a table cell. It lays the series out with the linear scale ([SCALES.md](SCALES.md)) and is an image named by its label and described by its lowest, highest and last values.

## UIC-SPARKLINE-1 - Sparkline

### UIC-SPARKLINE-1.1 - Parts

`Sparkline` shall render a `ui-sparkline` `<svg>` of `width` by `height` pixels (80 by 24 by default) with a matching `viewBox`, holding a `ui-sparkline__line` path (with no fill) through each run of two or more consecutive finite values and, for `variant="area"`, a `ui-sparkline__area` path under it. A finite value with no finite neighbour, such as the only value of a series, is drawn as a `ui-sparkline__dot` circle instead, so every finite value stays visible without markers. `variant` publishes `data-variant`: `line` (the default) or `area`.

Implementation: `src/components/sparkline/sparkline.tsx`
Verification: `src/components/sparkline/sparkline.test.tsx`, `src/components/sparkline/sparkline-geometry.test.ts`, `e2e/sparkline.spec.ts`

### UIC-SPARKLINE-1.2 - Layout

The values shall be spaced evenly from the left edge to the right in their order, and placed from the bottom edge (`minValue`, by default the lowest value) to the top (`maxValue`, by default the highest), inside a 3 pixel inset that keeps edge markers whole; values beyond `minValue` or `maxValue` stay at the edge. Equal values sit on the middle line, and a single value at the centre. The area fills from the line toward zero: to zero when zero lies between the bottom and the top, and otherwise to the edge nearest zero (the bottom for positive values), also when every value is equal or `minValue` equals `maxValue`. Coordinates are rounded to two decimals.

Calculating the finite value range shall not depend on the runtime limit on function arguments.

Implementation: `src/utils/summarize-numbers.ts`, `src/components/sparkline/sparkline-geometry.ts`, `src/utils/linear-scale.ts`
Verification: `src/utils/summarize-numbers.test.ts`, `src/components/sparkline/sparkline-geometry.test.ts`, `src/components/sparkline/sparkline.test.tsx`, `e2e/sparkline.spec.ts`

### UIC-SPARKLINE-1.3 - Gaps

A value that is not a finite number shall leave a gap: the line and the area break there and resume at the next finite value, which keeps its place in the series. Nothing joins values across a gap; a finite value between two gaps (or a gap and an end) is a `ui-sparkline__dot`. A series with no finite value draws no line, area or dot and publishes `data-empty`.

Implementation: `src/components/sparkline/sparkline-geometry.ts`, `src/components/sparkline/sparkline.tsx`
Verification: `src/components/sparkline/sparkline-geometry.test.ts`, `src/components/sparkline/sparkline.test.tsx`, `e2e/sparkline.spec.ts`

### UIC-SPARKLINE-1.4 - Markers

`markers` shall draw a `ui-sparkline__marker` circle with `data-marker` for each listed point: `min` at the first lowest value, `max` at the first highest and `last` at the last finite value. A series with no finite value draws no markers.

Implementation: `src/components/sparkline/sparkline.tsx`, `src/components/sparkline/sparkline-geometry.ts`
Verification: `src/components/sparkline/sparkline.test.tsx`, `src/components/sparkline/sparkline-geometry.test.ts`, `e2e/sparkline.spec.ts`

### UIC-SPARKLINE-1.5 - Hooks and caller attributes

`Sparkline` shall carry the hooks below, append the caller's `className`, and forward `id`, `ref` and caller `data-*` attributes to its `<svg>`; caller attributes never replace a hook attribute.

Implementation: `src/components/sparkline/sparkline.tsx`
Verification: `src/components/sparkline/sparkline.test.tsx`

## UIC-SPARKLINE-2 - Accessibility

### UIC-SPARKLINE-2.1 - Named image

The `<svg>` shall have `role="img"`, be named by `aria-label` or `aria-labelledby`, and take no tab stop.

Implementation: `src/components/sparkline/sparkline.tsx`
Verification: `src/components/sparkline/sparkline.test.tsx`, `e2e/sparkline.spec.ts`

### UIC-SPARKLINE-2.2 - Summary

The image shall be described by a `<desc>` that reads its lowest, highest and last values through the provider's `seriesSummary` string (`Low 4, high 18, last 15`), formatted for the locale with `formatOptions`, or the `noData` string for a series with no finite value. A caller's `aria-describedby` is kept after it.

Implementation: `src/components/sparkline/sparkline.tsx`, `src/core/content-strings.ts`
Verification: `src/components/sparkline/sparkline.test.tsx`, `e2e/sparkline.spec.ts`

## Hooks

| Hook                   | Kind      | Values               | Description                              |
| ---------------------- | --------- | -------------------- | ---------------------------------------- |
| `ui-sparkline`         | root      |                      | The `<svg>` (`role="img"`).              |
| `ui-sparkline__area`   | slot      |                      | The filled area, for `variant="area"`.   |
| `ui-sparkline__line`   | slot      |                      | The line through the values.             |
| `ui-sparkline__dot`    | slot      |                      | A finite value with no finite neighbour. |
| `ui-sparkline__marker` | slot      |                      | A dot on a marked value.                 |
| `data-variant`         | attribute | `line`, `area`       | Line or filled area.                     |
| `data-marker`          | attribute | `min`, `max`, `last` | Which value a marker marks.              |
| `data-empty`           | state     | `true`               | The series has no finite value.          |
