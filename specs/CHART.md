# Chart

The chart family draws data as accessible SVG with no charting dependency, on the library's scales ([SCALES.md](SCALES.md)). `BarChart`, `LineChart` and `DonutChart` draw complete charts; `Chart` is the frame they share, which a host also wraps around its own drawing; `ChartAxis` and `ChartLegend` are the axis and the legend they draw with. Every chart is a named figure described by a text summary, every drawn value is a named, focusable point with a tooltip, and a toggle shows the values as a table instead. Series colours are colour slots: each series publishes its position (`data-series`) and an optional tone (`data-tone`), and the host stylesheet maps them to colours; the library never writes a colour.

## UIC-CHART-1 - Chart frame

### UIC-CHART-1.1 - Parts

`Chart` shall render a `ui-chart` element holding a `ui-chart__header` with the visible `label` in a `ui-chart__title` slot, when given, and the `ui-chart__view-toggle`; then the summary in a `ui-chart__summary` slot; then, in the chart view, the `legend` (such as a [ChartLegend](#uic-chart-2---legend)) and the drawing (`children`) in a `ui-chart__body` slot. A `label` that renders nothing (`null`, `undefined`, a boolean or an empty string) draws no title, and the figure is named by `aria-label` or `aria-labelledby` instead; `0` draws a title.

Implementation: `src/components/chart/chart.tsx`
Verification: `src/components/chart/chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-1.2 - Summary

`summary` shall describe the chart (`aria-describedby`), before any `aria-describedby` of the caller's. By default the summary is visually hidden and only assistive technology reads it; `showSummary` shows it.

Implementation: `src/components/chart/chart.tsx`
Verification: `src/components/chart/chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-1.3 - Table view

The view toggle shall be a toggle button named by the provider's `showAsTable` string beside the decorative built-in `table` glyph. Pressing it switches between the chart view and the table view and publishes `data-view` (`chart` or `table`) on the root. The view is controlled with `view` and `onViewChange` or uncontrolled from `defaultView` (`chart` by default). The table view replaces the legend and the drawing with a [Prose Table](PROSE-TABLE.md) carrying `ui-chart__table`, named by the chart's name, whose `table.columns` head its columns and whose `table.rows` fill its rows, the first cell of each row heading it. `table` may be a function returning them, which the chart calls only while the table view shows.

Implementation: `src/components/chart/chart.tsx`
Verification: `src/components/chart/chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-1.4 - Hooks and caller attributes

`Chart` and every chart built on it shall carry the hooks below, append the caller's `className`, and forward `id`, `ref` and caller `data-*` attributes to the root; caller attributes never replace a hook attribute. `isEmpty` publishes `data-empty` on the root. `BarChart`, `LineChart` and `DonutChart` render `Chart` with their own root class (`ui-bar-chart`, `ui-line-chart`, `ui-donut-chart`) alongside `ui-chart`.

Implementation: `src/components/chart/chart.tsx`, `src/components/chart/bar-chart.tsx`, `src/components/chart/line-chart.tsx`, `src/components/chart/donut-chart.tsx`
Verification: `src/components/chart/chart.test.tsx`, `src/components/chart/bar-chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-1.5 - Derivations

`BarChart` and `LineChart` shall build their table only while the table view shows, from every series (hidden ones included) as they are at that render, so a chart that is drawn never orders or writes table cells. Their value scale, layout and placed references are kept while their own inputs are unchanged (the shown series, the box size, the value bounds, the format options and formatters, the time zone and the locale), and the drawing skips its render when none of its inputs changed, as when only the summary, the label or the legend's presentation does. A changed input, including a new locale, time zone, format option or formatter, derives them again; nothing is cached beyond the inputs of the latest render.

Implementation: `src/components/chart/chart.tsx`, `src/components/chart/bar-chart-model.ts`, `src/components/chart/line-chart-model.ts`, `src/components/chart/chart-references.tsx`, `src/components/chart/chart-legend.tsx`
Verification: `src/components/chart/chart-derivation.test.tsx`

## UIC-CHART-2 - Legend

### UIC-CHART-2.1 - Series toggles

`ChartLegend` shall render a `ui-chart-legend` toolbar named by the provider's `chartLegend` string (or the caller's `aria-label` or `aria-labelledby`) holding one `ui-chart-legend__item` toggle button per entry of `items`, with a decorative `ui-chart-legend__swatch` and the item's label in `ui-chart-legend__label`. Each item and its swatch publish `data-series` (the item's position in `items`) and `data-tone` when the item has a tone. An item is pressed (`aria-pressed`, `data-selected`) while its series is shown; pressing it hides or shows the series. Numeric and text series IDs with the same spelling shall remain distinct, including after reordering. The hidden series are controlled with `hiddenKeys` and `onHiddenKeysChange` or uncontrolled from `defaultHiddenKeys`. The charts draw a legend when there is more than one series or while one of their series is hidden (bar and line), so a series left hidden when the others go can still be shown again, or always (donut); `showLegend` overrides that, and their own `hiddenKeys`, `defaultHiddenKeys` and `onHiddenKeysChange` control which series they draw.

