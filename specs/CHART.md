# Chart

The chart family draws data as accessible SVG with no charting dependency, on the library's scales ([SCALES.md](SCALES.md)). `BarChart`, `LineChart` and `DonutChart` draw complete charts; `Chart` is the frame they share, which a host also wraps around its own drawing; `ChartAxis` and `ChartLegend` are the axis and the legend they draw with. Every chart is a named figure described by a text summary, every drawn value is a named, focusable point with a tooltip, and a toggle shows the values as a table instead. Series colors are color slots: each series publishes its position (`data-series`) and an optional tone (`data-tone`), and the host stylesheet maps them to colors; the library never writes a color.

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

`Chart` and every chart built on it shall carry the hooks below, append the caller's `className`, and forward `id`, `ref` and caller `data-*` attributes to the root; caller attributes never replace a hook attribute. `isEmpty` publishes `data-empty` on the root. `BarChart`, `LineChart`, `DonutChart`, `ScatterChart` and `CalendarHeatmap` render `Chart` with their own root class (`ui-bar-chart`, `ui-line-chart`, `ui-donut-chart`, `ui-scatter-chart`, `ui-calendar-heatmap`) alongside `ui-chart`.

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

### UIC-CHART-2.4 - In-plot legends

`ChartLegendPlacement` accepts `above`, `top-start`, `top-end`, `bottom-start` or `bottom-end`. Pass `legendPlacement` to a Chart frame, bar, line, donut or scatter chart to position its legend. The default is `above`. In the reference theme a corner legend moves above its plot when the plot width is 24rem or less. Start and end follow text direction.

`ChartLegendItem.swatch` and the legend-wide `swatch` default accept `line`, `dashed` or `band`. A visible item's hover or focus and a restored item call `onHighlight(id)`. Line charts draw the highlighted series last within the line and point layers, preserving its original series color and keyboard traversal order.

A linked chart channel opts in with `legend: { labels }`. The keys of `LinkedChartLegend.labels` are the `LinkedChartLayer` values `measured`, `reference`, `envelope` and `threshold`. The channel shows a toggle for each named layer with data, defaulting to the top-end corner. Per-channel `hiddenKeys`, `defaultHiddenKeys` and `onHiddenKeysChange` control visibility. The envelope stays below the lines. The plot keeps its scale, fixed points, and measurements as visibility changes.

Implementation: `src/components/chart/plot-with-legend.tsx`, `src/components/chart/chart-legend.tsx`, `src/components/chart/linked-legend.tsx`, `src/components/chart/line-chart.tsx`, `labs/reference/chart.css`
Verification: `src/components/chart/linked-legend.test.tsx`, `src/components/chart/line-chart.test.tsx`, `e2e/chart-measurements.spec.ts`

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

### UIC-CHART-4.1 - Color slots

Each drawn value and series mark (bars, lines, areas, points and slices, their legend items and the tooltip's swatch) shall publish `data-series`, the position of its series in the chart's `series` (or `segments`), which stays the same when other series are hidden, and `data-tone` when the series has a `tone` (`neutral`, `info`, `success`, `warning` or `danger`). The library sets no color.

Implementation: `src/components/chart/bar-chart.tsx`, `src/components/chart/line-chart.tsx`, `src/components/chart/donut-chart.tsx`, `src/components/chart/chart-points.tsx`
Verification: `src/components/chart/bar-chart.test.tsx`, `src/components/chart/line-chart.test.tsx`, `src/components/chart/donut-chart.test.tsx`

### UIC-CHART-4.2 - Named values

Each drawn value shall be an image (`role="img"`) named by the provider's `chartValue` string from its series' label, its category or x value and its formatted value (`Apples, March: 42`), or, in a donut, by `donutSegment` (`Apples: 60, 50%`). Values are formatted for the locale with `formatOptions`. The drawing (`ui-chart__plot`) is an SVG group.

Implementation: `src/components/chart/bar-chart.tsx`, `src/components/chart/line-chart.tsx`, `src/components/chart/donut-chart.tsx`
Verification: `src/components/chart/bar-chart.test.tsx`, `src/components/chart/line-chart.test.tsx`, `src/components/chart/donut-chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-4.3 - Keyboard

The drawn values shall take one tab stop, on the first value or the last one focused. The left and right arrow keys move focus to the previous and next value of the same series (the up and down arrow keys for a horizontal bar chart, whose categories run down), the up and down arrow keys (left and right for a horizontal bar chart) move to the value of the previous and next drawn series nearest along the shared axis (a bar's category; a line point's read x, a number or a time, so unevenly sampled series and series over different ranges meet at the same x rather than at the same position), and Home and End move to the first and last value of the series. A donut's slices form one series.

When two points in the target series are equally close, the first in input order wins.

Each drawn value is identified by its series' typed `id` (numeric and text ids of one spelling stay apart) and its place along the series: a bar by its category, counting repeated category names in order, a line point by its read x, counting repeated coordinates in order, and a donut slice by its segment's `id` alone. The tab stop, focus, the active value and its tooltip stay on that value while series or segments reorder or values are added or removed elsewhere, while `data-series` keeps following the series' current position (its color slot). When the value goes, the tab stop falls back to the first value and focus is not moved.

Implementation: `src/components/chart/chart-points.tsx`
Verification: `src/components/chart/chart-points.test.tsx`, `src/components/chart/bar-chart.test.tsx`, `src/components/chart/line-chart.test.tsx`, `src/components/chart/donut-chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-4.4 - Tooltip

Hovering or focusing a drawn value shall publish `data-active` on it and open a [Tooltip](TOOLTIP.md) panel pointing at it, carrying `ui-chart__tooltip`, that shows the value's category or x value in `ui-chart__tooltip-title` (not for a donut), a `ui-chart__tooltip-swatch` with the series' color slot, the series' label in `ui-chart__tooltip-label` and the formatted value in `ui-chart__tooltip-value` (with its share, for a donut, joined by the provider's `donutValue` string: `60 (50%)`). The tooltip closes when the pointer leaves, when focus leaves, and on Escape wherever focus is (a tooltip opened by hover included); that Escape goes no further, so it does not also close a surface around the chart. A composing Escape (cancelling an input method candidate in a field anywhere on the page) belongs to the input method: it leaves the tooltip open and goes on. When the active value leaves the chart (its series hidden, its value made unreadable or removed), its tooltip closes and gives up its Escape and the element it pointed at; no empty tooltip stays, and the value does not reopen it if it comes back.

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

