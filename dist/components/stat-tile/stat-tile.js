import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNumberFormatter } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Card } from '../card/card.js';
const hooks = createHooks('stat-tile', ['value', 'delta', 'trend-icon', 'description', 'chart']);
const trendGlyphs = { up: 'trend-up', down: 'trend-down', flat: 'trend-flat' };
function toTrend(delta) {
    if (delta > 0)
        return 'up';
    return delta < 0 ? 'down' : 'flat';
}
/** The tone a trend has toward a goal: the goal's way is `success`, the other way `danger`. */
function resolveTone(trend, goal) {
    if (trend === 'flat' || goal === 'none')
        return 'neutral';
    return (trend === 'up') === (goal === 'increase') ? 'success' : 'danger';
}
/** The delta's trend and tone, or nothing to publish without a finite delta. */
function resolveChange(delta, goal) {
    if (typeof delta !== 'number' || !Number.isFinite(delta))
        return undefined;
    const trend = toTrend(delta);
    return { delta, trend, tone: resolveTone(trend, goal) };
}
/**
 * A compact metric on a card: a label, a formatted value, its change with a trend and a tone that
 * says whether the change is good, a secondary line, and room for a small chart.
 */
export function StatTile({ label, value, valueLabel, formatOptions, delta, deltaFormatOptions, goal = 'increase', description, chart, className, ...rest }) {
    const change = resolveChange(delta, goal);
    const format = useNumberFormatter(formatOptions);
    const valueText = valueLabel ?? (typeof value === 'number' ? format.format(value) : null);
    const deltaFormat = useNumberFormatter({
        ...(deltaFormatOptions ?? formatOptions),
        signDisplay: 'exceptZero',
    });
    return (_jsxs(Card, { ...rest, ...hooks.root({ className, data: { trend: change?.trend, tone: change?.tone } }), title: label, children: [isEmptyNode(valueText) ? null : _jsx("div", { ...hooks.slot('value'), children: valueText }), change ? (_jsxs("div", { ...hooks.slot('delta'), children: [_jsx(Glyph, { name: trendGlyphs[change.trend], className: hooks.slotClass('trend-icon') }), deltaFormat.format(change.delta)] })) : null, isEmptyNode(description) ? null : _jsx("div", { ...hooks.slot('description'), children: description }), isEmptyNode(chart) ? null : _jsx("div", { ...hooks.slot('chart'), children: chart })] }));
}
//# sourceMappingURL=stat-tile.js.map