Implementation: `src/components/chart/chart-legend.tsx`, `src/components/chart/bar-chart.tsx`, `src/components/chart/line-chart.tsx`, `src/components/chart/donut-chart.tsx`
Verification: `src/components/chart/chart.test.tsx`, `src/components/chart/bar-chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-2.2 - One series stays shown

The legend shall keep at least one series shown: pressing the item of the only shown series leaves it shown.

Implementation: `src/components/chart/chart-legend.tsx`
Verification: `src/components/chart/chart.test.tsx`

### UIC-CHART-2.3 - Keyboard

The legend shall take one tab stop, and the arrow keys move focus between its items, as a toolbar does.

Implementation: `src/components/chart/chart-legend.tsx`
Verification: `src/components/chart/chart.test.tsx`, `e2e/chart.spec.ts`

## UIC-CHART-3 - Axis

### UIC-CHART-3.1 - Parts

`ChartAxis` shall render a `ui-chart-axis` SVG group, hidden from assistive technology, publishing `position` in `data-position`: `bottom` draws a `ui-chart-axis__line` along x at y `offset` from one end of `range` to the other, and `left` along y at x `offset`. For each of `ticks` (from a library scale) it draws a `ui-chart-axis__tick` mark 4 pixels outward and a `ui-chart-axis__label` text 8 pixels outward, centred under a bottom axis and end-aligned beside a left one. Numeric and text tick values with the same spelling retain distinct marks, labels and grid lines when reordered.

Implementation: `src/components/chart/chart-axis.tsx`
Verification: `src/components/chart/chart.test.tsx`

### UIC-CHART-3.2 - Grid lines

With `gridLength`, the axis shall also draw a `ui-chart-axis__grid` line from each tick across the drawing, that long: up from a bottom axis and to the right of a left one.

Implementation: `src/components/chart/chart-axis.tsx`
Verification: `src/components/chart/chart.test.tsx`, `e2e/chart.spec.ts`

## UIC-CHART-4 - Drawn values

### UIC-CHART-4.1 - Colour slots

Each drawn value and series mark (bars, lines, areas, points and slices, their legend items and the tooltip's swatch) shall publish `data-series`, the position of its series in the chart's `series` (or `segments`), which stays the same when other series are hidden, and `data-tone` when the series has a `tone` (`neutral`, `info`, `success`, `warning` or `danger`). The library sets no colour.

Implementation: `src/components/chart/bar-chart.tsx`, `src/components/chart/line-chart.tsx`, `src/components/chart/donut-chart.tsx`, `src/components/chart/chart-points.tsx`
Verification: `src/components/chart/bar-chart.test.tsx`, `src/components/chart/line-chart.test.tsx`, `src/components/chart/donut-chart.test.tsx`

### UIC-CHART-4.2 - Named values

Each drawn value shall be an image (`role="img"`) named by the provider's `chartValue` string from its series' label, its category or x value and its formatted value (`Apples, March: 42`), or, in a donut, by `donutSegment` (`Apples: 60, 50%`). Values are formatted for the locale with `formatOptions`. The drawing (`ui-chart__plot`) is an SVG group.

Implementation: `src/components/chart/bar-chart.tsx`, `src/components/chart/line-chart.tsx`, `src/components/chart/donut-chart.tsx`
Verification: `src/components/chart/bar-chart.test.tsx`, `src/components/chart/line-chart.test.tsx`, `src/components/chart/donut-chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-4.3 - Keyboard

