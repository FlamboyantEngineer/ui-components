import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useNumberFormatter } from '../../primitives/index.js';
import { mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Chart } from './chart.js';
import { chartHooks, donutChartHooks } from './chart-hooks.js';
import { ChartLegend, useHiddenKeys } from './chart-legend.js';
import { ChartTooltip, useChartPoints } from './chart-points.js';
import { resolveDonutGeometry } from './donut-geometry.js';
import { toDonutTable } from './donut-table.js';
const shareFormat = { style: 'percent', maximumFractionDigits: 1 };
/** The slices around the total, each slice a focusable value with a tooltip. */
function DonutPlot({ geometry, diameter, segments, formats, }) {
    const strings = useUiStrings();
    const { slices, total } = geometry;
    const points = useChartPoints(slices.map(({ key, index }) => ({ key, index, series: 0 })));
    const active = slices.find((slice) => slice.key === points.activeKey);
    const centre = diameter / 2;
    return (_jsxs(_Fragment, { children: [_jsxs("svg", { ...chartHooks.slot('plot'), role: "group", width: diameter, height: diameter, viewBox: `0 0 ${diameter} ${diameter}`, children: [slices.map((slice) => {
                        const segment = segments[slice.series];
                        return (_jsx("path", { ...donutChartHooks.slot('slice', {
                                series: slice.series,
                                tone: segment.tone,
                                active: slice.key === points.activeKey,
                            }), ...points.getPointProps({ key: slice.key, index: slice.index, series: 0 }), role: "img", "aria-label": strings.donutSegment(segment.label, formats.value.format(slice.value), formats.share.format(slice.share)), d: slice.path }, slice.key));
                    }), _jsx("text", { ...donutChartHooks.slot('total'), x: centre, y: centre, textAnchor: "middle", dominantBaseline: "middle", "aria-hidden": "true", children: strings.totalCount(formats.value.format(total)) })] }), _jsx(ChartTooltip, { activeKey: points.activeKey, anchor: points.anchor, label: active ? segments[active.series].label : '', series: active?.series ?? 0, tone: active ? segments[active.series].tone : undefined, value: active
                    ? `${formats.value.format(active.value)} (${formats.share.format(active.share)})`
                    : '' })] }));
}
/**
 * A donut chart of the parts of a whole, with the total in the middle. Each slice is a named,
 * focusable value with a tooltip; the legend shows and hides segments, and the values can be shown
 * as a table.
 */
export function DonutChart({ label, segments, diameter = 160, formatOptions, categoryLabel, summary, showSummary, showLegend = true, hiddenKeys, defaultHiddenKeys, onHiddenKeysChange, className, ...rest }) {
    const strings = useUiStrings();
    const formats = {
        value: useNumberFormatter(formatOptions),
        share: useNumberFormatter(shareFormat),
    };
    const [hidden, setHidden] = useHiddenKeys({ hiddenKeys, defaultHiddenKeys, onHiddenKeysChange });
    const geometry = resolveDonutGeometry({
        values: segments
            .map(({ value, id }, series) => ({ series, value, id }))
            .filter(({ id }) => !hidden.has(id)),
        diameter,
    });
    const largest = geometry.slices.reduce((best, slice) => (!best || slice.value > best.value ? slice : best), undefined);
    const generated = largest
        ? strings.donutSummary(formats.value.format(geometry.total), segments[largest.series].label, formats.share.format(largest.share))
        : strings.noData;
    return (_jsx(Chart, { ...rest, "data-empty": largest ? undefined : true, className: mergeClassNames(donutChartHooks.className, className), label: label, summary: summary ?? generated, showSummary: showSummary, table: toDonutTable(segments, {
            formats,
            headings: [categoryLabel ?? strings.chartCategory, strings.chartAmount, strings.chartShare],
        }), legend: showLegend ? (_jsx(ChartLegend, { items: segments, hiddenKeys: hidden, onHiddenKeysChange: setHidden })) : null, children: largest ? (_jsx(DonutPlot, { geometry: geometry, diameter: diameter, segments: segments, formats: formats })) : (_jsx("p", { ...chartHooks.slot('empty'), children: strings.noData })) }));
}
//# sourceMappingURL=donut-chart.js.map