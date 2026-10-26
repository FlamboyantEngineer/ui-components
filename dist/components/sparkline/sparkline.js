import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { useNumberFormatter } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { resolveSparklineGeometry, } from './sparkline-geometry.js';
const hooks = createHooks('sparkline', ['area', 'line', 'marker']);
/** The text that describes the series: its lowest, highest and last values, or that it has none. */
function useSeriesSummary(points, formatOptions) {
    const strings = useUiStrings();
    const { min, max, last } = points;
    const format = useNumberFormatter(formatOptions);
    if (!min || !max || !last)
        return strings.noData;
    return strings.seriesSummary({
        low: format.format(min.value),
        high: format.format(max.value),
        last: format.format(last.value),
    });
}
/**
 * A word-sized drawing of a series of numbers with no axes, such as a week of daily counts, named
 * by its label and described by its lowest, highest and last values.
 */
export function Sparkline({ values, variant = 'line', markers = [], minValue, maxValue, width = 80, height = 24, formatOptions, className, 'aria-describedby': describedBy, ...rest }) {
    const summaryId = useId();
    const geometry = resolveSparklineGeometry({ values, width, height, minValue, maxValue });
    const summary = useSeriesSummary(geometry.points, formatOptions);
    const isEmpty = geometry.points.last === undefined;
    return (_jsxs("svg", { ...rest, ...hooks.root({ className, data: { variant, empty: isEmpty } }), role: "img", "aria-describedby": describedBy ? `${summaryId} ${describedBy}` : summaryId, width: width, height: height, viewBox: `0 0 ${width} ${height}`, focusable: "false", children: [_jsx("desc", { id: summaryId, children: summary }), variant === 'area' && !isEmpty ? _jsx("path", { ...hooks.slot('area'), d: geometry.area }) : null, isEmpty ? null : _jsx("path", { ...hooks.slot('line'), d: geometry.line, fill: "none" }), markers.map((marker) => {
                const point = geometry.points[marker];
                return point ? (_jsx("circle", { ...hooks.slot('marker', { marker }), cx: point.x, cy: point.y, r: 2 }, marker)) : null;
            })] }));
}
//# sourceMappingURL=sparkline.js.map