The drawn values shall take one tab stop, on the first value or the last one focused. The left and right arrow keys move focus to the previous and next value of the same series (the up and down arrow keys for a horizontal bar chart, whose categories run down), the up and down arrow keys (left and right for a horizontal bar chart) move to the value of the previous and next drawn series nearest along the shared axis (a bar's category; a line point's read x, a number or a time, so unevenly sampled series and series over different ranges meet at the same x rather than at the same position), and Home and End move to the first and last value of the series. A donut's slices form one series.

When two points in the target series are equally close, the first in input order wins.

Each drawn value is identified by its series' typed `id` (numeric and text ids of one spelling stay apart) and its place along the series: a bar by its category, counting repeated category names in order, a line point by its read x, counting repeated coordinates in order, and a donut slice by its segment's `id` alone. The tab stop, focus, the active value and its tooltip stay on that value while series or segments reorder or values are added or removed elsewhere, while `data-series` keeps following the series' current position (its colour slot). When the value goes, the tab stop falls back to the first value and focus is not moved.

Implementation: `src/components/chart/chart-points.tsx`
Verification: `src/components/chart/chart-points.test.tsx`, `src/components/chart/bar-chart.test.tsx`, `src/components/chart/line-chart.test.tsx`, `src/components/chart/donut-chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-4.4 - Tooltip

Hovering or focusing a drawn value shall publish `data-active` on it and open a [Tooltip](TOOLTIP.md) panel pointing at it, carrying `ui-chart__tooltip`, that shows the value's category or x value in `ui-chart__tooltip-title` (not for a donut), a `ui-chart__tooltip-swatch` with the series' colour slot, the series' label in `ui-chart__tooltip-label` and the formatted value in `ui-chart__tooltip-value` (with its share, for a donut, joined by the provider's `donutValue` string: `60 (50%)`). The tooltip closes when the pointer leaves, when focus leaves, and on Escape wherever focus is (a tooltip opened by hover included); that Escape goes no further, so it does not also close a surface around the chart. A composing Escape (cancelling an input method candidate in a field anywhere on the page) belongs to the input method: it leaves the tooltip open and goes on. When the active value leaves the chart (its series hidden, its value made unreadable or removed), its tooltip closes and gives up its Escape and the element it pointed at; no empty tooltip stays, and the value does not reopen it if it comes back.

Implementation: `src/components/chart/chart-points.tsx`, `src/components/chart/bar-chart.tsx`, `src/components/chart/line-chart.tsx`, `src/components/chart/donut-chart.tsx`
Verification: `src/components/chart/bar-chart.test.tsx`, `src/components/chart/donut-chart.test.tsx`, `src/components/chart/chart-tooltip.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-4.5 - Generated summary and no data

Unless the caller gives a `summary`, a bar or line chart shall be summarised by the provider's `chartSummary` string from the number of drawn series and values and the lowest and highest drawn values (`2 series, 12 values, from 3 to 48`), and a donut by `donutSummary` from its total and its largest drawn segment with its share. A chart with no drawn value passes `isEmpty` to its `Chart` frame, which publishes `data-empty` on its root over any caller attribute of that name, draws no plot, and shows the provider's `noData` string in a `ui-chart__empty` slot, which is also its summary.

