# Segmented Bar

`SegmentedBar` splits one bar into proportional segments, such as passed, failed and skipped checks, covered and uncovered requirements, or space used by kind of file. It shares the [ProgressBar](PROGRESS-BAR.md) vocabulary (`label`, `track`, `data-size`, `data-tone`), so a host draws both as one family. The bar itself is decorative: a list of every segment's label, count and share carries its meaning, read only by assistive technology or shown as a legend.

## UIC-SEGMENTED-BAR-1 - Segmented bar

### UIC-SEGMENTED-BAR-1.1 - Parts

`SegmentedBar` shall render a `ui-segmented-bar` element holding its visible `label` in a `ui-segmented-bar__label` slot when one is given, the total in a `ui-segmented-bar__total` slot, a `ui-segmented-bar__track` holding one `ui-segmented-bar__segment` per segment with a share, and a `ui-segmented-bar__legend` list. A `label` that renders nothing (`null`, `undefined`, a boolean or an empty string) draws no label slot, and the group is named by `aria-label` or `aria-labelledby` instead; `0` draws one.

Numeric and text IDs, such as `1` and `'1'`, identify distinct entries; removing one preserves the other entry's rendered identity.

Implementation: `src/components/segmented-bar/segmented-bar.tsx`
Verification: `src/components/segmented-bar/segmented-bar.test.tsx`, `e2e/segmented-bar.spec.ts`

### UIC-SEGMENTED-BAR-1.2 - Shares

Each segment in `segments` (`id`, `label`, `value`, optional `tone`) shall take the inline `width` of its share of the whole, in its given order. The whole is `total` when it is larger than the sum of the segments, leaving the rest of the track empty (40 of 100 checks run), and otherwise the sum. A value that is not a finite, positive number counts as 0; a segment with no share draws no track segment but keeps its legend entry, and an empty whole draws an empty track with every share at 0%. Finite amounts whose sum exceeds the numeric range shall retain their proportions, while the unrepresentable total remains infinity; a finite explicit total cannot reduce that sum. The reference sheet keeps every share exact and the whole distribution inside the track at any count or width: it adds no gaps or minimum widths, and draws each separator inside its segment, at most a third of the segment wide.

Implementation: `src/components/segmented-bar/segmented-bar.tsx`, `src/components/segmented-bar/segmented-layout.ts`, `src/utils/resolve-amount-shares.ts`
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

Implementation: `src/components/segmented-bar/segmented-bar.tsx`, `src/core/strings/common.ts`
Verification: `src/components/segmented-bar/segmented-bar.test.tsx`, `e2e/segmented-bar.spec.ts`

### UIC-SEGMENTED-BAR-1.6 - Sizes

`size` shall publish `data-size`: `sm`, `md` (the default), `lg`, `xl`, `2xl` or `3xl`. `SegmentedBarSize` is the bar's own type: `xl`, `2xl` and `3xl` go past the shared `Size` scale for a bar or ring shown as a figure, and no other component takes them. The reference sheet draws 4, 8, 12, 16, 20 and 24 pixel tracks and 16, 24, 32, 48, 64 and 96 pixel rings (donut and pie strokes scale with the ring), and at `xl` and above draws the label, total and legend larger, the `3xl` label larger still.

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

## UIC-SEGMENTED-BAR-3 - Unified options

### UIC-SEGMENTED-BAR-3.1 - Circular shares

shape shall select linear (default), donut or pie. Both circular forms draw the same ordered shares from twelve oclock clockwise, keep any remainder empty, retain the accessible summary and take every size step of [UIC-SEGMENTED-BAR-1.6](#uic-segmented-bar-16---sizes): `sm`, `md` and `lg` match circular progress, and `xl`, `2xl` and `3xl` continue past it.

Implementation: `src/components/segmented-bar/segmented-bar.tsx`
Verification: `src/components/segmented-bar/segmented-bar.test.tsx`, `e2e/unified-options.spec.ts`

## UIC-SEGMENTED-BAR-4 - Entry animation

### UIC-SEGMENTED-BAR-4.1 - One sequence on first visibility

`animated` shall opt in to one sequential fill for linear, donut and pie, false by default (`data-animated` on the root while enabled). The decorative track or ring shall publish `data-animation-state`: `waiting` until it first intersects the viewport, `running` while its CSS animations run, then `complete`. Ordinary rerenders, value updates and later viewport entries shall not replay it. Remounting the bar starts a new sequence. With no intersection observer or no CSS animations, the drawing shall complete immediately; cancellation also completes it. The component emits hooks and geometry only; the host stylesheet chooses the motion.

Implementation: `src/components/segmented-bar/segmented-bar.tsx`, `src/components/segmented-bar/segmented-track.tsx`, `src/components/segmented-bar/use-segmented-animation.ts`
Verification: `src/components/segmented-bar/segmented-animation.test.tsx`, `e2e/segmented-animation.spec.ts`

### UIC-SEGMENTED-BAR-4.2 - Ordered proportional fill

The component shall expose unitless computed percentages as `--ui-segment-share` and `--ui-segment-start` on each drawn segment, and their sum as `--ui-segment-total` on the track or ring. Zero shares draw no segment and consume no time. The reference sheet shall fill segments in order as one eased sweep over its 0.6-second duration (half the shared loop duration, set on the bar alone): the track or ring animates a progress from 0 to 1 with an ease-in-out curve (`cubic-bezier(0.65, 0, 0.35, 1)`), so the sweep starts slowly, speeds up through the middle and settles at the end, and each segment fills the part of the progress between its start and its end as shares of the drawn total. A segment therefore takes time in proportion to its share at the sweep's speed when it is drawn, the next one starts exactly where it ends, with no pause or overlap, and the ease applies once to the whole drawing, not to each segment. Linear segments grow from inline start; donut and pie arcs draw clockwise from the top. Any remainder stays empty. Labels, totals and the accessible legend shall hold their final values throughout. With reduced motion the reference sheet shall show the final drawing immediately.

Implementation: `src/components/segmented-bar/segmented-layout.ts`, `src/components/segmented-bar/segmented-track.tsx`, `src/components/segmented-bar/segmented-circle.tsx`, `labs/reference/segmented-bar.css`
Verification: `src/components/segmented-bar/segmented-animation.test.tsx`, `e2e/segmented-animation.spec.ts`

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
| `data-size`                    | attribute | `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`              | Track thickness or ring diameter.                        |
| `data-tone`                    | attribute | `neutral`, `info`, `success`, `warning`, `danger` | A segment's tone, on its track segment and legend entry. |
| `ui-segmented-bar__ring`       | slot      |                                                   | The SVG of a donut or pie.                               |
| `data-shape`                   | attribute | `linear`, `donut`, `pie`                          | Share appearance.                                        |
| `data-animated`                | state     | `true`                                            | Entry animation is enabled on the root.                  |
| `data-animation-state`         | attribute | `waiting`, `running`, `complete`                  | One-time animation phase, on the track or ring.          |
| `--ui-segment-share`           | property  |                                                   | Unitless percentage of the whole drawn by a segment.     |
| `--ui-segment-start`           | property  |                                                   | Unitless cumulative percentage before a segment.         |
| `--ui-segment-total`           | property  |                                                   | Unitless sum of drawn percentages, on the track or ring. |
