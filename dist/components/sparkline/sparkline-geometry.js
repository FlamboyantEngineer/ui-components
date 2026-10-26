// The paths and marked points of a sparkline, from its values and box (specs/SPARKLINE.md).
import { summarizeNumbers } from '../../utils/summarize-numbers.js';
import { clamp } from '../../utils/clamp.js';
import { createLinearScale } from '../../utils/linear-scale.js';
/** Space kept inside the box so markers on the edges stay whole, in pixels. */
const inset = 3;
const round = (value) => Math.round(value * 100) / 100;
/** Consecutive finite points, split where a value is missing. */
function splitRuns(points) {
    const runs = [];
    let run = [];
    for (const point of points) {
        if (point) {
            run.push(point);
        }
        else if (run.length > 0) {
            runs.push(run);
            run = [];
        }
    }
    if (run.length > 0)
        runs.push(run);
    return runs;
}
function toLine(run) {
    return run.map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join('');
}
function toArea(run, baseline) {
    const first = run[0];
    const last = run[run.length - 1];
    return `${toLine(run)}L${last.x},${baseline}L${first.x},${baseline}Z`;
}
function findMarkedPoints(points) {
    if (points.length === 0)
        return {};
    let min = points[0];
    let max = points[0];
    for (const point of points) {
        if (point.value < min.value)
            min = point;
        if (point.value > max.value)
            max = point;
    }
    return { min, max, last: points[points.length - 1] };
}
/**
 * Lays out a series in a box: index along x, value along y (higher values higher up), inset so
 * edge markers stay whole. Values that are not finite numbers leave gaps. The area fills toward
 * zero, stopping at the edge nearest zero when zero is outside the value range.
 */
export function resolveSparklineGeometry(input) {
    const { values, width, height } = input;
    const summary = summarizeNumbers(values);
    const low = input.minValue ?? summary.min;
    const high = input.maxValue ?? summary.max;
    const x = createLinearScale({
        domain: [0, values.length - 1],
        range: [inset, width - inset],
    });
    const y = createLinearScale({
        domain: [low, high],
        range: [height - inset, inset],
        clamp: true,
    });
    const points = values.map((value, index) => Number.isFinite(value)
        ? { index, value, x: round(x.map(index)), y: round(y.map(value)) }
        : null);
    const runs = splitRuns(points);
    const baseline = round(y.map(clamp(0, Math.min(...y.domain), Math.max(...y.domain))));
    return {
        line: runs.map(toLine).join(''),
        area: runs.map((run) => toArea(run, baseline)).join(''),
        points: findMarkedPoints(runs.flat()),
    };
}
//# sourceMappingURL=sparkline-geometry.js.map