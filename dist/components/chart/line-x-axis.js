// The x axis of a line chart: ISO 8601 dates on a time scale, or numbers on a linear one.
import { createLinearScale } from '../../utils/linear-scale.js';
import { createTimeScale } from '../../utils/time-scale.js';
import { readTimeInstant } from '../../utils/read-time-instant.js';
const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
/** The lowest and highest readable values, or `undefined` without any. */
function findExtent(values, read) {
    let extent;
    let low = Infinity;
    let high = -Infinity;
    for (const value of values) {
        const at = read(value);
        if (!Number.isFinite(at))
            continue;
        extent ??= [value, value];
        if (at < low) {
            low = at;
            extent[0] = value;
        }
        if (at >= high) {
            high = at;
            extent[1] = value;
        }
    }
    return extent;
}
function createTimeAxis(options) {
    const { range, timeZone, locale, tickCount } = options;
    const read = (value) => typeof value === 'string' ? readTimeInstant(value, timeZone) : Number.NaN;
    const extent = findExtent(options.values, read);
    const scale = createTimeScale({ domain: extent ?? ['', ''], range, timeZone, locale });
    const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone });
    const dateTime = new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone,
    });
    return {
        read,
        map: (value) => (typeof value === 'string' ? scale.map(value) : Number.NaN),
        format: (value) => {
            const at = read(value);
            if (!Number.isFinite(at))
                return '';
            return (dateOnly.test(String(value)) ? date : dateTime).format(at);
        },
        ticks: scale.ticks({ count: tickCount }),
    };
}
function createNumberAxis(options) {
    const read = (value) => (typeof value === 'number' ? value : Number.NaN);
    const extent = findExtent(options.values, read);
    const scale = createLinearScale({
        domain: extent ?? [0, 0],
        range: options.range,
        tickCount: options.tickCount,
        locale: options.locale,
    });
    const labels = new Intl.NumberFormat(options.locale);
    return {
        read,
        map: (value) => scale.map(read(value)),
        format: (value) => (Number.isFinite(read(value)) ? labels.format(read(value)) : ''),
        ticks: extent ? scale.ticks() : [],
    };
}
/**
 * The x axis of a line chart. Text values make a time axis read in `timeZone`, ticked on calendar
 * boundaries; numbers make a linear axis. The kind follows the first value; values of the other
 * kind are unreadable.
 */
export function createLineXAxis(options) {
    return typeof options.values[0] === 'number'
        ? createNumberAxis(options)
        : createTimeAxis(options);
}
//# sourceMappingURL=line-x-axis.js.map