import { clamp } from '../../utils/clamp.js';
/** Where a value sits: below the low boundary, above the high one, or between them. */
function findRegion(value, low, high) {
    if (value < low)
        return 'low';
    return value > high ? 'high' : 'middle';
}
/**
 * The tone the HTML `meter` element's regions give a value. The region holding `optimum` is good
 * (`success`). With the optimum between the boundaries, the low and high regions are worse
 * (`warning`); with it in the low or high region, the middle is worse and the far region worst
 * (`danger`). A value on a boundary counts as the middle. Without any threshold there is no tone.
 */
export function resolveMeterTone(range, { low, high, optimum }) {
    if (low === undefined && high === undefined && optimum === undefined)
        return undefined;
    const { value, minValue, maxValue } = range;
    const lowBoundary = clamp(low ?? minValue, minValue, maxValue);
    const highBoundary = clamp(high ?? maxValue, lowBoundary, maxValue);
    const best = findRegion(clamp(optimum ?? (minValue + maxValue) / 2, minValue, maxValue), lowBoundary, highBoundary);
    const current = findRegion(value, lowBoundary, highBoundary);
    if (current === best)
        return 'success';
    return best === 'middle' || current === 'middle' ? 'warning' : 'danger';
}
//# sourceMappingURL=progress-meter.js.map