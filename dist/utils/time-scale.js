// Time scales: ISO 8601 dates to positions, with calendar ticks and their labels (specs/SCALES.md).
import { fromDate, getLocalTimeZone, parseIsoDate, startOfWeek, toCalendarDate, toZoned, } from '../primitives/index.js';
import { createLinearScale } from './linear-scale.js';
import { readTimeInstant } from './read-time-instant.js';
const defaultTimeTickCount = 8;
const units = ['day', 'week', 'month', 'quarter', 'year'];
const labelFormats = {
    day: { month: 'short', day: 'numeric' },
    week: { month: 'short', day: 'numeric' },
    month: { month: 'short', year: 'numeric' },
    quarter: { month: 'short', year: 'numeric' },
    year: { year: 'numeric' },
};
function planTicks({ unit, count }, countTicks) {
    if (unit)
        return { unit, step: 1 };
    const wanted = typeof count === 'number' && Number.isFinite(count) ? count : defaultTimeTickCount;
    const most = Math.max(1, Math.round(wanted));
    const fitting = units.find((candidate) => countTicks({ unit: candidate, step: 1 }) <= most);
    if (fitting)
        return { unit: fitting, step: 1 };
    let step = 2;
    while (countTicks({ unit: 'year', step }) > most)
        step += 1;
    return { unit: 'year', step };
}
/** The start of the unit holding `date`; years align to multiples of the step. */
function floorToUnit(date, plan, locale) {
    switch (plan.unit) {
        case 'day':
            return date;
        case 'week':
            return startOfWeek(date, locale);
        case 'month':
            return date.set({ day: 1 });
        case 'quarter':
            return date.set({ month: date.month - ((date.month - 1) % 3), day: 1 });
        case 'year':
            return date.set({ year: Math.floor(date.year / plan.step) * plan.step, month: 1, day: 1 });
    }
}
/** `date` moved by `count` units, which may be negative; month ends clamp (Jan 31 + 1 month is Feb 28). */
function shiftByUnits(date, unit, count) {
    switch (unit) {
        case 'day':
            return date.add({ days: count });
        case 'week':
            return date.add({ weeks: count });
        case 'month':
            return date.add({ months: count });
        case 'quarter':
            return date.add({ months: 3 * count });
        case 'year':
            return date.add({ years: count });
    }
}
function addUnit(date, plan, locale) {
    const next = shiftByUnits(date, plan.unit, plan.unit === 'year' ? plan.step : 1);
    // Calendar arithmetic clamps at its supported limit, sometimes between unit boundaries.
    return next.compare(date) > 0 && floorToUnit(next, plan, locale).compare(next) === 0
        ? next
        : undefined;
}
/**
 * The first day of the calendar `unit` holding a `YYYY-MM-DD` date, as a `YYYY-MM-DD` date; weeks
 * start on the first day of the week of `locale` (the runtime's by default). Empty for a text that
 * is not a date.
 */
export function floorToTimeUnit(date, unit, locale) {
    const parsed = parseIsoDate(date);
    const weekLocale = locale ?? new Intl.DateTimeFormat().resolvedOptions().locale;
    return parsed ? floorToUnit(parsed, { unit, step: 1 }, weekLocale).toString() : '';
}
/**
 * A `YYYY-MM-DD` date moved by `count` calendar units (negative counts move back), as a
 * `YYYY-MM-DD` date. A day past the end of the target month clamps to its last day. Empty for a
 * text that is not a date.
 */
export function addTimeUnits(date, unit, count) {
    const parsed = parseIsoDate(date);
    return parsed && Number.isFinite(count)
        ? shiftByUnits(parsed, unit, Math.trunc(count)).toString()
        : '';
}
/**
 * A time scale from a domain of ISO 8601 instants to a range of positions, linear in elapsed time,
 * with ticks at the starts of calendar days, weeks, months, quarters or years in its time zone.
 */
export function createTimeScale(options) {
    const timeZone = options.timeZone ?? getLocalTimeZone();
    const locale = options.locale ?? new Intl.DateTimeFormat().resolvedOptions().locale;
    const [start, end] = options.domain.map((text) => readTimeInstant(text, timeZone));
    const isReadable = Number.isFinite(start) && Number.isFinite(end);
    const linear = createLinearScale({ domain: [start, end], range: options.range });
    const labels = new Map();
    const instantOf = (date) => toZoned(date, timeZone).toDate().getTime();
    const map = (value) => isReadable ? linear.map(readTimeInstant(value, timeZone)) : Number.NaN;
    const format = (value, unit) => {
        const instant = readTimeInstant(value, timeZone);
        if (!Number.isFinite(instant))
            return '';
        let formatter = labels.get(unit);
        if (!formatter) {
            formatter = new Intl.DateTimeFormat(locale, { timeZone, ...labelFormats[unit] });
            labels.set(unit, formatter);
        }
        return formatter.format(instant);
    };
    const ticks = (tickOptions = {}) => {
        if (!isReadable)
            return [];
        const [low, high] = [Math.min(start, end), Math.max(start, end)];
        const lowDate = toCalendarDate(fromDate(new Date(low), timeZone));
        const highDate = toCalendarDate(fromDate(new Date(high), timeZone));
        const firstYear = lowDate.year + (instantOf(lowDate.set({ month: 1, day: 1 })) < low ? 1 : 0);
        const firstTick = (plan) => {
            if (plan.unit === 'year') {
                const year = Math.ceil(firstYear / plan.step) * plan.step;
                return year > lowDate.calendar.getYearsInEra(lowDate)
                    ? undefined
                    : lowDate.set({ year, month: 1, day: 1 });
            }
            const date = floorToUnit(lowDate, plan, locale);
            return instantOf(date) < low ? addUnit(date, plan, locale) : date;
        };
        const countTicks = (plan) => {
            if (plan.unit === 'year') {
                return Math.max(0, Math.floor(highDate.year / plan.step) - Math.ceil(firstYear / plan.step) + 1);
            }
            const first = firstTick(plan);
            if (!first || instantOf(first) > high)
                return 0;
            if (plan.unit === 'day' || plan.unit === 'week') {
                const days = highDate.calendar.toJulianDay(highDate) - first.calendar.toJulianDay(first);
                return Math.floor(days / (plan.unit === 'week' ? 7 : 1)) + 1;
            }
            const months = (highDate.year - first.year) * 12 + highDate.month - first.month;
            return Math.floor(months / (plan.unit === 'quarter' ? 3 : 1)) + 1;
        };
        const plan = planTicks(tickOptions, countTicks);
        let date = firstTick(plan);
        const result = [];
        for (; date && instantOf(date) <= high; date = addUnit(date, plan, locale)) {
            const value = date.toString();
            result.push({ value, position: map(value), label: format(value, plan.unit) });
        }
        return result;
    };
    return {
        domain: options.domain,
        range: linear.range,
        map,
        invert: (position) => {
            const instant = linear.invert(position);
            return isReadable && Number.isFinite(instant) ? new Date(instant).toISOString() : '';
        },
        ticks,
        format,
    };
}
//# sourceMappingURL=time-scale.js.map