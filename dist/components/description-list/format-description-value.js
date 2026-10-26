// Locale-aware text for the values a description row formats itself.
import { readTimeInstant } from '../../utils/read-time-instant.js';
const defaultDateOptions = { dateStyle: 'medium' };
function isRange(value) {
    return typeof value === 'object' && 'start' in value;
}
/**
 * Dates with `Intl.DateTimeFormat`. An ISO 8601 text is read in the formatter's time zone, so a
 * calendar date stays that date; a text that is not a date shows as written.
 */
function formatDate(value, { locale, formatOptions }) {
    const format = new Intl.DateTimeFormat(locale, formatOptions ?? defaultDateOptions);
    const zone = format.resolvedOptions().timeZone;
    const read = (date) => readTimeInstant(date, zone);
    if (typeof value === 'string') {
        const date = read(value);
        return Number.isNaN(date) ? value : format.format(date);
    }
    const [start, end] = [read(value.start), read(value.end)];
    if (Number.isNaN(start) || Number.isNaN(end)) {
        return `${value.start} – ${value.end}`;
    }
    return format.formatRange(start, end);
}
function formatNumber(value, { locale, formatOptions }) {
    const format = new Intl.NumberFormat(locale, formatOptions);
    return typeof value === 'number'
        ? format.format(value)
        : format.formatRange(value.start, value.end);
}
/**
 * A value as text for `locale`: numbers and number ranges with `Intl.NumberFormat`, ISO 8601 dates
 * and date ranges with `Intl.DateTimeFormat` (a medium date by default), and lists of texts joined
 * with `Intl.ListFormat` (`Apples, pears, and plums` in English by default).
 */
export function formatDescriptionValue(value, input) {
    if (typeof value === 'number')
        return formatNumber(value, input);
    if (typeof value === 'string')
        return formatDate(value, input);
    if (isRange(value)) {
        return typeof value.start === 'number'
            ? formatNumber(value, input)
            : formatDate(value, input);
    }
    const options = input.formatOptions;
    return new Intl.ListFormat(input.locale, options ?? { type: 'conjunction' }).format(value);
}
//# sourceMappingURL=format-description-value.js.map