// Groups timed entries by the local calendar day they happened on, with a heading per day.
import { DateFormatter } from '../../primitives/index.js';
import { createCalendarDayReader, formatRelativeDay, } from '../../utils/calendar-day.js';
/** `Today`, `Yesterday` and `Tomorrow` as Intl words them; the full date further away. */
function formatDayLabel(day, locale) {
    if (Math.abs(day.offset) <= 1)
        return formatRelativeDay(day.offset, locale);
    return new DateFormatter(locale, { dateStyle: 'full' }).format(day.start);
}
/**
 * Splits entries, in the order given, into runs of consecutive entries from the same local calendar
 * day, each with its heading. Entries whose time cannot be read form runs of their own.
 */
export function groupByDay(items, options) {
    const groups = [];
    const readDay = createCalendarDayReader(options.now);
    for (const item of items) {
        const day = readDay(item.time);
        const key = day ? day.key : '';
        const last = groups.at(-1);
        if (last && last.day === key) {
            last.items.push(item);
            continue;
        }
        const label = day ? formatDayLabel(day, options.locale) : options.unknownLabel;
        groups.push({ day: key, label, items: [item] });
    }
    return groups;
}
//# sourceMappingURL=day-groups.js.map