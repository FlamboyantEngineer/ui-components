// The bars of a bar chart and its scales, from its values and box (specs/CHART.md).
import { createBandScale } from '../../utils/band-scale.js';
import { createLinearScale } from '../../utils/linear-scale.js';
import { countTicks, resolvePlotBox, roundCoordinate, } from './chart-layout.js';
/** Pixels of value axis per tick, about. */
const valueTickSpacing = { vertical: 40, horizontal: 80 };
/** The share of a category's band left between its grouped bars. */
const groupPadding = 0.1;
/** The lowest and highest ends the bars reach, always including zero. */
function findValueExtent(input) {
    let low = 0;
    let high = 0;
    input.categories.forEach((_, index) => {
        let above = 0;
        let below = 0;
        for (const { values } of input.series) {
            const value = values[index];
            if (value === undefined || !Number.isFinite(value))
                continue;
            if (input.layout === 'grouped') {
                low = Math.min(low, value);
                high = Math.max(high, value);
            }
            else if (value >= 0)
                above += value;
            else
                below += value;
        }
        low = Math.min(low, below);
        high = Math.max(high, above);
    });
    return low === high ? [0, 1] : [low, high];
}
/** The value axis, also used to measure tick labels before laying out bars. */
export function createBarValueScale(input, plot) {
    const isVertical = input.orientation === 'vertical';
    const valueRange = isVertical
        ? [plot.bottom, plot.top]
        : [plot.left, plot.right];
    return createLinearScale({
        domain: findValueExtent(input),
        range: valueRange,
        nice: true,
        locale: input.locale,
        formatOptions: input.formatOptions,
        tickCount: countTicks(Math.abs(valueRange[1] - valueRange[0]), valueTickSpacing[input.orientation]),
    });
}
/**
 * Lays bars out in a box: one band per category along the category axis, and each value from zero
 * (or from the top of the values stacked under it) along a nice value axis that always includes
 * zero. Grouped bars split their band between the drawn series. Values that are not finite numbers
 * draw no bar. Coordinates are rounded to two decimals.
 */
export function resolveBarGeometry(input, valueScale) {
    const plot = resolvePlotBox(input.width, input.height, input.margin);
    const isVertical = input.orientation === 'vertical';
    const values = valueScale ?? createBarValueScale(input, plot);
    const bands = createBandScale({
        domain: input.categories,
        range: isVertical ? [plot.left, plot.right] : [plot.top, plot.bottom],
    });
    const groups = createBandScale({
        domain: input.series.map(({ series }) => String(series)),
        range: [0, bands.bandwidth],
        padding: groupPadding,
    });
    const isGrouped = input.layout === 'grouped';
    const bars = [];
    input.categories.forEach((category, index) => {
        const stack = { above: 0, below: 0 };
        for (const { series, values: seriesValues } of input.series) {
            const value = seriesValues[index];
            if (value === undefined || !Number.isFinite(value))
                continue;
            const side = value >= 0 ? 'above' : 'below';
            const base = isGrouped ? 0 : stack[side];
            stack[side] = base + value;
            const ends = [values.map(base), values.map(base + value)];
            const start = bands.map(category) + (isGrouped ? groups.map(String(series)) : 0);
            const breadth = isGrouped ? groups.bandwidth : bands.bandwidth;
            const low = Math.min(...ends);
            const length = Math.abs(ends[1] - ends[0]);
            const box = input.orientation === 'vertical'
                ? { x: start, y: low, width: breadth, height: length }
                : { x: low, y: start, width: length, height: breadth };
            bars.push({
                key: `${series}:${index}`,
                series,
                index,
                value,
                x: roundCoordinate(box.x),
                y: roundCoordinate(box.y),
                width: roundCoordinate(box.width),
                height: roundCoordinate(box.height),
            });
        }
    });
    return { bars, values, bands, plot };
}
//# sourceMappingURL=bar-geometry.js.map