Implementation: `src/components/chart/chart-summary.ts`, `src/components/chart/bar-chart.tsx`, `src/components/chart/line-chart.tsx`, `src/components/chart/donut-chart.tsx`, `src/core/strings/dashboard.ts`
Verification: `src/components/chart/bar-chart.test.tsx`, `src/components/chart/line-chart.test.tsx`, `src/components/chart/donut-chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-4.6 - Size

A bar or line chart shall draw `height` pixels tall (240 by default) and as wide as its root's measured content width (480 pixels before it is measured). The plotted area leaves room for the axis labels: on the left as wide as the widest left-axis label (measured in the root's font, or estimated at 7 pixels a character) plus 12 pixels, 24 pixels at the bottom, 8 at the top, and 16 (bar) or 24 (line) on the right. A donut draws a `diameter` pixel square (160 by default).

Implementation: `src/components/chart/use-chart-box.ts`, `src/components/chart/chart-layout.ts`, `src/components/chart/bar-chart.tsx`, `src/components/chart/line-chart.tsx`, `src/components/chart/donut-chart.tsx`
Verification: `src/components/chart/bar-chart.test.tsx`, `src/components/chart/donut-chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-4.7 - Value formatters and custom tooltips

`BarChart` and `LineChart` shall write each drawn value with `formatValue` when given, called with the value's datum: its series' `seriesId`, `seriesLabel` and position (`series`), where it sits (`at`: a bar's category, a line point's `x` as given) and its finite `value`; the text names the value, shows in its tooltip and fills its table cell, so per-series units and precision stay together. A missing or unreadable value never reaches it. `formatAxisValue` writes the value axis's tick labels instead, such as compact numbers, without changing those values' text. `renderTooltip` replaces the tooltip's content for the hovered or focused value, called with the same datum, the value's text (`value`) and its place's text (`at`) whether the pointer or the keyboard made it active; content of `null` or `undefined` keeps the default title, swatch, label and value. The tooltip stays a plain, non-interactive tooltip that closes as [UIC-CHART-4.4](#uic-chart-44---tooltip) says, and assistive technology reads the value's name, not the custom content. Formatters run at each render, so a change of locale, time zone or callback updates the text.

Implementation: `src/components/chart/chart-format.ts`, `src/components/chart/chart-points.tsx`, `src/components/chart/bar-chart.tsx`, `src/components/chart/bar-chart-model.ts`, `src/components/chart/line-chart.tsx`, `src/components/chart/line-chart-model.ts`, `src/components/chart/line-table.ts`
Verification: `src/components/chart/chart-format.test.tsx`, `e2e/chart.spec.ts`

## UIC-CHART-5 - Bar chart

### UIC-CHART-5.1 - Bars

`BarChart` shall draw one `ui-bar-chart__bar` rectangle per finite value of each shown series (`series`, each with one value per entry of `categories`), in bands laid out by the band scale, one per category. `layout` publishes `data-layout`: `grouped` (the default) splits each category's band between the shown series, side by side, with a tenth of the band between bars; `stacked` piles a category's values into one bar, positive values upward from zero and negative values downward, in series order. Values that are not finite numbers draw no bar. Finite values whose stack would pass the largest number still keep their proportions and finite coordinates: the chart sums them divided by a power of two, and labels the value axis in scientific notation (or `formatOptions`), where a tick past the largest number reads as the format's infinity (`∞`).

Implementation: `src/components/chart/bar-chart.tsx`, `src/components/chart/bar-geometry.ts`, `src/utils/band-scale.ts`
Verification: `src/components/chart/bar-geometry.test.ts`, `src/components/chart/bar-chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-5.2 - Orientation and axes

`orientation` shall publish `data-orientation`: `vertical` (the default) draws bars rising from a bottom category axis against a left value axis; `horizontal` draws bars growing from a left category axis against a bottom value axis. The value axis runs over a nice domain that always includes zero, about one tick every 40 pixels (vertical) or 80 pixels (horizontal), labelled for the locale with `formatOptions`, with grid lines across the plot.

Implementation: `src/components/chart/bar-chart.tsx`, `src/components/chart/bar-geometry.ts`
Verification: `src/components/chart/bar-geometry.test.ts`, `src/components/chart/bar-chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-5.3 - Table

