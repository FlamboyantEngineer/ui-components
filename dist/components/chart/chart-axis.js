import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { chartAxisHooks as hooks } from './chart-hooks.js';
/** Length of a tick mark and the gap between it and its label, in pixels. */
const tickLength = 4;
const labelGap = 8;
/**
 * An SVG axis from a scale's ticks: a line along one edge of the drawing, a mark and a label at
 * each tick, and optional grid lines across the drawing. It is decorative: a chart names its
 * values and lists them in its table.
 */
export function ChartAxis({ position, ticks, offset, range, gridLength = 0, className, ...rest }) {
    const isBottom = position === 'bottom';
    const along = (at, across) => isBottom ? { x: at, y: across } : { x: across, y: at };
    const line = (at, from, to) => {
        const start = along(at, from);
        const end = along(at, to);
        return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
    };
    const towardGrid = isBottom ? -1 : 1;
    return (_jsxs("g", { ...rest, ...hooks.root({ className, data: { position } }), "aria-hidden": "true", children: [gridLength > 0
                ? ticks.map((tick) => (_jsx("line", { ...hooks.slot('grid'), ...line(tick.position, offset, offset + towardGrid * gridLength) }, `grid:${toKeyIdentity(tick.value)}`)))
                : null, _jsx("line", { ...hooks.slot('line'), ...(isBottom
                    ? { x1: range[0], y1: offset, x2: range[1], y2: offset }
                    : { x1: offset, y1: range[0], x2: offset, y2: range[1] }) }), ticks.map((tick) => (_jsxs("g", { children: [_jsx("line", { ...hooks.slot('tick'), ...line(tick.position, offset, offset - towardGrid * tickLength) }), _jsx("text", { ...hooks.slot('label'), ...along(tick.position, offset - towardGrid * labelGap), textAnchor: isBottom ? 'middle' : 'end', dominantBaseline: isBottom ? 'hanging' : 'middle', children: tick.label })] }, toKeyIdentity(tick.value))))] }));
}
//# sourceMappingURL=chart-axis.js.map