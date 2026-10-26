import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { getLocalTimeZone, useLocale, useNumberFormatter } from '../../primitives/index.js';
import { mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Chart } from './chart.js';
import { ChartAxis } from './chart-axis.js';
import { chartHooks, lineChartHooks } from './chart-hooks.js';
import { ChartLegend, useHiddenKeys } from './chart-legend.js';
import { ChartTooltip, useChartPoints } from './chart-points.js';
import { useValueSummary } from './chart-summary.js';
import { createLineValueScale, resolveLineGeometry, } from './line-geometry.js';
import { resolvePlotBox } from './chart-layout.js';
import { toLineTable } from './line-table.js';
import { useChartFrame, useLabelMargin } from './use-chart-box.js';
/** The axes, areas, lines and points, each point a focusable value with a tooltip. */
function LinePlot({ geometry, width, height, series, variant, format }) {
    const strings = useUiStrings();
    const { plot, lines, xAxis, yTicks } = geometry;
    const all = lines.flatMap((line) => line.points);
    const points = useChartPoints(all);
    const active = all.find((point) => point.key === points.activeKey);
    const seriesData = (index) => ({ series: index, tone: series[index].tone });
    return (_jsxs(_Fragment, { children: [_jsxs("svg", { ...chartHooks.slot('plot'), role: "group", width: width, height: height, viewBox: `0 0 ${width} ${height}`, children: [_jsx(ChartAxis, { position: "left", offset: plot.left, range: [plot.bottom, plot.top], ticks: yTicks, gridLength: plot.right - plot.left }), _jsx(ChartAxis, { position: "bottom", offset: plot.bottom, range: [plot.left, plot.right], ticks: xAxis.ticks }), variant === 'area'
                        ? lines.map((line) => (_jsx("path", { ...lineChartHooks.slot('area', seriesData(line.series)), d: line.area }, `area:${line.series}`)))
                        : null, lines.map((line) => (_jsx("path", { ...lineChartHooks.slot('line', seriesData(line.series)), d: line.line, fill: "none" }, `line:${line.series}`))), all.map((point) => (_jsx("circle", { ...lineChartHooks.slot('point', {
                            ...seriesData(point.series),
                            active: point.key === points.activeKey,
                        }), ...points.getPointProps(point), role: "img", "aria-label": strings.chartValue(series[point.series].label, xAxis.format(point.at), format.format(point.value)), cx: point.x, cy: point.y, r: 3 }, point.key)))] }), _jsx(ChartTooltip, { activeKey: points.activeKey, anchor: points.anchor, title: active ? xAxis.format(active.at) : '', label: active ? series[active.series].label : '', series: active?.series ?? 0, tone: active ? series[active.series].tone : undefined, value: active ? format.format(active.value) : '' })] }));
}
/** The lines laid out with room on the left for the widest value label. */
function useLineGeometry(element, input) {
    const { locale } = useLocale();
    const margin = { top: 8, right: 24, bottom: 24 };
    const plot = resolvePlotBox(input.width, input.height, { ...margin, left: 0 });
    const values = createLineValueScale({ ...input, locale, margin: { ...margin, left: 0 } }, plot);
    const left = useLabelMargin(element, values.ticks().map((tick) => tick.label));
    return resolveLineGeometry({ ...input, locale, margin: { ...margin, left } }, values);
}
/**
 * A line chart of one or more series over dates (a time axis) or numbers (a linear axis), drawn as
 * lines or filled areas. Each point is a named, focusable value with a tooltip; the legend shows
 * and hides series, and the values can be shown as a table.
 */
export function LineChart({ label, series, variant = 'line', height = 240, minValue, maxValue, formatOptions, timeZone = getLocalTimeZone(), categoryLabel, summary, showSummary, showLegend = series.length > 1, hiddenKeys, defaultHiddenKeys, onHiddenKeysChange, className, ref, ...rest }) {
    const strings = useUiStrings();
    const { width, element, frameRef } = useChartFrame(ref);
    const format = useNumberFormatter(formatOptions);
    const [hidden, setHidden] = useHiddenKeys({ hiddenKeys, defaultHiddenKeys, onHiddenKeysChange });
    const drawn = series
        .map((entry, index) => ({ series: index, points: entry.points, id: entry.id }))
        .filter((entry) => !hidden.has(entry.id));
    const geometry = useLineGeometry(element, {
        series: drawn,
        width,
        height,
        minValue,
        maxValue,
        timeZone,
        formatOptions,
    });
    const values = geometry.lines.flatMap((line) => line.points.map((point) => point.value));
    const generated = useValueSummary({ values, series: drawn.length, format });
    const isEmpty = values.length === 0;
    return (_jsx(Chart, { ...rest, ref: frameRef, "data-variant": variant, "data-empty": isEmpty || undefined, className: mergeClassNames(lineChartHooks.className, className), label: label, summary: summary ?? generated, showSummary: showSummary, table: toLineTable(series, {
            xAxis: geometry.xAxis,
            format,
            categoryLabel: categoryLabel ?? strings.chartCategory,
        }), legend: showLegend ? (_jsx(ChartLegend, { items: series, hiddenKeys: hidden, onHiddenKeysChange: setHidden })) : null, children: isEmpty ? (_jsx("p", { ...chartHooks.slot('empty'), children: strings.noData })) : (_jsx(LinePlot, { geometry: geometry, width: width, height: height, series: series, variant: variant, format: format })) }));
}
//# sourceMappingURL=line-chart.js.map