The bar chart's table shall have a column of categories, headed by `categoryLabel` (the provider's `chartCategory` string by default), then one column per series, hidden ones included, with each formatted value, or nothing for a value that is not a finite number.

Implementation: `src/components/chart/bar-chart.tsx`
Verification: `src/components/chart/bar-chart.test.tsx`

## UIC-CHART-6 - Line chart

### UIC-CHART-6.1 - X axis

`LineChart` shall place each point of its series (`points` of `{ x, y }`) along x by `x`: ISO 8601 dates or date-times make a time axis read in `timeZone` (the provider's by default, else the browser's once hydrated and UTC before) with calendar ticks from the time scale, and numbers a linear axis; the first point decides which, and points whose `x` cannot be read are left out. The axis spans the lowest to the highest `x`, about one tick every 80 pixels. In names, the tooltip and the table, dates read as medium dates (with the time for a date-time) and numbers in the locale. Axis ticks and those dates write their spaces as plain spaces ([UIC-INTL-FORMAT-1.3](INTL-FORMAT.md)), so a server-rendered axis hydrates unchanged.

The x axis shall read ISO dates and date-times as the time scale does, so its ticks and the points agree.

Implementation: `src/components/chart/line-chart.tsx`, `src/components/chart/line-x-axis.ts`, `src/utils/time-scale.ts`
Verification: `src/components/chart/line-geometry.test.ts`, `src/components/chart/line-chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-6.2 - Lines, areas and points

Each shown series shall draw a `ui-line-chart__line` path (with no fill) through its points in x order and a `ui-line-chart__point` circle on each finite value. A missing value ([UIC-CHART-6.5](#uic-chart-65---missing-values)) breaks the line, which resumes at the next one. `variant` publishes `data-variant`: `line` (the default) or `area`, which also fills a `ui-line-chart__area` under each line, toward zero or the edge nearest it.

Implementation: `src/components/chart/line-chart.tsx`, `src/components/chart/line-geometry.ts`
Verification: `src/components/chart/line-geometry.test.ts`, `src/components/chart/line-chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-6.3 - Value axis

The value axis shall run from `minValue` to `maxValue` when given, keeping values beyond them at the edges, and otherwise over a nice domain that includes zero and every drawn value (a value whose x the axis cannot read is not drawn and does not stretch the axis; a value that is not a finite number at a readable x still breaks the line), about one tick every 40 pixels, with grid lines across the plot.

The domain comes from the finite values alone, however many there are (a series of 200 000 values draws).

Implementation: `src/utils/summarize-numbers.ts`, `src/components/chart/line-geometry.ts`
Verification: `src/components/chart/line-geometry.test.ts`

### UIC-CHART-6.4 - Table

The line chart's table shall have one row per distinct x value of any series, in x order, headed by its formatted x value under `categoryLabel` (the provider's `chartCategory` string by default), then each series' formatted value at that x, or nothing. The table reads coordinates from every series, hidden ones included, so it keeps its rows (numbers or dates) whichever series are drawn, also with every series hidden.

A repeated coordinate shall use its first point in each series, leaving the cell blank if that point has no finite value.

Implementation: `src/components/chart/line-table.ts`, `src/components/chart/line-chart.tsx`
Verification: `src/components/chart/line-table.test.ts`, `src/components/chart/line-chart.test.tsx`

### UIC-CHART-6.5 - Missing values

