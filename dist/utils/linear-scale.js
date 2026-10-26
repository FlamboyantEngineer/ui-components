// Linear scales: numbers to positions, round tick values and their labels (specs/SCALES.md).
import { clamp } from './clamp.js';
const defaultTickCount = 5;
const maxTickCount = 1000;
// Step factors switch where the rounded step is closest to the raw one on a log scale.
const tenfold = Math.sqrt(50);
const fivefold = Math.sqrt(10);
const twofold = Math.sqrt(2);
function toFinite(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
/** The round step (1, 2 or 5 times a power of ten) that splits `span` into about `count` parts. */
function findTickStep(span, count) {
    if (!(span > 0) || !Number.isFinite(span))
        return undefined;
    const raw = span / count || span;
    if (!Number.isFinite(raw))
        return undefined;
    const power = 10 ** Math.floor(Math.log10(raw)) || raw;
    const error = raw / power;
    const factor = error >= tenfold ? 10 : error >= fivefold ? 5 : error >= twofold ? 2 : 1;
    const step = power * factor;
    return Number.isFinite(step) ? step : undefined;
}
/** How many decimals the multiples of `step` need. */
function countDecimals(step) {
    return Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
}
/** `count` multiples of `step`, written without floating-point noise. */
function toMultiple(count, step) {
    const value = count * step;
    const decimals = countDecimals(step);
    return Number(decimals > 100 ? value.toPrecision(15) : value.toFixed(decimals));
}
function findDomainStep([first, last], count) {
    const span = Math.abs(last - first);
    return Number.isFinite(span)
        ? findTickStep(span, count)
        : findTickStep(Math.abs(last / 2 - first / 2), count / 2);
}
/** The domain widened to whole steps; the step is found again once, as widening can change it. */
function niceDomain([first, last], count) {
    let low = Math.min(first, last);
    let high = Math.max(first, last);
    for (let pass = 0; pass < 2; pass += 1) {
        const step = findDomainStep([low, high], count);
        if (step === undefined)
            break;
        const nextLow = toMultiple(Math.floor(low / step), step);
        const nextHigh = toMultiple(Math.ceil(high / step), step);
        if (Number.isFinite(nextLow))
            low = nextLow;
        if (Number.isFinite(nextHigh))
            high = nextHigh;
    }
    return first <= last ? [low, high] : [high, low];
}
/** Proportional interpolation from one interval to another, for both directions of a scale. */
function interpolate(from, to, isClamped) {
    return (point) => {
        if (!Number.isFinite(point))
            return Number.NaN;
        const span = from[1] - from[0];
        if (span === 0) {
            const sum = to[0] + to[1];
            return Number.isFinite(sum) ? sum / 2 : to[0] / 2 + to[1] / 2;
        }
        const difference = point - from[0];
        const ratio = Number.isFinite(span)
            ? Number.isFinite(difference)
                ? difference / span
                : point / span - from[0] / span
            : (point / 2 - from[0] / 2) / (from[1] / 2 - from[0] / 2);
        const position = isClamped ? clamp(ratio, 0, 1) : ratio;
        const extent = to[1] - to[0];
        return Number.isFinite(extent)
            ? to[0] + position * extent
            : (1 - position) * to[0] + position * to[1];
    };
}
function createLabelFormat(options, step) {
    if (options.formatOptions || step === undefined) {
        return new Intl.NumberFormat(options.locale, options.formatOptions);
    }
    const decimals = countDecimals(step);
    if (decimals > 100) {
        return new Intl.NumberFormat(options.locale, {
            notation: 'scientific',
            maximumSignificantDigits: 15,
        });
    }
    return new Intl.NumberFormat(options.locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}
/**
 * A linear scale from a domain of values to a range of positions, with round ticks. Non-finite
 * ends read as 0; a domain whose ends are equal maps every value to the middle of the range.
 */
export function createLinearScale(options) {
    const count = clamp(Math.round(toFinite(options.tickCount, defaultTickCount)), 1, maxTickCount);
    const given = [toFinite(options.domain[0], 0), toFinite(options.domain[1], 0)];
    const domain = options.nice ? niceDomain(given, count) : given;
    const range = [toFinite(options.range[0], 0), toFinite(options.range[1], 0)];
    const low = Math.min(...domain);
    const high = Math.max(...domain);
    const step = findDomainStep(domain, count);
    const labels = createLabelFormat(options, step);
    const map = interpolate(domain, range, options.clamp === true);
    const format = (value) => labels.format(value);
    const ticks = () => {
        if (step === undefined)
            return [{ value: low, position: map(low), label: format(low) }];
        const values = [];
        const first = Math.ceil(low / step - 1e-9);
        const last = Math.floor(high / step + 1e-9);
        // An absolute tick index can exceed the safe integer range, where adding one never advances.
        for (let offset = 0; offset <= last - first; offset += 1) {
            const value = toMultiple(first + offset, step);
            if (value >= low && value <= high && value !== values.at(-1))
                values.push(value);
        }
        return values.map((value) => ({ value, position: map(value), label: format(value) }));
    };
    return {
        domain,
        range,
        map,
        invert: interpolate(range, domain, options.clamp === true),
        ticks,
        format,
    };
}
//# sourceMappingURL=linear-scale.js.map