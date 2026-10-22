# Segmented Bar

`SegmentedBar` splits one bar into proportional segments, such as passed, failed and skipped checks, covered and uncovered requirements, or space used by kind of file. It shares the [Meter](METER.md) and [Progress Bar](PROGRESS-BAR.md) vocabulary (`label`, `track`, `data-size`, `data-tone`), so a host draws all three as one family. The bar itself is decorative: a list of every segment's label, count and share carries its meaning, read only by assistive technology or shown as a legend.

## UIC-SEGMENTED-BAR-1 - Segmented bar

### UIC-SEGMENTED-BAR-1.1 - Parts

`SegmentedBar` shall render a `ui-segmented-bar` element holding its visible `label` in a `ui-segmented-bar__label` slot when one is given, the total in a `ui-segmented-bar__total` slot, a `ui-segmented-bar__track` holding one `ui-segmented-bar__segment` per segment with a share, and a `ui-segmented-bar__legend` list.

Implementation: `src/components/segmented-bar/segmented-bar.tsx`
Verification: `src/components/segmented-bar/segmented-bar.test.tsx`, `e2e/segmented-bar.spec.ts`

### UIC-SEGMENTED-BAR-1.2 - Shares

Each segment in `segments` (`id`, `label`, `value`, optional `tone`) shall take the inline `width` of its share of the whole, in its given order. The whole is `total` when it is larger than the sum of the segments, leaving the rest of the track empty (40 of 100 checks run), and otherwise the sum. A value that is not a finite, positive number counts as 0; a segment with no share draws no track segment but keeps its legend entry, and an empty whole draws an empty track with every share at 0%. Finite amounts whose sum exceeds the numeric range shall retain their proportions, while the unrepresentable total remains infinity; a finite explicit total cannot reduce that sum.

Implementation: `src/components/segmented-bar/segmented-bar.tsx`, `src/utils/resolve-amount-shares.ts`
Verification: `src/components/segmented-bar/segmented-bar.test.tsx`, `src/utils/resolve-amount-shares.test.ts`, `e2e/segmented-bar.spec.ts`

### UIC-SEGMENTED-BAR-1.3 - Tones

Each segment shall publish its `tone` as `data-tone` on its track segment and its legend entry: `neutral` (the default), `info`, `success`, `warning` or `danger`. The tone is never the only signal: the legend list names every segment. Segments of one tone stay distinct by their order, which a stylesheet can select.

Implementation: `src/components/segmented-bar/segmented-bar.tsx`, `labs/reference/segmented-bar.css`
Verification: `src/components/segmented-bar/segmented-bar.test.tsx`, `e2e/segmented-bar.spec.ts`

### UIC-SEGMENTED-BAR-1.4 - Legend

The legend list shall hold one `ui-segmented-bar__item` per segment with a decorative `ui-segmented-bar__swatch`, the segment's label in `ui-segmented-bar__item-label`, its count in `ui-segmented-bar__item-value` and its share of the whole as a locale percentage with at most one decimal in `ui-segmented-bar__item-share`. With `showLegend` the list is visible; by default it is visually hidden and only assistive technology reads it.

Implementation: `src/components/segmented-bar/segmented-bar.tsx`
Verification: `src/components/segmented-bar/segmented-bar.test.tsx`, `e2e/segmented-bar.spec.ts`

### UIC-SEGMENTED-BAR-1.5 - Total and formats

The total slot shall read the whole through the provider's `totalCount` string (`30 total`); `showTotal={false}` hides it. Counts and the total are formatted for the locale with `formatOptions` (`Intl.NumberFormatOptions`, such as a unit).

Implementation: `src/components/segmented-bar/segmented-bar.tsx`, `src/core/common-strings.ts`
Verification: `src/components/segmented-bar/segmented-bar.test.tsx`, `e2e/segmented-bar.spec.ts`

### UIC-SEGMENTED-BAR-1.6 - Sizes

`size` shall publish `data-size`: `sm`, `md` (the default) or `lg`. The reference sheet draws 4, 8 and 12 pixel tracks.

Implementation: `src/components/segmented-bar/segmented-bar.tsx`, `labs/reference/segmented-bar.css`
Verification: `src/components/segmented-bar/segmented-bar.test.tsx`, `e2e/segmented-bar.spec.ts`

### UIC-SEGMENTED-BAR-1.7 - Hooks and caller attributes

`SegmentedBar` shall carry the hooks below, append the caller's `className`, and forward `id`, `ref` and caller `data-*` attributes to its root; caller attributes never replace a hook attribute.

Implementation: `src/components/segmented-bar/segmented-bar.tsx`
Verification: `src/components/segmented-bar/segmented-bar.test.tsx`

## UIC-SEGMENTED-BAR-2 - Accessibility

### UIC-SEGMENTED-BAR-2.1 - Named group with a summary list

The root shall be a group (`role="group"`) named by its visible `label`, or by `aria-label` or `aria-labelledby`, which take precedence. The track is hidden from assistive technology (`aria-hidden="true"`); the legend list, visible or not, reads each segment as its label, count and share.

Implementation: `src/components/segmented-bar/segmented-bar.tsx`
Verification: `src/components/segmented-bar/segmented-bar.test.tsx`, `e2e/segmented-bar.spec.ts`

### UIC-SEGMENTED-BAR-2.2 - Read-only output

A segmented bar shall take no tab stop and handle no keys or pointer input.

Implementation: `src/components/segmented-bar/segmented-bar.tsx`
Verification: `src/components/segmented-bar/segmented-bar.test.tsx`

## Hooks

| Hook                           | Kind      | Values                                            | Description                                              |
| ------------------------------ | --------- | ------------------------------------------------- | -------------------------------------------------------- |
| `ui-segmented-bar`             | root      |                                                   | The group (`role="group"`).                              |
| `ui-segmented-bar__label`      | slot      |                                                   | The visible label, when `label` is set.                  |
| `ui-segmented-bar__total`      | slot      |                                                   | The total, when shown.                                   |
| `ui-segmented-bar__track`      | slot      |                                                   | The decorative track.                                    |
| `ui-segmented-bar__segment`    | slot      |                                                   | One segment; inline `width` is its share of the whole.   |
| `ui-segmented-bar__legend`     | slot      |                                                   | The list of segments, visible with `showLegend`.         |
| `ui-segmented-bar__item`       | slot      |                                                   | One segment's entry in the list.                         |
| `ui-segmented-bar__swatch`     | slot      |                                                   | The entry's decorative colour mark.                      |
| `ui-segmented-bar__item-label` | slot      |                                                   | The segment's label.                                     |
| `ui-segmented-bar__item-value` | slot      |                                                   | The segment's count.                                     |
| `ui-segmented-bar__item-share` | slot      |                                                   | The segment's share of the whole, as a percentage.       |
| `data-size`                    | attribute | `sm`, `md`, `lg`                                  | Track thickness.                                         |
| `data-tone`                    | attribute | `neutral`, `info`, `success`, `warning`, `danger` | A segment's tone, on its track segment and legend entry. |