A point's `y` may be `null`, a missing value, as JSON writes one; a `y` that is not a finite number is missing too. A missing value shall draw no point and break the line and the area there (a run of missing values makes one break), unless `connectsMissing` draws them straight across it; either way it is never read as zero: it does not stretch the value axis, count in the generated summary, take keyboard focus (the arrow keys move from the value before it to the value after it, which keep their identities) or show a tooltip. Its x still counts toward the x axis and the table, whose cell for it is blank. A series of only missing values draws nothing, and a chart with no other values shows its no-data state. No missing value produces SVG coordinates that are not numbers.

Implementation: `src/components/chart/line-geometry.ts`, `src/components/chart/line-table.ts`, `src/components/chart/line-chart.tsx`
Verification: `src/components/chart/line-geometry.test.ts`, `src/components/chart/line-chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-6.6 - Downsampling

With `downsample`, each series shall draw, of each run of values between breaks, only the first, lowest, highest and last value in each pixel column of the plot, in x order: values sharing an x share a column, and the line keeps every column's extremes, each run's ends and every break. Kept values are real points, never averaged or moved, so each is a named, focusable point with its own tooltip, and the arrow keys step through them; the summary counts every drawn value and the table lists every value. Downsampling is deterministic, recomputes when the series or the box size changes, never changes the caller's arrays, and is off by default, when every value draws as a point. Measured in jsdom on a 480-pixel chart, 100 000 values draw about 1 600 points instead of 100 000, in about a sixteenth of the time and an eighth of the memory.

Implementation: `src/components/chart/line-sampling.ts`, `src/components/chart/line-geometry.ts`, `src/components/chart/line-chart.tsx`
Verification: `src/components/chart/line-sampling.test.tsx`, `e2e/chart.spec.ts`

## UIC-CHART-7 - Donut chart

### UIC-CHART-7.1 - Slices and total

`DonutChart` shall draw one `ui-donut-chart__slice` ring segment per shown segment with a finite, positive `value`, clockwise from the top, each spanning its share of the shown total, around a hole of 60% of the radius, and the total in the middle through the provider's `totalCount` string in a `ui-donut-chart__total` text hidden from assistive technology. Finite amounts whose sum exceeds the numeric range shall retain their proportions; an unrepresentable total remains infinity.

Implementation: `src/components/chart/donut-chart.tsx`, `src/components/chart/donut-geometry.ts`, `src/utils/resolve-amount-shares.ts`
Verification: `src/components/chart/donut-geometry.test.ts`, `src/components/chart/donut-chart.test.tsx`, `src/utils/resolve-amount-shares.test.ts`, `e2e/chart.spec.ts`

### UIC-CHART-7.2 - Table

The donut chart's table shall list every segment, hidden ones included, with its formatted value and its share of the whole, under the headings `categoryLabel` (the provider's `chartCategory` string by default), `chartAmount` and `chartShare`. It shall use the same finite, positive amounts as the drawing, treating other amounts as zero.

Implementation: `src/components/chart/donut-chart.tsx`, `src/components/chart/donut-table.ts`, `src/components/chart/donut-geometry.ts`
Verification: `src/components/chart/donut-chart.test.tsx`, `src/components/chart/donut-table.test.ts`

## UIC-CHART-8 - Accessibility

### UIC-CHART-8.1 - Named figure

The root shall be a figure (`role="figure"`) named by its visible `label`, or by `aria-label` or `aria-labelledby`, which take precedence, and described by its summary.

Implementation: `src/components/chart/chart.tsx`
Verification: `src/components/chart/chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-8.2 - Decorative marks

Axes, lines, areas and the donut's total shall add nothing assistive technology reads beyond the named values, the summary and the table: axes and the total are hidden from it, and lines and areas carry no role.

Implementation: `src/components/chart/chart-axis.tsx`, `src/components/chart/line-chart.tsx`, `src/components/chart/donut-chart.tsx`
Verification: `src/components/chart/chart.test.tsx`, `src/components/chart/line-chart.test.tsx`

## UIC-CHART-9 - Reference lines and bands

### UIC-CHART-9.1 - Placement

