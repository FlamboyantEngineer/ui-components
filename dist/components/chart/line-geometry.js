// The lines, areas and points of a line chart and its scales (specs/CHART.md).
import { summarizeNumbers } from '../../utils/summarize-numbers.js';
import { clamp } from '../../utils/clamp.js';
import { createLinearScale } from '../../utils/linear-scale.js';
import { countTicks, resolvePlotBox, roundCoordinate, } from './chart-layout.js';
import { createLineXAxis } from './line-x-axis.js';
const xTickSpacing = 80;
const yTickSpacing = 40;
function findValueDomain(input) {
    const summary = summarizeNumbers(input.series.flatMap(({ points }) => points.map((point) => point.y)));
    const low = input.minValue ?? Math.min(0, summary.min);
    const high = input.maxValue ?? Math.max(0, summary.max);
    return low === high ? [low, low + 1] : [low, high];
}
/** Path data through runs of points, split where a value is missing. */
function toPaths(runs, baseline) {
    const paths = runs.map((run) => run.map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join(''));
    const line = paths.join('');
    const area = runs
        .map((run, index) => {
        return `${paths[index]}L${run.at(-1).x},${baseline}L${run[0].x},${baseline}Z`;
    })
        .join('');
    return { line, area };
}
/** One series laid out: its readable points in x order, split into runs at missing values. */
function layOutSeries({ series, points }, scales) {
    // Each x is read once before the sort, not again in the comparator.
    const ordered = points
        .map((point) => ({ point, at: scales.xAxis.read(point.x) }))
        .filter(({ at }) => Number.isFinite(at))
        .sort((a, b) => a.at - b.at);
    const runs = [[]];
    const drawn = [];
    for (const { point } of ordered) {
        if (!Number.isFinite(point.y)) {
            runs.push([]);
            continue;
        }
        const laid = {
            key: `${series}:${drawn.length}`,
            series,
            index: drawn.length,
            at: point.x,
            value: point.y,
            x: roundCoordinate(scales.xAxis.map(point.x)),
            y: roundCoordinate(scales.y(point.y)),
        };
        drawn.push(laid);
        runs.at(-1).push(laid);
    }
    return { runs: runs.filter((run) => run.length > 0), points: drawn };
}
/** The value axis, also used to measure tick labels before laying out paths. */
export function createLineValueScale(input, plot) {
    const isFixed = input.minValue !== undefined || input.maxValue !== undefined;
    return createLinearScale({
        domain: findValueDomain(input),
        range: [plot.bottom, plot.top],
        nice: !isFixed,
        clamp: true,
        tickCount: countTicks(plot.bottom - plot.top, yTickSpacing),
        locale: input.locale,
        formatOptions: input.formatOptions,
    });
}
/**
 * Lays series out in a box: x along a time or linear axis across the readable x values, and
 * values along a value axis (higher values higher up). Points whose x cannot be read are left out;
 * a value that is not a finite number breaks the line and the area, which fills toward zero or
 * the edge nearest it. Coordinates are rounded to two decimals.
 */
export function resolveLineGeometry(input, valueScale) {
    const plot = resolvePlotBox(input.width, input.height, input.margin);
    const xAxis = createLineXAxis({
        values: input.series.flatMap(({ points }) => points.map((point) => point.x)),
        range: [plot.left, plot.right],
        tickCount: countTicks(plot.right - plot.left, xTickSpacing),
        timeZone: input.timeZone,
        locale: input.locale,
    });
    const values = valueScale ?? createLineValueScale(input, plot);
    const [low, high] = [Math.min(...values.domain), Math.max(...values.domain)];
    const baseline = roundCoordinate(values.map(clamp(0, low, high)));
    const lines = input.series.map((entry) => {
        const { runs, points } = layOutSeries(entry, { xAxis, y: values.map });
        return { series: entry.series, ...toPaths(runs, baseline), points };
    });
    return { lines, xAxis, yTicks: values.ticks(), plot };
}
//# sourceMappingURL=line-geometry.js.map