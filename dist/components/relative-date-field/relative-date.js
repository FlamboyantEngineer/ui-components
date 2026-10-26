// Relative date text (`Tomorrow`, `In 3 days`, `5 minutes ago`) and preset values, formatted through
// Intl for the reader's locale.
import { DateFormatter, formatIsoDate, fromDate, getLocalTimeZone, parseIsoDate, parseIsoDateTime, toCalendarDate, toCalendarDateTime, } from '../../primitives/index.js';
import { capitalizeText, describeRelativeTime, } from '../../utils/relative-time.js';
/** The local calendar day of a moment. */
function toDay(moment) {
    return toCalendarDate(fromDate(moment, getLocalTimeZone()));
}
/** A range is past once it ends before today, future while it starts after, present around it. */
function rangeRelation(range, today) {
    if (range.end < today)
        return 'past';
    return range.start > today ? 'future' : 'present';
}
/** The local calendar day of a moment, as `YYYY-MM-DD`. */
export function toLocalDay(now) {
    return toDay(now).toString();
}
/**
 * Describes a value relative to `now` through the shared relative time formatter, with the relative
 * text capitalized as a label. `null` when the value is not a date.
 */
export function describeRelativeDate(value, options) {
    const text = describeRelativeTime(value, options);
    if (!text)
        return null;
    const relative = capitalizeText(text.relative, options.locale);
    return { relative, absolute: text.absolute, relation: text.relation };
}
/**
 * Describes a range relative to `now`: each end in relative words (`7 days ago – Today`), the
 * localized range, and whether it lies before, around or after today. `null` unless both ends are
 * dates.
 */
export function describeRelativeRange(range, options) {
    const start = describeRelativeDate(range.start, options);
    const end = describeRelativeDate(range.end, options);
    const startDate = parseIsoDate(range.start);
    const endDate = parseIsoDate(range.end);
    if (!start || !end || !startDate || !endDate)
        return null;
    const zone = getLocalTimeZone();
    const today = toLocalDay(options.now);
    const absolute = new DateFormatter(options.locale, { dateStyle: 'medium' }).formatRange(startDate.toDate(zone), endDate.toDate(zone));
    return {
        relative: `${start.relative} – ${end.relative}`,
        absolute,
        relation: rangeRelation(range, today),
    };
}
/** A preset's label: its own, or one such as `Today`, `Next week` or `In 3 days`. */
export function formatRelativePreset(preset, locale) {
    if (preset.label)
        return preset.label;
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    return capitalizeText(formatter.format(preset.amount, preset.unit), locale);
}
/** A range preset's count of units, such as `7 days`, for the `Last …` and `Next …` labels. */
export function formatRelativePeriod(preset, locale) {
    const formatter = new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: preset.unit,
        unitDisplay: 'long',
    });
    return formatter.format(Math.abs(preset.amount));
}
/** The value a preset stands for, counted from `now`, as a date or a local date and time. */
export function resolveRelativePreset(preset, options) {
    const duration = { [`${preset.unit}s`]: preset.amount };
    const moment = fromDate(options.now, getLocalTimeZone()).add(duration);
    return options.kind === 'date'
        ? toCalendarDate(moment).toString()
        : formatIsoDate(toCalendarDateTime(moment));
}
/** The range a preset stands for: from the point it names to today, or from today to it. */
export function resolveRelativeRange(preset, now) {
    const today = toDay(now);
    const other = today.add({ [`${preset.unit}s`]: preset.amount }).toString();
    return preset.amount < 0
        ? { start: other, end: today.toString() }
        : { start: today.toString(), end: other };
}
/** A picked `YYYY-MM-DD` day as a value: the date, or that day at the current time of day. */
export function resolvePickedDate(date, options) {
    const day = parseIsoDate(date);
    if (options.kind === 'date' || !day)
        return date;
    const moment = toCalendarDateTime(fromDate(options.now, getLocalTimeZone()));
    return formatIsoDate(moment.set({ year: day.year, month: day.month, day: day.day }));
}
/** The `YYYY-MM-DD` date a value falls on, for a date or a date and time. */
export function toValueDate(value) {
    const date = parseIsoDate(value);
    if (date)
        return date.toString();
    const dateTime = parseIsoDateTime(value);
    return dateTime ? toCalendarDate(dateTime).toString() : null;
}
/** Which bound a value, or either end of a range, breaks, with that bound's date. */
export function findRelativeBoundIssue(value, { minValue, maxValue }) {
    if (!value)
        return null;
    const [first, last] = typeof value === 'string' ? [value, value] : [value.start, value.end];
    const firstDate = toValueDate(first);
    const lastDate = toValueDate(last);
    if (minValue && firstDate && firstDate < minValue)
        return { bound: 'min', limit: minValue };
    if (maxValue && lastDate && lastDate > maxValue)
        return { bound: 'max', limit: maxValue };
    return null;
}
//# sourceMappingURL=relative-date.js.map