`BarChart` and `LineChart` shall draw `references` along their value axis, and `LineChart` also `xReferences` along its x axis, read as the axis reads its points (dates in `timeZone`, or numbers). A reference is a line at a `value` (`type` `line`, the default) or a band between `from` and `to` (`type: 'band'`), with an `id` that keys it, a `label` drawn beside it and an optional `tone`. Each draws, in a `ui-chart__references` group under the values, a `ui-chart__reference` group (`data-kind` `line` or `band`, `data-axis` `y` for a value axis running up the plot, `x` for one running across it, as a horizontal bar chart's does, and `data-tone`) holding a `ui-chart__reference-line` or `ui-chart__reference-band` across the whole plot and a `ui-chart__reference-label`, at the inline end of a horizontal reference and the top of a vertical one, mirrored in right-to-left reading. References follow the axis as it changes, with the box size, the shown series and `minValue` and `maxValue`, but never stretch an automatic domain: a line beyond the axis draws nothing, a band is cut to the plot and draws nothing when none of it is inside, and a value that cannot be read on its axis (not a finite number, or a date on a number axis) draws nothing, so no reference produces invalid SVG coordinates. Labels that overlap draw over one another in the given order.

Implementation: `src/components/chart/chart-references.tsx`, `src/components/chart/bar-chart.tsx`, `src/components/chart/bar-chart-model.ts`, `src/components/chart/line-chart.tsx`, `src/components/chart/line-chart-model.ts`
Verification: `src/components/chart/chart-references.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-9.2 - Accessibility

References shall be decorative in the drawing: their group is hidden from assistive technology and lets the pointer through (`pointer-events="none"`), so they never take focus, a tooltip or a press from the values. The generated summary lists them after the values with the provider's `chartSummaryReferences` string, each read with `chartReferenceLine` (label and value) or `chartReferenceBand` (label and range) in the chart's number or date format, joined as a list in the locale; a reference whose values cannot be read is left out. A caller's `summary` replaces it all.

Implementation: `src/components/chart/chart-references.tsx`, `src/components/chart/chart-summary.ts`, `src/core/strings/dashboard.ts`
Verification: `src/components/chart/chart-references.test.tsx`

## Hooks

| Hook                        | Kind      | Values                                            | Description                                                                         |
| --------------------------- | --------- | ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `ui-chart`                  | root      |                                                   | The figure; also on every bar, line and donut chart.                                |
| `ui-chart__header`          | slot      |                                                   | The title and the view toggle.                                                      |
| `ui-chart__title`           | slot      |                                                   | The visible label, when `label` is set.                                             |
| `ui-chart__view-toggle`     | slot      |                                                   | The toggle button that shows the table.                                             |
| `ui-chart__summary`         | slot      |                                                   | The text summary, visible with `showSummary`.                                       |
| `ui-chart__body`            | slot      |                                                   | The drawing's container, in the chart view.                                         |
| `ui-chart__plot`            | slot      |                                                   | The `<svg>` of a bar, line or donut chart.                                          |
| `ui-chart__empty`           | slot      |                                                   | The text shown instead of a plot with no drawn value.                               |
| `ui-chart__table`           | slot      |                                                   | The table view, alongside `ui-prose-table`.                                         |
| `ui-chart__tooltip`         | slot      |                                                   | The tooltip panel of the hovered or focused value, alongside `ui-tooltip`.          |
| `ui-chart__tooltip-title`   | slot      |                                                   | The value's category or x value.                                                    |
| `ui-chart__tooltip-swatch`  | slot      |                                                   | The decorative mark of the series' colour slot.                                     |
| `ui-chart__tooltip-label`   | slot      |                                                   | The series' label.                                                                  |
| `ui-chart__tooltip-value`   | slot      |                                                   | The formatted value.                                                                |
| `ui-chart__references`      | slot      |                                                   | The group of reference lines and bands, under the values.                           |
| `ui-chart__reference`       | slot      |                                                   | One reference: its line or band and its label.                                      |
| `ui-chart__reference-line`  | slot      |                                                   | A reference line across the plot.                                                   |
| `ui-chart__reference-band`  | slot      |                                                   | A reference band across the plot.                                                   |
| `ui-chart__reference-label` | slot      |                                                   | A reference's label.                                                                |
| `ui-bar-chart`              | root      |                                                   | `BarChart`'s figure, alongside `ui-chart`.                                          |
| `ui-bar-chart__bar`         | slot      |                                                   | One bar.                                                                            |
| `ui-line-chart`             | root      |                                                   | `LineChart`'s figure, alongside `ui-chart`.                                         |
| `ui-line-chart__line`       | slot      |                                                   | A series' line.                                                                     |
| `ui-line-chart__area`       | slot      |                                                   | The area under a series' line, for `variant="area"`.                                |
| `ui-line-chart__point`      | slot      |                                                   | A point on a finite value.                                                          |
| `ui-donut-chart`            | root      |                                                   | `DonutChart`'s figure, alongside `ui-chart`.                                        |
| `ui-donut-chart__slice`     | slot      |                                                   | One segment's ring slice.                                                           |
| `ui-donut-chart__total`     | slot      |                                                   | The total in the middle.                                                            |
| `ui-chart-axis`             | root      |                                                   | `ChartAxis`'s `<g>`.                                                                |
| `ui-chart-axis__line`       | slot      |                                                   | The axis line.                                                                      |
| `ui-chart-axis__tick`       | slot      |                                                   | A tick mark.                                                                        |
| `ui-chart-axis__label`      | slot      |                                                   | A tick label.                                                                       |
| `ui-chart-axis__grid`       | slot      |                                                   | A grid line across the drawing.                                                     |
| `ui-chart-legend`           | root      |                                                   | `ChartLegend`'s group.                                                              |
| `ui-chart-legend__item`     | slot      |                                                   | A series' toggle button.                                                            |
| `ui-chart-legend__swatch`   | slot      |                                                   | The item's decorative colour mark.                                                  |
| `ui-chart-legend__label`    | slot      |                                                   | The item's label.                                                                   |
| `data-view`                 | state     | `chart`, `table`                                  | The view the chart shows.                                                           |
| `data-layout`               | attribute | `grouped`, `stacked`                              | How a bar chart sets out a category's bars.                                         |
| `data-orientation`          | attribute | `vertical`, `horizontal`                          | The direction of a bar chart's bars; also on the legend group (React Aria).         |
| `data-variant`              | attribute | `line`, `area`                                    | Lines, or lines over areas.                                                         |
| `data-position`             | attribute | `bottom`, `left`                                  | The edge an axis runs along.                                                        |
| `data-kind`                 | attribute | `line`, `band`                                    | A reference's shape.                                                                |
| `data-axis`                 | attribute | `x`, `y`                                          | The axis a reference's values sit on: `y` runs up the plot, `x` across it.          |
| `data-series`               | attribute |                                                   | The position of a mark's series, from 0.                                            |
| `data-tone`                 | attribute | `neutral`, `info`, `success`, `warning`, `danger` | A series' or reference's tone, when it has one.                                     |
| `data-active`               | state     | `true`                                            | The value hovered or focused, whose tooltip shows.                                  |
| `data-empty`                | state     | `true`                                            | The chart draws no value.                                                           |
| `data-selected`             | state     | `true`                                            | A shown series' legend item, or the view toggle while the table shows (React Aria). |
| `data-hovered`              | state     | `true`                                            | The pointer is over a legend item or the view toggle (React Aria).                  |
| `data-pressed`              | state     | `true`                                            | A legend item or the view toggle is pressed (React Aria).                           |
| `data-focused`              | state     | `true`                                            | A legend item or the view toggle has focus (React Aria).                            |
| `data-focus-visible`        | state     | `true`                                            | A legend item or the view toggle has keyboard focus (React Aria).                   |
| `data-disabled`             | state     | `true`                                            | A legend item or the view toggle is disabled (React Aria).                          |
