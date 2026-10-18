# Meter

`Meter` shows a quantity within a known range, such as storage used, a battery level or a score, built on React Aria's `Meter`. Unlike a [Progress Bar](PROGRESS-BAR.md) it measures an amount rather than work toward completion, so it is never indeterminate and never complete. It shares the progress bar's hook vocabulary (`label`, `value`, `track` and `fill` slots, `data-size`, `data-tone`) and fill technique, so a host styles both the same way. The HTML `meter` element's `low`, `high` and `optimum` thresholds can judge the value through its tone.

## UIC-METER-1 - Meter

### UIC-METER-1.1 - Parts

`Meter` shall render a `ui-meter` element holding its visible `label` in a `ui-meter__label` slot when one is given, its value text in a `ui-meter__value` slot, and a `ui-meter__track` holding a `ui-meter__fill`.

Implementation: `src/components/meter/meter.tsx`
Verification: `src/components/meter/meter.test.tsx`, `e2e/meter.spec.ts`

### UIC-METER-1.2 - Fill and value text

The fill's inline `width` shall be the value's percentage of the range. `showValueLabel={false}` hides the visible value text while the meter keeps its accessible value.

Implementation: `src/components/meter/meter.tsx`
Verification: `src/components/meter/meter.test.tsx`, `e2e/meter.spec.ts`

### UIC-METER-1.3 - Value text

The value text shall default to a locale-formatted percentage; `formatOptions` changes the format (a unit such as gigabytes formats the value itself), and `valueLabel` replaces the text, both visibly and as `aria-valuetext`.

Implementation: `src/components/meter/meter.tsx`
Verification: `src/components/meter/meter.test.tsx`, `e2e/meter.spec.ts`

### UIC-METER-1.4 - Truthful values

The meter shall bound its range as a progress bar does ([UIC-PROGRESS-BAR-1.5](PROGRESS-BAR.md#uic-progress-bar-15---truthful-values)): `minValue` defaults to 0 and `maxValue` to 100, non-finite numbers fall back to the minimum, the maximum is never below the minimum, and the value stays inside the range. An empty range shows an empty fill.

Implementation: `src/components/meter/meter.tsx`, `src/components/progress-bar/progress-bar.tsx`
Verification: `src/components/meter/meter.test.tsx`

### UIC-METER-1.5 - Sizes

`size` shall publish `data-size`: `sm`, `md` (the default) or `lg`. The reference sheet draws 4, 6 and 8 pixel tracks, as for a progress bar.

Implementation: `src/components/meter/meter.tsx`, `labs/reference/meter.css`
Verification: `src/components/meter/meter.test.tsx`, `e2e/meter.spec.ts`

### UIC-METER-1.6 - Tone

`tone` shall publish `data-tone`: `neutral` (no judgement), `success`, `warning` or `danger`. Without `tone` the meter publishes the tone of its thresholds ([UIC-METER-1.7](#uic-meter-17---thresholds)), or `neutral` when it has none. The tone is never the only signal: the label or value text states what the value means.

Implementation: `src/components/meter/meter.tsx`, `labs/reference/meter.css`
Verification: `src/components/meter/meter.test.tsx`, `e2e/meter.spec.ts`

### UIC-METER-1.7 - Thresholds

`low`, `high` and `optimum` shall split the range into regions as the HTML `meter` element does: `low` (the minimum by default, bounded to the range) ends the low region, `high` (the maximum by default, bounded between `low` and the maximum) starts the high region, and `optimum` (the middle by default, bounded to the range) marks the best region. A value in the optimum's region is `success`. With the optimum between the boundaries, a value below `low` or above `high` is `warning`; with the optimum below `low` or above `high`, a value between the boundaries is `warning` and one in the opposite region `danger`. A value on a boundary counts as between them.

Implementation: `src/components/meter/meter.tsx`
Verification: `src/components/meter/meter.test.tsx`, `e2e/meter.spec.ts`

### UIC-METER-1.8 - Hooks and caller attributes

`Meter` shall carry the hooks below, append the caller's `className`, forward `id`, `ref` and caller `data-*` attributes to its root, and take `render`, typed `ElementRender<'div', MeterRenderState>` (`percentage` and `valueText`); caller attributes never replace a hook attribute.

Implementation: `src/components/meter/meter.tsx`
Verification: `src/components/meter/meter.test.tsx`

## UIC-METER-2 - Accessibility

### UIC-METER-2.1 - Role and name

The root shall have `role="meter"`, be named by its visible `label` or by `aria-label` or `aria-labelledby`, and expose `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and its value text as `aria-valuetext`.

Implementation: `src/components/meter/meter.tsx`
Verification: `src/components/meter/meter.test.tsx`, `e2e/meter.spec.ts`

### UIC-METER-2.2 - Read-only output

A meter shall take no tab stop and handle no keys or pointer input; it announces nothing on its own, so a host whose value should be heard places it in its own status region.

Implementation: `src/components/meter/meter.tsx`
Verification: `src/components/meter/meter.test.tsx`, `e2e/meter.spec.ts`

## Hooks

| Hook              | Kind      | Values                                    | Description                                         |
| ----------------- | --------- | ----------------------------------------- | --------------------------------------------------- |
| `ui-meter`        | root      |                                           | The meter (`role="meter"`).                         |
| `ui-meter__label` | slot      |                                           | The visible label, when `label` is set.             |
| `ui-meter__value` | slot      |                                           | The visible value text, when shown.                 |
| `ui-meter__track` | slot      |                                           | The track.                                          |
| `ui-meter__fill`  | slot      |                                           | The fill; inline `width` is the value's percentage. |
| `data-size`       | attribute | `sm`, `md`, `lg`                          | Track thickness.                                    |
| `data-tone`       | attribute | `neutral`, `success`, `warning`, `danger` | How good the value is.                              |