`LineChart` shall place each point of its series (`points` of `{ x, y }`) along x by `x`: ISO 8601 dates or date-times make a time axis read in `timeZone` (the provider's by default, else the browser's once hydrated and UTC before) with calendar ticks from the time scale (hour and minute ticks for date-times spanning less than a few days, [UIC-SCALES-2.4](SCALES.md#uic-scales-24---choosing-a-unit)), and numbers a linear axis; the first point decides which, and points whose `x` cannot be read are left out. The axis spans the lowest to the highest `x`, about one tick every 80 pixels. In names, the tooltip and the table, dates read as medium dates (with the time for a date-time) and numbers in the locale. Axis ticks and those dates write their spaces as plain spaces ([UIC-INTL-FORMAT-1.3](INTL-FORMAT.md)), so a server-rendered axis hydrates unchanged.

The x axis shall read ISO dates and date-times as the time scale does, so its ticks and the points agree.

Implementation: `src/components/chart/line-chart.tsx`, `src/components/chart/line-x-axis.ts`, `src/utils/time-scale.ts`
Verification: `src/components/chart/line-geometry.test.ts`, `src/components/chart/line-chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-6.2 - Lines, areas and points

Each shown series shall draw a `ui-line-chart__line` path (with no fill) through its points in x order and a `ui-line-chart__point` circle on each finite value. A missing value ([UIC-CHART-6.5](#uic-chart-65---missing-values)) breaks the line, which resumes at the next one. `variant` publishes `data-variant`: `line` (the default) or `area`, which also fills a `ui-line-chart__area` under each line, toward zero or the edge nearest it.

Implementation: `src/components/chart/line-chart.tsx`, `src/components/chart/line-geometry.ts`
Verification: `src/components/chart/line-geometry.test.ts`, `src/components/chart/line-chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-6.3 - Value axis

The value axis shall run from `minValue` to `maxValue` when given, keeping values beyond them at the edges; with only one of them, the other end still extends to a whole tick step, and a bound past the data never reverses the axis, which always runs from its lower to its higher end. Otherwise it runs over a nice domain that includes zero and every drawn value (a value whose x the axis cannot read is not drawn and does not stretch the axis; a value that is not a finite number at a readable x still breaks the line), about one tick every 40 pixels, with grid lines across the plot.

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

`DonutChart` shall draw one `ui-donut-chart__slice` ring segment per shown segment with a finite, positive `value`, clockwise from the top, each spanning its share of the shown total (a share so near the whole ring that its ends meet is drawn as the whole ring is, in two halves), around a hole of 60% of the radius, and the total in the middle through the provider's `totalCount` string in a `ui-donut-chart__total` text hidden from assistive technology. Finite amounts whose sum exceeds the numeric range shall retain their proportions; an unrepresentable total remains infinity.

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

`BarChart` and `LineChart` shall draw `references` along their value axis, and `LineChart` also `xReferences` along its x axis, read as the axis reads its points (dates in `timeZone`, or numbers). A reference is a line at a `value` (`type` `line`, the default) or a band between `from` and `to` (`type: 'band'`), with an `id` that keys it among the references of its axis (a value reference and an x reference may share one), a `label` drawn beside it and an optional `tone`. Each draws, in a `ui-chart__references` group under the values, a `ui-chart__reference` group (`data-kind` `line` or `band`, `data-axis` `y` for a value axis running up the plot, `x` for one running across it, as a horizontal bar chart's does, and `data-tone`) holding a `ui-chart__reference-line` or `ui-chart__reference-band` across the whole plot and a `ui-chart__reference-label`, at the inline end of a horizontal reference and the top of a vertical one, mirrored in right-to-left reading. References follow the axis as it changes, with the box size, the shown series and `minValue` and `maxValue`, but never stretch an automatic domain: a line beyond the axis draws nothing, a band is cut to the plot and draws nothing when none of it is inside, and a value that cannot be read on its axis (not a finite number, or a date on a number axis) draws nothing, so no reference produces invalid SVG coordinates. Labels that overlap draw over one another in the given order.

Implementation: `src/components/chart/chart-references.tsx`, `src/components/chart/bar-chart.tsx`, `src/components/chart/bar-chart-model.ts`, `src/components/chart/line-chart.tsx`, `src/components/chart/line-chart-model.ts`
Verification: `src/components/chart/chart-references.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-9.2 - Accessibility

References shall be decorative in the drawing: their group is hidden from assistive technology and lets the pointer through (`pointer-events="none"`), so they never take focus, a tooltip or a press from the values. The generated summary lists them after the values with the provider's `chartSummaryReferences` string, each read with `chartReferenceLine` (label and value) or `chartReferenceBand` (label and range) in the chart's number or date format, joined as a list in the locale; a reference whose values cannot be read is left out. A caller's `summary` replaces it all.

Implementation: `src/components/chart/chart-references.tsx`, `src/components/chart/chart-summary.ts`, `src/core/strings/dashboard.ts`
Verification: `src/components/chart/chart-references.test.tsx`

## UIC-CHART-10 - Scatter chart

### UIC-CHART-10.1 - Observations

`ScatterChart` shall draw each shown series' observations as `ui-scatter-chart__point` circles on two linear axes, `x` across and `y` up, each axis spanning `minX`/`maxX` and `minY`/`maxY` when given, else a nice extent of the drawn values (one value widens to a tenth of it either side, or 1 for zero); with one bound of an axis given, its other end still extends to a whole tick step, and the axis always runs from its lower to its higher end. Values beyond a fixed bound sit at its edge. An observation whose `x` or `y` is `null` or not a finite number draws nothing, takes no focus and never stretches an axis; a chart with no drawn observation shows its no-data state. Each observation is keyed by its series' `id` and its own `id`, so observations at the same coordinates stay distinct and keep their identity when others move or the data reorders; a repeated `id` within a series keeps its first observation.

Implementation: `src/components/chart/scatter-geometry.ts`, `src/components/chart/scatter-chart.tsx`
Verification: `src/components/chart/scatter-geometry.test.ts`, `src/components/chart/scatter-chart.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-10.2 - Names, keyboard, tooltip and table

Each observation shall be a point named, through the provider's `chartValue` (with its `label`) or `chartPointValue` strings, by its series, its label and its coordinates written with `chartCoordinates` and the axis names `xLabel` and `yLabel` (`chartXAxis` and `chartYAxis` by default). The arrow keys move within a series in x order, then y order, then given order, and between series to the nearest x, as for other charts ([UIC-CHART-4.3](#uic-chart-43---keyboard)); the tooltip shows the label, the series and the coordinates. The legend shows and hides series; the summary describes the shown y values; the table lists every observation, hidden series included, under `chartPoint`, `chartSeries` and the axis names, with blank cells for missing values.

Implementation: `src/components/chart/scatter-chart.tsx`, `src/components/chart/scatter-chart-model.ts`, `src/core/strings/dashboard.ts`
Verification: `src/components/chart/scatter-chart.test.tsx`, `e2e/chart.spec.ts`

## UIC-CHART-11 - Calendar heatmap

### UIC-CHART-11.1 - Days

`CalendarHeatmap` shall draw every day from `start` to `end` (by default the first and last readable given days) as a `ui-calendar-heatmap__cell` square, a week per column from `firstDayOfWeek` (the locale's by default) and a weekday per row. Dates are `YYYY-MM-DD` calendar days, never instants, so no time zone moves a day: leap days and week and year boundaries fall in their own week and weekday. Each day publishes `data-state`: `value` for a finite number (zero included), `missing` for a day given with `null` or a value that is not a finite number, and `absent` for a day not given; a repeated date keeps its first entry and an unreadable one is left out. Short month names label each month's first column (`ui-calendar-heatmap__month`) and short weekday names every other row (`ui-calendar-heatmap__weekday`), in the locale, hidden from assistive technology. Squares are `cellSize` wide (14 pixels by default) and shrink to fit the frame's width down to 8, past which the drawing is wider than the frame. Right-to-left reading mirrors the columns. A range that is empty, reversed or holds no value shows the no-data state.

Implementation: `src/components/chart/heatmap-geometry.ts`, `src/components/chart/calendar-heatmap.tsx`
Verification: `src/components/chart/heatmap-geometry.test.ts`, `src/components/chart/calendar-heatmap.test.tsx`, `e2e/chart.spec.ts`

### UIC-CHART-11.2 - Levels and legend

A value shall publish its intensity as `data-level`, from 0 to `levels` (4 by default): 0 holds values at or below `minValue` (zero, or the lowest value below zero, by default), and each further level an equal step up to `maxValue` (the highest value by default). A value beyond a bound draws at the nearest level and publishes `data-outlier` (`low` or `high`). The meaning never rests on color alone: every day's name and tooltip give its value, and a `ui-calendar-heatmap__legend` list, named by the provider's `heatmapLegend` string, names each level by the values it spans (`heatmapAtMost`, `heatmapRange`, `heatmapAtLeast`), then missing (`heatmapMissing`) and absent (`noData`) days when any draw, each item a `ui-calendar-heatmap__legend-item` holding a decorative `ui-calendar-heatmap__legend-swatch` (with the same `data-level` or `data-state`) and a `ui-calendar-heatmap__legend-label`. `showLegend={false}` hides it.

Implementation: `src/components/chart/heatmap-geometry.ts`, `src/components/chart/calendar-heatmap-model.ts`, `src/components/chart/calendar-heatmap.tsx`
Verification: `src/components/chart/heatmap-geometry.test.ts`, `src/components/chart/calendar-heatmap.test.tsx`

### UIC-CHART-11.3 - Names, keyboard, tooltip and table

Each day shall be a point named, through the provider's `chartPointValue` string, by its date in the locale and its value (or `heatmapMissing` or `noData`). The days are one tab stop: the up and down arrows move a day within the week, the left and right arrows a week (as they look in right-to-left reading), and Home and End to the first and last of that weekday; the hovered or focused day's tooltip shows its date and value. The generated summary (`heatmapSummary`) counts the days and values and gives the lowest and highest; the table lists every given day in the range in date order under `chartDate` and `chartAmount`, a missing value as `heatmapMissing`. New `days` replace the drawing, the legend and the table.

Implementation: `src/components/chart/calendar-heatmap.tsx`, `src/components/chart/calendar-heatmap-model.ts`, `src/core/strings/dashboard.ts`
Verification: `src/components/chart/calendar-heatmap.test.tsx`, `e2e/chart.spec.ts`

## Sparkline

`Sparkline` draws a series of numbers as a word-sized line or area with no axes, such as a week of daily counts beside a figure or in a table cell. It lays the series out with the linear scale ([SCALES.md](SCALES.md)) and is an image named by its label and described by its lowest, highest and last values.

## UIC-CHART-12 - Sparkline

### UIC-CHART-12.1 - Parts

`Sparkline` shall render a `ui-sparkline` `<svg>` of `width` by `height` pixels (80 by 24 by default) with a matching `viewBox`, holding a `ui-sparkline__line` path (with no fill) through each run of two or more consecutive finite values and, for `variant="area"`, a `ui-sparkline__area` path under it. A finite value with no finite neighbour, such as the only value of a series, is drawn as a `ui-sparkline__dot` circle instead, so every finite value stays visible without markers. `variant` publishes `data-variant`: `line` (the default) or `area`.

Implementation: `src/components/chart/sparkline.tsx`
Verification: `src/components/chart/sparkline.test.tsx`, `src/components/chart/sparkline-geometry.test.ts`, `e2e/chart-sparkline.spec.ts`

### UIC-CHART-12.2 - Layout

The values shall be spaced evenly from the left edge to the right in their order, and placed from the bottom edge (`minValue`, by default the lowest value) to the top (`maxValue`, by default the highest), inside a 3 pixel inset that keeps edge markers whole; values beyond `minValue` or `maxValue` stay at the edge. Equal values sit on the middle line, and a single value at the centre. The area fills from the line toward zero: to zero when zero lies between the bottom and the top, and otherwise to the edge nearest zero (the bottom for positive values), also when every value is equal or `minValue` equals `maxValue`. Coordinates are rounded to two decimals.

Calculating the finite value range shall not depend on the runtime limit on function arguments.

Implementation: `src/utils/summarize-numbers.ts`, `src/components/chart/sparkline-geometry.ts`, `src/utils/linear-scale.ts`
Verification: `src/utils/summarize-numbers.test.ts`, `src/components/chart/sparkline-geometry.test.ts`, `src/components/chart/sparkline.test.tsx`, `e2e/chart-sparkline.spec.ts`

### UIC-CHART-12.3 - Gaps

A value that is not a finite number shall leave a gap: the line and the area break there and resume at the next finite value, which keeps its place in the series. Nothing joins values across a gap; a finite value between two gaps (or a gap and an end) is a `ui-sparkline__dot`. A series with no finite value draws no line, area or dot and publishes `data-empty`.

Implementation: `src/components/chart/sparkline-geometry.ts`, `src/components/chart/sparkline.tsx`
Verification: `src/components/chart/sparkline-geometry.test.ts`, `src/components/chart/sparkline.test.tsx`, `e2e/chart-sparkline.spec.ts`

### UIC-CHART-12.4 - Markers

`markers` shall draw a `ui-sparkline__marker` circle with `data-marker` for each listed point: `min` at the first lowest value, `max` at the first highest and `last` at the last finite value. A series with no finite value draws no markers.

Implementation: `src/components/chart/sparkline.tsx`, `src/components/chart/sparkline-geometry.ts`
Verification: `src/components/chart/sparkline.test.tsx`, `src/components/chart/sparkline-geometry.test.ts`, `e2e/chart-sparkline.spec.ts`

### UIC-CHART-12.5 - Hooks and caller attributes

`Sparkline` shall carry the hooks below, append the caller's `className`, and forward `id`, `ref` and caller `data-*` attributes to its `<svg>`; caller attributes never replace a hook attribute.

Implementation: `src/components/chart/sparkline.tsx`
Verification: `src/components/chart/sparkline.test.tsx`

## UIC-CHART-13 - Accessibility

### UIC-CHART-13.1 - Named image

The `<svg>` shall have `role="img"`, be named by `aria-label` or `aria-labelledby`, and take no tab stop.

Implementation: `src/components/chart/sparkline.tsx`
Verification: `src/components/chart/sparkline.test.tsx`, `e2e/chart-sparkline.spec.ts`

### UIC-CHART-13.2 - Summary

The image shall be described by a `<desc>` that reads its lowest, highest and last values through the provider's `seriesSummary` string (`Low 4, high 18, last 15`), formatted for the locale with `formatOptions`, or the `noData` string for a series with no finite value. A caller's `aria-describedby` is kept after it.

Implementation: `src/components/chart/sparkline.tsx`, `src/core/strings/content.ts`
Verification: `src/components/chart/sparkline.test.tsx`, `e2e/chart-sparkline.spec.ts`

## UIC-CHART-14 - Numeric viewport

### UIC-CHART-14.1 - Shared pan, zoom and numeric scales

`LinkedLineChart` and `EventChart` accept `ChartViewportProps`. A positive, increasing `visibleRange` on a logarithmic axis, or any finite increasing range on a linear axis, controls the view in original x units. `defaultVisibleRange` initializes an uncontrolled view. The view intersects the data extent and falls back to the capture extent when the intersection is empty. `onVisibleRangeChange` reports requested changes. The initial extent includes the capture, and reset restores that extent. `xScale` defaults to `linear`. With `log`, equal ratios occupy equal distances and only positive x values draw. `xLabel` names the axis and `formatX` formats its ticks.

Drag a zoomed plot to pan, Shift+drag to preview and zoom to a horizontal interval, or Ctrl+wheel to zoom around the pointer. Ordinary wheel input scrolls the page. Choose **Reset view** in the plot context menu to restore the full extent.

The viewport’s `data-gesture` identifies the interaction as `idle`, `pan`, `panning`, `select`, `selecting`, `zoom-in`, `zoom-out` or `move-mark`. The reference styles show a grab hand when panning is available, a closed hand during a pan, a magnifier for zoom, a crosshair during interval selection and a horizontal resize cursor on movable marks.

On the focused viewport, Left/Right pan one fifth of the visible span, +/− zoom at the center and Home resets. All moves operate in the displayed scale and remain within the capture extent. Secondary click, long touch, Shift+F10 and the Context Menu key open the existing ContextMenu.

Implementation: `src/components/chart/numeric-axis.ts`, `src/components/chart/chart-viewport.tsx`, `src/components/chart/use-plot-pointer.ts`, `labs/reference/chart.css`
Verification: `src/components/chart/numeric-axis.test.ts`, `src/components/chart/event-chart.test.tsx`, `e2e/chart-measurements.spec.ts`

## UIC-CHART-15 - Linked line chart

### UIC-CHART-15.1 - Aligned channels and dense captures

`LinkedLineChart` accepts keyed `channels` with a label and `samples` of numeric x and numeric or null y. Each channel accepts `unit`, `formatY`, `yRange`, `yScale`, a separately sampled dashed `reference` trace, and a numeric `threshold`. Samples may carry `lower` and `upper` error limits. A valid pair shades a band at that coordinate. Channels share an x scale and margin, with independent linear or positive logarithmic y scales and a common `channelHeight` in pixels. Every channel displays the same horizontal axis ticks, formatted values, and visible `xLabel`. Panning, zooming, resizing and controlled range changes update the aligned axes together. Named `xReferences` stay fixed across channels. Axis limits and reference styling use the existing chart conventions.

Within each uninterrupted run the line retains first, lowest, highest and last samples per pixel column, in source x order. A missing measurement breaks the line. Missing or reversed bounds break the band. Zooming and resizing recompute the drawing from source values with a neighbor across each viewport edge. The table exposes full-resolution measurements, reference samples and band bounds. Each component also accepts the Chart frame's name, summary, table-view controls and root props.

Implementation: `src/components/chart/linked-line-chart.tsx`, `src/components/chart/linked-channel.ts`, `src/components/chart/linked-model.ts`, `src/components/chart/linked-lane.tsx`, `labs/src/chart-measurement-cases.tsx`
Verification: `src/components/chart/linked-channel.test.ts`, `e2e/chart-measurements.spec.ts`

### UIC-CHART-15.2 - Cursor coordinates and readout

`cursors` and `defaultCursors` are pairs in A, B order. Each mark identifies its nearest displayed sample with a dot. Its slider expresses position as a percentage and announces the coordinate and reading in host units. Each cursor is a named slider with an editable position in the readout table. Drag or use arrow keys to move a cursor, Shift+arrow for a larger move, and Home/End for the visible edges. Cursors can cross. `onCursorsChange(pair, readout)` reports the requested positions, absolute x separation, and each channel's nearest displayed source samples and signed B minus A amplitude. A cursor outside the view or an empty channel reports a null sample. Proximity is measured along the displayed axis. A tie between two distinct coordinates picks the earlier sample. Peak-to-peak is the maximum minus minimum of the channel's full-resolution measurements in the visible x range.

The plot menu inserts a cursor at the pointer or focused coordinate. New cursors take the first unused alphabetic name (A through Z, then AA, AB and so on). Existing names stay stable. The menu on a movable cursor or anywhere on its readout row offers Delete cursor. Focus the row name and press Shift+F10 for keyboard access. Fixed references and channel points keep their host coordinates. B minus A measurements and zoom between cursors require both A and B. Peak-to-peak placement restores both.

`ChartCursorProps` accepts a controlled `cursorList`, an initial `defaultCursorList`, and `onCursorListChange(next)` for all insertions, moves, renames and deletions. Each `LinkedChartCursor` has a unique stable string `name` and a finite source coordinate `x`. Its optional `label` is the editable display name and defaults to `name`. Renaming preserves identity, position and the roles of A and B in measurements. A controlled list takes precedence over the legacy A/B coordinate pair.

The cursor readings table has a row for each A/B cursor, named movable marker and fixed x reference, plus each host-supplied channel point. Each channel has its own column with its amplitude unit. The table shows the nearest displayed sample’s x coordinate when it differs from the cursor position. The footer gives signed B minus A differences and visible-range peak-to-peak amplitudes. Absolute x separation appears in the caption. Click or keyboard-activate a movable position to edit it as text. Enter or blur commits a valid position and Escape cancels. Bare numbers use source units. The optional `xUnits` map supplies accepted case-sensitive suffixes and their multipliers in source units. Invalid, unknown-unit or out-of-extent entries keep the editor open with an error. Fixed coordinates remain labels. Click or keyboard-activate a cursor name to rename it across the plots, readout, difference row and menus. Names are trimmed, nonempty and unique among displayed cursor names. Time and name editors occupy the saved label’s space while editing, including when validation is shown.

The optional `measurements` prop accepts ready-made rows or a pure function of `LinkedChartMeasurementContext`. It receives all named cursors with their source positions and editable labels, movable markers, fixed x references, the visible range, original channels, the A/B readout (null when either is missing), and a nearest-displayed-sample lookup by channel id and coordinate. Results follow pointer, keyboard, table edits and host prop updates. Each `LinkedChartMeasurementRow` has a stable `id`, `label`, optional scalar `value` and optional `valuesByChannel` map. Cells accept host-rendered content with its own units. The table appends rows in caller order and leaves missing values empty.

A channel accepts optional `points: readonly LinkedChartPoint[]`. Each point has a channel-local `id`, a `label`, and numeric `x` and `y` in source units. Points are fixed annotations. The plot draws a labeled point within its axes and the table retains its supplied coordinates when zoomed away. Each point annotates one channel. Its coordinates are independent of the acquired samples and measurements.

Clicking a fixed channel point or its label, or pressing Enter or Space on the focused point, highlights its readout row and scrolls it into view. The point exposes its pressed state and references the row through `aria-details`. The row exposes `aria-current`. Selection follows the chart, channel and point identity even when labels, keys or coordinates coincide across channels. Pressing or focusing a movable cursor or marker in any channel highlights its shared readout row. The highlight follows a cursor through dragging, keyboard movement, menu placement and row editing. Handling a movable mark preserves the plot scroll position. Readout columns size from the container and its headings, so changing digit counts, signs, decimal places or units during a drag keeps the column boundaries fixed. Extra channels can scroll within the readout.

Clicking any body or footer row selects it. A cursor, marker, fixed reference or channel point emphasizes its matching plotted element. The difference row highlights A and B, and peak-to-peak rings the minimum and maximum source samples for every channel in the current view. The row names of fixed positions and results are keyboard-activatable buttons. Movable positions keep their editing controls. Selection preserves the active viewport.

A host measurement can supply `highlights: readonly LinkedChartHighlight[]`. A `sample` takes `channelId`, `x` and `y`. An `interval` takes `from`, `to` and an optional `channelId`. A `channel` takes `channelId`. These use source coordinates and follow the current scales and viewport. When omitted, a result emphasizes its `valuesByChannel` traces, or all traces for a capture-wide scalar.

Implementation: `src/components/chart/linked-line-chart.tsx`, `src/components/chart/linked-model.ts`, `src/components/chart/chart-placement.tsx`, `src/components/chart/linked-points.tsx`, `src/components/chart/linked-readings.tsx`
Verification: `src/components/chart/linked-line-chart.test.tsx`, `src/components/chart/linked-legend.test.tsx`, `src/components/chart/linked-channel.test.ts`, `e2e/chart-measurements.spec.ts`

### UIC-CHART-15.3 - Manual and automatic measurement placement

Each channel menu places A, B, a new marker or an existing marker at the pointer coordinate (keyboard uses the focused mark or viewport midpoint), the nearest displayed sample, the first full-resolution minimum or maximum, first rising or falling threshold crossing, or first sample strictly outside its supplied band. Crossings linearly interpolate consecutive valid source values in data units. Samples exactly on a band limit pass. Unavailable measurements disable their actions. Peak-to-peak places A at the minimum and B at the maximum together. Zoom between cursors fits their span. `markers`, `defaultMarkers` and `onMarkersChange` use the existing named reference-line shape. Move a marker by drag, keyboard, or numeric entry and remove it from its reading row’s context menu or with the Delete key. The dragged mark carries `data-dragging` until release or cancellation. The reference styles thicken the active line from 1 to 2 pixels during a drag or keyboard focus. The transparent hit area keeps its width. Placement only changes marker or cursor coordinates.

Implementation: `src/components/chart/chart-placement.tsx`, `src/components/chart/linked-channel.ts`, `src/components/chart/linked-line-chart.tsx`
Verification: `src/components/chart/linked-line-chart.test.tsx`, `src/components/chart/linked-channel.test.ts`, `e2e/chart-measurements.spec.ts`

### UIC-CHART-15.4 - Differential cursor pairs

`differentialCursors`, `defaultDifferentialCursors` and `onDifferentialCursorsChange` control a keyed collection of `LinkedChartDifferential`. Each pair has an `id`, a `label`, two `LinkedChartEndpoint` values (`from`, `to`), and an `axis`. X pairs share the horizontal axis. Y pairs require a `channelId` and use that channel’s amplitude scale and unit. The readout shows both endpoints and their signed difference in source units, including on logarithmic scales.

An endpoint is a free numeric coordinate or a live binding. Bind a named point by `{type: 'point', channelId, id}`, an acquired sample by `{type: 'sample', channelId, x}`, an ordinary cursor by `{type: 'cursor', name}`, or a marker or fixed reference by its `type` and `id`. Y bindings to x-only sources resolve the nearest original sample on the owning channel. Missing samples, targets and incompatible channels yield unavailable readings. Bindings resume when the source returns. Pan, zoom and drawing reduction preserve the underlying measurement. Host measurement functions receive `differentials`, a list of `LinkedChartDifferentialReading` with the cursor definition, resolved endpoints and signed delta. Unavailable numbers are `null`. The change callback reports definition edits.

The plot menu adds and removes pairs and binds each endpoint separately. The menu on a diamond offers its endpoint directly. Free position detaches at the current value. Dragging a diamond or using the arrow, Shift+arrow, Home or End keys sets that endpoint to a free coordinate. Delete or the reading row’s context menu removes the pair. X handles move horizontally and Y handles vertically. Selecting either handle highlights the pair’s row. Selecting the row highlights both endpoints and their shaded span. Each pair lightly fills the visible interval beneath the grid and traces, including when the endpoints cross or extend beyond the view. Coincident or unresolved endpoints have no area. The bands follow the live coordinates and pass pointer events through.

Implementation: `src/components/chart/chart-differentials.ts`, `src/components/chart/use-chart-differentials.ts`, `src/components/chart/differential-marks.tsx`, `src/components/chart/differential-menu.ts`
Verification: `src/components/chart/chart-differentials.test.tsx`, `e2e/chart-differentials.spec.ts`

## UIC-CHART-16 - Event chart

### UIC-CHART-16.1 - Exact numeric points and intervals

`EventChart` accepts `events` with stable `id`, `label`, numeric `start` and optional inclusive `end`. A zero-length interval draws as a point. Valid events sort by start and retain input order at ties. Visible marks share a roving tab stop with Left/Right and Home/End navigation. Hover and keyboard focus reveal event details. `renderDetails(event)` receives the original item. Names and table rows include the numeric endpoints alongside a differing `formatX` result so rounded labels preserve distinguishable details. Coincident events have separate identities and table rows. The chart supports the shared numeric viewport and Chart frame.

Implementation: `src/components/chart/event-chart.tsx`, `src/components/chart/chart-points.tsx`, `labs/src/chart-measurement-cases.tsx`
Verification: `src/components/chart/event-chart.test.tsx`, `e2e/chart-measurements.spec.ts`

## Hooks

| Hook                                 | Kind      | Values / Meaning                                  |
| ------------------------------------ | --------- | ------------------------------------------------- |
| `ui-chart`                           | root      |                                                   | The figure; also on every bar, line and donut chart.                                |
| `ui-chart__header`                   | slot      |                                                   | The title and the view toggle.                                                      |
| `ui-chart__title`                    | slot      |                                                   | The visible label, when `label` is set.                                             |
| `ui-chart__view-toggle`              | slot      |                                                   | The toggle button that shows the table.                                             |
| `ui-chart__summary`                  | slot      |                                                   | The text summary, visible with `showSummary`.                                       |
| `ui-chart__body`                     | slot      |                                                   | The drawing's container, in the chart view.                                         |
| `ui-chart__plot`                     | slot      |                                                   | The `<svg>` of a bar, line or donut chart.                                          |
| `ui-chart__empty`                    | slot      |                                                   | The text shown instead of a plot with no drawn value.                               |
| `ui-chart__table`                    | slot      |                                                   | The table view, alongside `ui-prose-table`.                                         |
| `ui-chart__tooltip`                  | slot      |                                                   | The tooltip panel of the hovered or focused value, alongside `ui-tooltip`.          |
| `ui-chart__tooltip-title`            | slot      |                                                   | The value's category or x value.                                                    |
| `ui-chart__tooltip-swatch`           | slot      |                                                   | The decorative mark of the series' color slot.                                      |
| `ui-chart__tooltip-label`            | slot      |                                                   | The series' label.                                                                  |
| `ui-chart__tooltip-value`            | slot      |                                                   | The formatted value.                                                                |
| `ui-chart__references`               | slot      |                                                   | The group of reference lines and bands, under the values.                           |
| `ui-chart__reference`                | slot      |                                                   | One reference: its line or band and its label.                                      |
| `ui-chart__reference-line`           | slot      |                                                   | A reference line across the plot.                                                   |
| `ui-chart__reference-band`           | slot      |                                                   | A reference band across the plot.                                                   |
| `ui-chart__reference-label`          | slot      |                                                   | A reference's label.                                                                |
| `ui-bar-chart`                       | root      |                                                   | `BarChart`'s figure, alongside `ui-chart`.                                          |
| `ui-bar-chart__bar`                  | slot      |                                                   | One bar.                                                                            |
| `ui-line-chart`                      | root      |                                                   | `LineChart`'s figure, alongside `ui-chart`.                                         |
| `ui-line-chart__line`                | slot      |                                                   | A series' line.                                                                     |
| `ui-line-chart__area`                | slot      |                                                   | The area under a series' line, for `variant="area"`.                                |
| `ui-line-chart__point`               | slot      |                                                   | A point on a finite value.                                                          |
| `ui-scatter-chart`                   | root      |                                                   | `ScatterChart`'s figure, alongside `ui-chart`.                                      |
| `ui-scatter-chart__point`            | slot      |                                                   | One drawn observation.                                                              |
| `ui-calendar-heatmap`                | root      |                                                   | `CalendarHeatmap`'s figure, alongside `ui-chart`.                                   |
| `ui-calendar-heatmap__cell`          | slot      |                                                   | A day's square.                                                                     |
| `ui-calendar-heatmap__month`         | slot      |                                                   | A month's name above its first column.                                              |
| `ui-calendar-heatmap__weekday`       | slot      |                                                   | A weekday's name beside its row.                                                    |
| `ui-calendar-heatmap__legend`        | slot      |                                                   | The list of levels.                                                                 |
| `ui-calendar-heatmap__legend-item`   | slot      |                                                   | A level, or the missing or absent days.                                             |
| `ui-calendar-heatmap__legend-swatch` | slot      |                                                   | The item's decorative mark.                                                         |
| `ui-calendar-heatmap__legend-label`  | slot      |                                                   | The values the item stands for.                                                     |
| `ui-donut-chart`                     | root      |                                                   | `DonutChart`'s figure, alongside `ui-chart`.                                        |
| `ui-donut-chart__slice`              | slot      |                                                   | One segment's ring slice.                                                           |
| `ui-donut-chart__total`              | slot      |                                                   | The total in the middle.                                                            |
| `ui-chart-axis`                      | root      |                                                   | `ChartAxis`'s `<g>`.                                                                |
| `ui-chart-axis__line`                | slot      |                                                   | The axis line.                                                                      |
| `ui-chart-axis__tick`                | slot      |                                                   | A tick mark.                                                                        |
| `ui-chart-axis__label`               | slot      |                                                   | A tick label.                                                                       |
| `ui-chart-axis__grid`                | slot      |                                                   | A grid line across the drawing.                                                     |
| `ui-chart__plot-frame`               | slot      |                                                   | Container for a positioned legend and its plot.                                     |
| `ui-chart__legend`                   | slot      |                                                   | Positioned legend inside the plot frame.                                            |
| `data-placement`                     | attribute | `ChartLegendPlacement`                            | Requested legend position.                                                          |
| `data-swatch`                        | attribute | `line`, `dashed`, `band`                          | Geometry represented by a legend swatch.                                            |
| `data-highlighted`                   | state     | `true`                                            | Trace, reference, point, cursor or marker emphasized by the current row.            |
| `ui-chart-legend`                    | root      |                                                   | `ChartLegend`'s group.                                                              |
| `ui-chart-legend__item`              | slot      |                                                   | A series' toggle button.                                                            |
| `ui-chart-legend__swatch`            | slot      |                                                   | The item's decorative color mark.                                                   |
| `ui-chart-legend__label`             | slot      |                                                   | The item's label.                                                                   |
| `data-view`                          | state     | `chart`, `table`                                  | The view the chart shows.                                                           |
| `data-layout`                        | attribute | `grouped`, `stacked`                              | How a bar chart sets out a category's bars.                                         |
| `data-orientation`                   | attribute | `vertical`, `horizontal`                          | The direction of a bar chart's bars; also on the legend group (React Aria).         |
| `data-variant`                       | attribute | `line`, `area`                                    | Lines, or lines over areas.                                                         |
| `data-position`                      | attribute | `bottom`, `left`                                  | The edge an axis runs along.                                                        |
| `data-kind`                          | attribute | `line`, `band`                                    | A reference's shape.                                                                |
| `data-axis`                          | attribute | `x`, `y`                                          | Axis of a reference or differential cursor. Y runs up the plot and X across it.     |
| `data-series`                        | attribute |                                                   | The position of a mark's series, from 0.                                            |
| `data-tone`                          | attribute | `neutral`, `info`, `success`, `warning`, `danger` | A series' or reference's tone, when it has one.                                     |
| `data-level`                         | attribute |                                                   | A heatmap day's or legend swatch's intensity level, from 0 to `levels`.             |
| `data-state`                         | attribute | `value`, `missing`, `absent`                      | Whether a heatmap day has a value, was given without one, or was not given.         |
| `data-outlier`                       | attribute | `low`, `high`                                     | A heatmap value beyond its bounds, drawn at the nearest level.                      |
| `data-active`                        | state     | `true`                                            | The value hovered or focused, whose tooltip shows.                                  |
| `data-empty`                         | state     | `true`                                            | The chart draws no value.                                                           |
| `data-selected`                      | state     | `true`                                            | A shown series' legend item, or the view toggle while the table shows (React Aria). |
| `data-hovered`                       | state     | `true`                                            | The pointer is over a legend item or the view toggle (React Aria).                  |
| `data-pressed`                       | state     | `true`                                            | A legend item or the view toggle is pressed (React Aria).                           |
| `data-focused`                       | state     | `true`                                            | A legend item or the view toggle has focus (React Aria).                            |
| `data-focus-visible`                 | state     | `true`                                            | A legend item or the view toggle has keyboard focus (React Aria).                   |
| `data-disabled`                      | state     | `true`                                            | A legend item or the view toggle is disabled (React Aria).                          |
| `ui-sparkline`                       | root      |                                                   | The `<svg>` (`role="img"`).                                                         |
| `ui-sparkline__area`                 | slot      |                                                   | The filled area, for `variant="area"`.                                              |
| `ui-sparkline__line`                 | slot      |                                                   | The line through the values.                                                        |
| `ui-sparkline__dot`                  | slot      |                                                   | A finite value with no finite neighbour.                                            |
| `ui-sparkline__marker`               | slot      |                                                   | A dot on a marked value.                                                            |
| `data-variant`                       | attribute | `line`, `area`                                    | Line or filled area.                                                                |
| `data-marker`                        | attribute | `min`, `max`, `last`                              | Which value a marker marks.                                                         |
| `data-empty`                         | state     | `true`                                            | The series has no finite value.                                                     |
| `ui-chart__viewport`                 | slot      |                                                   | Focusable plot and context menu target.                                             |
| `ui-event-chart`                     | root      |                                                   | Numeric event figure.                                                               |
| `ui-event-chart__event`              | slot      |                                                   | Individually focusable point or interval.                                           |
| `ui-linked-line-chart`               | root      |                                                   | Linked numeric channels.                                                            |
| `ui-linked-line-chart__channel`      | slot      |                                                   | Named channel region.                                                               |
| `ui-linked-line-chart__line`         | slot      |                                                   | Measured trace.                                                                     |
| `ui-linked-line-chart__comparison`   | slot      |                                                   | Reference trace.                                                                    |
| `ui-linked-line-chart__envelope`     | slot      |                                                   | Sampled error band.                                                                 |
| `ui-linked-line-chart__cursor`       | slot      |                                                   | Movable cursor.                                                                     |
| `ui-linked-line-chart__delta-band`   | slot      |                                                   | Shaded pair interval with `data-key`, `data-axis` and `data-highlighted`.           |
| `ui-linked-line-chart__delta-value`  | slot      |                                                   | Signed difference and its formatted endpoints.                                      |
| `ui-linked-line-chart__differential` | slot      |                                                   | Differential endpoint slider, guide and diamond.                                    |
| `data-endpoint`                      | attribute | `from`, `to`                                      | Start or end of a differential pair.                                                |
| `data-snapped`                       | state     | `true`                                            | Endpoint follows a source.                                                          |
| `ui-linked-line-chart__marker`       | slot      |                                                   | Movable marker.                                                                     |
| `ui-linked-line-chart__measurements` | slot      |                                                   | Scrollable table of cursor, reference and point readings.                           |
| `ui-linked-line-chart__position`     | slot      |                                                   | In-place movable position editor.                                                   |
| `data-display-value`                 | attribute |                                                   | Saved cursor name or formatted position that sizes the readout cell.                |
| `ui-linked-line-chart__mark-name`    | slot      |                                                   | Keyboard context menu target for a cursor reading row.                              |
| `ui-linked-line-chart__x-label`      | slot      |                                                   | Visible horizontal axis title for one channel.                                      |
| `ui-linked-line-chart__row-action`   | slot      |                                                   | Keyboard selection button in a fixed or calculated row.                             |
| `ui-linked-line-chart__sample-ring`  | slot      |                                                   | Ring on a selected measurement sample.                                              |
| `ui-linked-line-chart__range`        | slot      |                                                   | Selected measurement interval in source coordinates.                                |
| `ui-linked-line-chart__point`        | slot      |                                                   | Named fixed channel point.                                                          |
| `ui-linked-line-chart__fixed-label`  | slot      |                                                   | Fixed annotation label in the readout.                                              |
| `ui-linked-line-chart__sample-x`     | slot      |                                                   | Nearest sample coordinate when it differs from the mark.                            |
| `data-mark-id`                       | attribute |                                                   | Internal typed identity on a movable mark.                                          |
| `data-coordinate`                    | attribute |                                                   | Source coordinate on the mark’s axis.                                               |
| `data-dragging`                      | state     | `true`                                            | The movable cursor or marker being dragged in this channel.                         |
| `data-gesture`                       | attribute |                                                   | Available or active pointer gesture on a numeric viewport.                          |
| `data-range-start`                   | attribute |                                                   | First visible x coordinate on the viewport.                                         |
| `data-range-end`                     | attribute |                                                   | Last visible x coordinate on the viewport.                                          |
| `ui-chart__selection`                | slot      |                                                   | Preview of a horizontal zoom selection.                                             |
| `data-x-scale`                       | attribute | `linear`, `log`                                   | Numeric x scale on the event or linked chart root.                                  |
| `data-y-scale`                       | attribute | `linear`, `log`                                   | Amplitude scale of a linked channel.                                                |
| `data-key`                           | attribute |                                                   | Host key on a channel, fixed point or legend swatch.                                |
