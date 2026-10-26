import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLocale, useNumberFormatter } from '../../primitives/index.js';
import { mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { createBarValueScale, resolveBarGeometry, } from './bar-geometry.js';
import { Chart } from './chart.js';
import { resolvePlotBox } from './chart-layout.js';
import { ChartAxis } from './chart-axis.js';
import { barChartHooks, chartHooks } from './chart-hooks.js';
import { ChartLegend, useHiddenKeys } from './chart-legend.js';
import { ChartTooltip, useChartPoints } from './chart-points.js';
import { useValueSummary } from './chart-summary.js';
import { useChartFrame, useLabelMargin } from './use-chart-box.js';
/** The axes and the bars, each bar a focusable value with a tooltip. */
function BarPlot({ geometry, width, height, categories, series, orientation, format, }) {
    const strings = useUiStrings();
    const isVertical = orientation === 'vertical';
    const points = useChartPoints(geometry.bars, !isVertical);
    const { plot, bars, values, bands } = geometry;
    const active = bars.find((bar) => bar.key === points.activeKey);
    const valueAxis = isVertical
        ? { position: 'left', offset: plot.left, range: [plot.bottom, plot.top] }
        : { position: 'bottom', offset: plot.bottom, range: [plot.left, plot.right] };
    const categoryAxis = isVertical
        ? { position: 'bottom', offset: plot.bottom, range: [plot.left, plot.right] }
        : { position: 'left', offset: plot.left, range: [plot.top, plot.bottom] };
    return (_jsxs(_Fragment, { children: [_jsxs("svg", { ...chartHooks.slot('plot'), role: "group", width: width, height: height, viewBox: `0 0 ${width} ${height}`, children: [_jsx(ChartAxis, { ...valueAxis, ticks: values.ticks(), gridLength: isVertical ? plot.right - plot.left : plot.bottom - plot.top }), _jsx(ChartAxis, { ...categoryAxis, ticks: bands.ticks() }), bars.map((bar) => {
                        const entry = series[bar.series];
                        return (_jsx("rect", { ...barChartHooks.slot('bar', {
                                series: bar.series,
                                tone: entry.tone,
                                active: bar.key === points.activeKey,
                            }), ...points.getPointProps(bar), role: "img", "aria-label": strings.chartValue(entry.label, categories[bar.index], format.format(bar.value)), x: bar.x, y: bar.y, width: bar.width, height: bar.height }, bar.key));
                    })] }), _jsx(ChartTooltip, { activeKey: points.activeKey, anchor: points.anchor, title: active ? categories[active.index] : '', label: active ? series[active.series].label : '', series: active?.series ?? 0, tone: active ? series[active.series].tone : undefined, value: active ? format.format(active.value) : '' })] }));
}
/** The bars laid out with room on the left for the widest left-axis label. */
function useBarGeometry(element, input) {
    const { locale } = useLocale();
    const margin = { top: 8, right: 16, bottom: 24 };
    const plot = resolvePlotBox(input.width, input.height, { ...margin, left: 0 });
    const values = input.orientation === 'vertical'
        ? createBarValueScale({ ...input, locale, margin: { ...margin, left: 0 } }, plot)
        : undefined;
    const left = useLabelMargin(element, values ? values.ticks().map((tick) => tick.label) : input.categories);
    return resolveBarGeometry({ ...input, locale, margin: { ...margin, left } }, values);
}
function toBarTable({ categories, series, categoryLabel, }, format) {
    return {
        columns: [categoryLabel, ...series.map((entry) => entry.label)],
        rows: categories.map((category, index) => [
            category,
            ...series.map((entry) => {
                const value = entry.values[index];
                return value !== undefined && Number.isFinite(value) ? format.format(value) : '';
            }),
        ]),
    };
}
/**
 * A bar chart of one or more series over categories, grouped or stacked, vertical or horizontal,
 * on a value axis that starts at zero. Each bar is a named, focusable value with a tooltip; the
 * legend shows and hides series, and the values can be shown as a table.
 */
export function BarChart({ label, categories, series, layout = 'grouped', orientation = 'vertical', height = 240, formatOptions, categoryLabel, summary, showSummary, showLegend = series.length > 1, hiddenKeys, defaultHiddenKeys, onHiddenKeysChange, className, ref, ...rest }) {
    const strings = useUiStrings();
    const { width, element, frameRef } = useChartFrame(ref);
    const format = useNumberFormatter(formatOptions);
    const [hidden, setHidden] = useHiddenKeys({ hiddenKeys, defaultHiddenKeys, onHiddenKeysChange });
    const drawn = series
        .map((entry, index) => ({ series: index, values: entry.values, id: entry.id }))
        .filter((entry) => !hidden.has(entry.id));
    const geometry = useBarGeometry(element, {
        categories,
        series: drawn,
        layout,
        orientation,
        width,
        height,
        formatOptions,
    });
    const generated = useValueSummary({
        values: geometry.bars.map((bar) => bar.value),
        series: drawn.length,
        format,
    });
    const isEmpty = geometry.bars.length === 0;
    return (_jsx(Chart, { ...rest, ref: frameRef, "data-layout": layout, "data-orientation": orientation, "data-empty": isEmpty || undefined, className: mergeClassNames(barChartHooks.className, className), label: label, summary: summary ?? generated, showSummary: showSummary, table: toBarTable({ categories, series, categoryLabel: categoryLabel ?? strings.chartCategory }, format), legend: showLegend ? (_jsx(ChartLegend, { items: series, hiddenKeys: hidden, onHiddenKeysChange: setHidden })) : null, children: isEmpty ? (_jsx("p", { ...chartHooks.slot('empty'), children: strings.noData })) : (_jsx(BarPlot, { geometry: geometry, width: width, height: height, categories: categories, series: series, orientation: orientation, format: format })) }));
}
//# sourceMappingURL=bar-chart.js.map