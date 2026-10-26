// A date-time field's value model: ISO 8601 texts by mode, the field's bounds, unavailable dates and
// the localized text it shows for a value.
import { DateFormatter, formatIsoDate, getLocalTimeZone, now, parseIsoDate, parseIsoDateTime, parseIsoTime, toCalendarDate, toCalendarDateTime, today, } from '../../primitives/index.js';
/** The mode of each end of a range, or of a single value. */
export function toSingleMode(mode) {
    if (mode === 'date-range')
        return 'date';
    return mode === 'date-time-range' ? 'date-time' : mode;
}
/** A text as a moment on one scale per mode (milliseconds), or `null` when the mode cannot read it. */
function toMoment(text, mode, options) {
    if (mode === 'time') {
        const time = parseIsoTime(text);
        return time ? ((time.hour * 60 + time.minute) * 60 + time.second) * 1000 : null;
    }
    if (mode === 'date')
        return parseIsoDate(text)?.toDate('UTC').getTime() ?? null;
    const value = parseIsoDateTime(text, options.timeZone);
    if (!value)
        return null;
    return ('timeZone' in value ? value.toDate() : value.toDate('UTC')).getTime();
}
/** The current date, or the current date and time to the granularity, as a value's text. */
export function currentDateValue(mode, options = {}) {
    const zone = options.timeZone ?? getLocalTimeZone();
    if (mode === 'date')
        return today(zone).toString();
    const moment = now(zone);
    return formatIsoDate(options.timeZone ? moment : toCalendarDateTime(moment), options.granularity);
}
/** Which bound a value breaks, with that bound's value; a range's end may not precede its start. */
export function findBoundIssue(value, mode, { minValue, maxValue, ...options }) {
    if (!value)
        return null;
    const single = toSingleMode(mode);
    // Texts the mode cannot read compare as equal, so they break no bound.
    const compare = (left, right) => {
        const before = toMoment(left, single, options);
        const after = toMoment(right, single, options);
        return before === null || after === null ? 0 : before - after;
    };
    const [first, last] = typeof value === 'string' ? [value, value] : [value.start, value.end];
    if (minValue && compare(first, minValue) < 0)
        return { bound: 'min', limit: minValue };
    if (maxValue && compare(last, maxValue) > 0)
        return { bound: 'max', limit: maxValue };
    return compare(last, first) < 0 ? { bound: 'min', limit: first } : null;
}
/** The `YYYY-MM-DD` date a date or date-and-time text falls on, or `null`. */
function toCalendarDay(text, mode, options = {}) {
    if (mode === 'date')
        return parseIsoDate(text)?.toString() ?? null;
    const value = parseIsoDateTime(text, options.timeZone);
    return value ? toCalendarDate(value).toString() : null;
}
/** Whether a value, or any calendar day in its inclusive range, falls on a date `isDateUnavailable` refuses. */
export function isUnavailableValue(value, mode, options) {
    const { isDateUnavailable } = options;
    const single = toSingleMode(mode);
    if (!value || !isDateUnavailable || single === 'time')
        return false;
    const ends = typeof value === 'string' ? [value] : [value.start, value.end];
    const days = ends.map((end) => toCalendarDay(end, single, options));
    if (days.some((day) => day !== null && isDateUnavailable(day)))
        return true;
    const start = parseIsoDate(days[0]);
    const end = parseIsoDate(days[1]);
    if (!start || !end)
        return false;
    for (let day = start.add({ days: 1 }); day.compare(end) < 0; day = day.add({ days: 1 })) {
        if (isDateUnavailable(day.toString()))
            return true;
    }
    return false;
}
function toDate(text, mode, options) {
    if (mode === 'date')
        return parseIsoDate(text)?.toDate(getLocalTimeZone()) ?? null;
    if (mode === 'date-time') {
        const value = parseIsoDateTime(text, options.timeZone);
        if (!value)
            return null;
        return 'timeZone' in value ? value.toDate() : value.toDate(getLocalTimeZone());
    }
    const time = parseIsoTime(text);
    return time ? new Date(2000, 0, 1, time.hour, time.minute, time.second) : null;
}
function formatOptions(mode, options) {
    const timeStyle = options.granularity === 'second' ? 'medium' : 'short';
    if (mode === 'date')
        return { dateStyle: 'medium' };
    if (mode === 'time')
        return { timeStyle };
    return { dateStyle: 'medium', timeStyle, timeZone: options.timeZone };
}
/** A value as localized text: a date, a time, both, or a range. Unreadable text is kept. */
export function formatDateValue(value, mode, options) {
    const single = toSingleMode(mode);
    const formatter = new DateFormatter(options.locale, formatOptions(single, options));
    if (typeof value !== 'string') {
        const start = toDate(value.start, single, options);
        const end = toDate(value.end, single, options);
        return start && end ? formatter.formatRange(start, end) : `${value.start} – ${value.end}`;
    }
    const date = toDate(value, single, options);
    return date ? formatter.format(date) : value;
}
//# sourceMappingURL=date-values.js.map