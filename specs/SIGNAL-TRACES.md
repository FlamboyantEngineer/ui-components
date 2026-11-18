# Signal Traces

`SignalTraces` draws sampled signals as channels stacked over one shared numeric time axis, each on its own value scale, with a time range the reader pans and zooms and two linked time cursors whose readings show in a table. The host owns every policy: it acquires and reduces the samples to what the view draws, picks the data window, units and formats, and may control the visible range and the cursors. Times and values are plain numbers in the caller's units, so a window of a few hundred nanoseconds draws as well as one of hours.

## UIC-SIGNAL-TRACES-1 - Drawing

### UIC-SIGNAL-TRACES-1.1 - Parts

`SignalTraces` shall render a `ui-signal-traces` group holding, in order, a `ui-signal-traces__toolbar` with the zoom buttons and the visible range ([UIC-SIGNAL-TRACES-2.3](#uic-signal-traces-23---keyboard-and-buttons)), a `ui-signal-traces__plot` holding the `ui-signal-traces__drawing` SVG (hidden from assistive technology) and the cursor handles, then the readings table and the time difference ([UIC-SIGNAL-TRACES-3.2](#uic-signal-traces-32---readings)). It appends the caller's `className`, forwards `id`, `ref`, labelling and caller `data-*` attributes to the root, and caller attributes never replace a hook attribute.

Implementation: `src/components/signal-traces/signal-traces.tsx`, `src/components/signal-traces/signal-plot.tsx`, `src/components/signal-traces/signal-traces-hooks.ts`
Verification: `src/components/signal-traces/signal-traces.test.tsx`, `e2e/signal-traces.spec.ts`

### UIC-SIGNAL-TRACES-1.2 - Channels

Each entry of `channels` shall draw a `ui-signal-traces__channel` band, in order from the top, publishing its position in `data-channel`: its `label` in `ui-signal-traces__label`, followed by its `unit` in parentheses in `ui-signal-traces__unit` when it has one, over a plotted area `channelHeight` pixels tall (96 by default). Each channel has its own value scale, a nice linear scale over the lowest and highest finite values of its samples, reference and envelope, drawn as a left [chart axis](CHART.md#uic-chart-3---axis) carrying `ui-signal-traces__value-axis`, about one tick every 32 pixels, with grid lines across the band. A channel whose values are all equal spreads its scale by a tenth of that value on each side (by 1 around zero). The plot is as wide as its measured width (480 pixels before it is measured); the left gutter fits the widest value label (measured in the root's font, or estimated at 7 pixels a character) plus 12 pixels.

Implementation: `src/components/signal-traces/signal-channel.tsx`, `src/components/signal-traces/signal-layout.ts`, `src/components/signal-traces/signal-model.ts`, `src/components/signal-traces/signal-traces.tsx`
Verification: `src/components/signal-traces/signal-traces.test.tsx`, `src/components/signal-traces/signal-model.test.ts`, `e2e/signal-traces.spec.ts`

### UIC-SIGNAL-TRACES-1.3 - Shared time axis

One `ui-signal-traces__time-axis` [chart axis](CHART.md#uic-chart-3---axis) shall run under the last channel over the visible range, shared by every channel, about one tick every 100 pixels. Its labels are written by `formatTime` when given, and otherwise for the locale with as many decimals as the tick step has, so a sub-microsecond step still reads exactly.

Implementation: `src/components/signal-traces/signal-traces.tsx`, `src/components/signal-traces/signal-plot.tsx`
Verification: `src/components/signal-traces/signal-traces.test.tsx`, `e2e/signal-traces.spec.ts`

### UIC-SIGNAL-TRACES-1.4 - Traces, references and envelopes

A channel shall draw its `samples` as a `ui-signal-traces__trace` path, its `reference`, when given, as a `ui-signal-traces__reference` path (which the host stylesheet dashes), and its `envelope`, when given, as a `ui-signal-traces__envelope` shape filled between each sample's `lower` and `upper` bound, each publishing the channel's `data-channel`, drawn under the trace and clipped to the channel's band. Samples are display samples in increasing time order, drawn as given: the host reduces them to what the view needs, and only those inside the visible range, with one beyond each end, are drawn. A sample whose `value` is `null` or not a finite number breaks the trace and the reference there, and an envelope sample with a bound that is not finite breaks the envelope; no path holds coordinates that are not numbers.

Implementation: `src/components/signal-traces/signal-channel.tsx`, `src/components/signal-traces/signal-model.ts`
Verification: `src/components/signal-traces/signal-model.test.ts`, `src/components/signal-traces/signal-traces.test.tsx`, `e2e/signal-traces.spec.ts`

### UIC-SIGNAL-TRACES-1.5 - Empty channels

A channel without samples shall publish `data-empty` on its band, draw the provider's `noData` string in a `ui-signal-traces__empty` text in the middle of the band, keep its label and a value scale from 0 to 1 (or over its reference and envelope), and leave its readings blank. The other channels draw as usual.

Implementation: `src/components/signal-traces/signal-channel.tsx`, `src/components/signal-traces/signal-readout.tsx`
Verification: `src/components/signal-traces/signal-traces.test.tsx`, `e2e/signal-traces.spec.ts`

## UIC-SIGNAL-TRACES-2 - Time range

### UIC-SIGNAL-TRACES-2.1 - Controlled range

The visible time range shall be controlled with `range` and `onRangeChange` or held from `defaultRange` (the whole `domain`, the data window, by default). The range shown is always fitted to the window: its ends in order, no wider than the window, no narrower than its minimum span (a millionth of the window, and at least 64 representable steps at the window's magnitude, so floating-point rounding never collapses it) and shifted inside the window. `onRangeChange` receives the fitted range a pan, zoom or reset asks for, and is not called when that range is the one shown. A `domain` whose ends are reversed reads in order, one whose ends are equal spans half a unit on each side, and one that is not finite reads as `[0, 1]`.

Implementation: `src/components/signal-traces/use-signal-view.ts`, `src/components/signal-traces/signal-model.ts`
Verification: `src/components/signal-traces/signal-traces.test.tsx`, `src/components/signal-traces/signal-model.test.ts`

### UIC-SIGNAL-TRACES-2.2 - Pointer and wheel

Dragging the plot with the primary pointer shall pan the range, keeping the time under the pointer where it was. The wheel with Ctrl or Meta held, which a trackpad pinch also sends, zooms around the time under the pointer, doubling or halving the span every 200 pixels of travel; a mostly sideways wheel pans by its travel. A plain vertical wheel is left to the page, so the traces never trap page scrolling. Presses on a cursor handle move the cursor instead of panning.

Implementation: `src/components/signal-traces/use-plot-gestures.ts`
Verification: `src/components/signal-traces/signal-traces.test.tsx`, `e2e/signal-traces.spec.ts`

### UIC-SIGNAL-TRACES-2.3 - Keyboard and buttons

The plot shall be one tab stop, a group named by the provider's `signalPlot` string and described by the visible range and the `signalPlotHint` string. While it has focus, the left and right arrow keys pan by a tenth of the span, `+` (or `=`) halves the span and `-` (or `_`) doubles it around the middle, and `0` shows the whole window; keys with Alt, Ctrl or Meta held, and keys on a cursor handle, are left alone. The toolbar's `ui-signal-traces__zoom-in`, `ui-signal-traces__zoom-out` and `ui-signal-traces__reset` buttons, named by the provider's `zoomIn`, `zoomOut` and `resetZoom` strings, do the same; zoom in is disabled at the minimum span, and zoom out and reset while the whole window shows. The `ui-signal-traces__range` text shows the visible range by the `signalTimeRange` string from both ends written by `formatTime`.

Implementation: `src/components/signal-traces/use-plot-gestures.ts`, `src/components/signal-traces/signal-toolbar.tsx`, `src/components/signal-traces/signal-plot.tsx`, `src/core/strings/signal.ts`
Verification: `src/components/signal-traces/signal-traces.test.tsx`, `e2e/signal-traces.spec.ts`

### UIC-SIGNAL-TRACES-2.4 - Changed data window

When `domain` changes to a different window, a held range and held cursors shall start again from the whole new window, with the cursors at a third and two thirds of it; `defaultRange` and `defaultCursors` apply only to the window the traces mounted with. A controlled range and controlled cursors stay the caller's, fitted to and kept inside the new window as they draw.

Implementation: `src/components/signal-traces/use-signal-view.ts`
Verification: `src/components/signal-traces/signal-traces.test.tsx`, `e2e/signal-traces.spec.ts`

## UIC-SIGNAL-TRACES-3 - Cursors

### UIC-SIGNAL-TRACES-3.1 - Linked cursors

Two cursors shall mark times across every channel at once, controlled with `cursors` and `onCursorsChange` (both times, the first and the second cursor) or held from `defaultCursors` (a third and two thirds of the initial range by default), and kept inside the data window. Each cursor inside the visible range draws a `ui-signal-traces__cursor-line` from the first channel's top to the time axis, and each has a `ui-signal-traces__cursor` handle, both publishing `data-cursor` (`1` or `2`). The handle is a slider named by the provider's `signalCursor` string, over the data window, whose value text is its time written by `formatTime`: the arrow keys move it by a hundredth of the visible span, Page Up and Page Down by a tenth, Home and End to the visible range's ends, and dragging it moves it to the time under the pointer, within the visible range. A cursor outside the visible range draws no line and keeps its handle at the nearer edge of the plot with `data-outside`.

Implementation: `src/components/signal-traces/signal-cursor.tsx`, `src/components/signal-traces/signal-plot.tsx`, `src/components/signal-traces/use-signal-view.ts`
Verification: `src/components/signal-traces/signal-traces.test.tsx`, `e2e/signal-traces.spec.ts`

### UIC-SIGNAL-TRACES-3.2 - Readings

A `ui-signal-traces__readout` table named by the provider's `signalReadings` string shall list, under a column of channels headed by `signalChannel` and one column per cursor headed by `signalCursor`, a row of the cursor times headed by `signalTime`, then a row per channel, headed by its label and unit, with the value of its sample nearest each cursor (the earlier one when two are equally near) written by `formatValue`, or nothing when that sample is a gap. A `ui-signal-traces__delta` text then shows the second cursor's time minus the first's by the `signalTimeDifference` string, written by `formatTime`. Without formatters, times and values are written for the locale with up to six significant digits.

Implementation: `src/components/signal-traces/signal-readout.tsx`, `src/components/signal-traces/signal-model.ts`, `src/core/strings/signal.ts`
Verification: `src/components/signal-traces/signal-traces.test.tsx`, `src/components/signal-traces/signal-model.test.ts`, `e2e/signal-traces.spec.ts`

## Hooks

| Hook                            | Kind      | Values   | Description                                                               |
| ------------------------------- | --------- | -------- | ------------------------------------------------------------------------- |
| `ui-signal-traces`              | root      |          | The group.                                                                |
| `ui-signal-traces__toolbar`     | slot      |          | The zoom buttons and the visible range.                                   |
| `ui-signal-traces__zoom-in`     | slot      |          | The zoom in button.                                                       |
| `ui-signal-traces__zoom-out`    | slot      |          | The zoom out button.                                                      |
| `ui-signal-traces__reset`       | slot      |          | The button that shows the whole data window.                              |
| `ui-signal-traces__range`       | slot      |          | The visible range as text.                                                |
| `ui-signal-traces__plot`        | slot      |          | The focusable drawing and its cursor handles.                             |
| `ui-signal-traces__drawing`     | slot      |          | The `<svg>`.                                                              |
| `ui-signal-traces__channel`     | slot      |          | A channel's band.                                                         |
| `ui-signal-traces__label`       | slot      |          | A channel's label above its band.                                         |
| `ui-signal-traces__unit`        | slot      |          | A channel's unit, beside its label and in the readings.                   |
| `ui-signal-traces__value-axis`  | slot      |          | A channel's value axis, alongside `ui-chart-axis`.                        |
| `ui-signal-traces__time-axis`   | slot      |          | The shared time axis, alongside `ui-chart-axis`.                          |
| `ui-signal-traces__envelope`    | slot      |          | A channel's shaded band between its lower and upper bounds.               |
| `ui-signal-traces__reference`   | slot      |          | A channel's reference series.                                             |
| `ui-signal-traces__trace`       | slot      |          | A channel's samples.                                                      |
| `ui-signal-traces__empty`       | slot      |          | The no-data text of a channel without samples.                            |
| `ui-signal-traces__cursor-line` | slot      |          | A cursor's line across the channels.                                      |
| `ui-signal-traces__cursor`      | slot      |          | A cursor's handle (`role="slider"`).                                      |
| `ui-signal-traces__readout`     | slot      |          | The table of readings at the cursors.                                     |
| `ui-signal-traces__delta`       | slot      |          | The time difference between the cursors.                                  |
| `data-channel`                  | attribute |          | The position of a channel's band and marks, from 0.                       |
| `data-cursor`                   | attribute | `1`, `2` | Which cursor a line or handle belongs to.                                 |
| `data-empty`                    | state     | `true`   | A channel has no samples.                                                 |
| `data-outside`                  | state     | `true`   | A cursor's time lies outside the visible range; its handle is at an edge. |
