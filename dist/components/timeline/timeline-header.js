import { jsx as _jsx } from "react/jsx-runtime";
import { useDateFormatter } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { resolveScaleCells, timelineScales, } from './timeline-geometry.js';
import { timelineHooks as hooks } from './timeline-hooks.js';
const labelFormats = {
    'major:month': { month: 'long', year: 'numeric' },
    'major:year': { year: 'numeric' },
    'minor:day': { day: 'numeric' },
    'minor:week': { month: 'short', day: 'numeric' },
    'minor:month': { month: 'short' },
};
/** Writes a header cell's label from the first day it covers. */
function useScaleLabel(scale) {
    const strings = useUiStrings();
    const plan = timelineScales[scale];
    const major = useDateFormatter({ ...labelFormats[`major:${plan.major}`], timeZone: 'UTC' });
    const minor = useDateFormatter({ ...labelFormats[`minor:${plan.minor}`], timeZone: 'UTC' });
    return (date, unit, tier) => {
        const instant = new Date(date);
        if (unit === 'quarter')
            return strings.timelineQuarter(Math.floor(instant.getUTCMonth() / 3) + 1);
        return (tier === 'major' ? major : minor).format(instant);
    };
}
/**
 * The time scale above the rows, pinned to the top of the viewport while the rows scroll: a row of
 * the larger unit (months or years) over a row of the scale's unit.
 */
export function TimelineHeader({ axis, scale }) {
    const label = useScaleLabel(scale);
    const plan = timelineScales[scale];
    const tiers = [
        ['major', plan.major],
        ['minor', plan.minor],
    ];
    return (_jsx("div", { ...hooks.slot('header'), style: { position: 'sticky', top: 0, zIndex: 2, width: axis.width }, "aria-hidden": "true", children: tiers.map(([tier, unit]) => (_jsx("div", { ...hooks.slot('scale-row', { tier, unit }), style: { position: 'relative' }, children: resolveScaleCells(axis, unit).map((cell) => (_jsx("span", { ...hooks.slot('scale-cell'), style: { position: 'absolute', left: cell.left, width: cell.width }, children: label(cell.start, unit, tier) }, cell.start))) }, tier))) }));
}
//# sourceMappingURL=timeline-header.js.map