// Groups dated entries under the local calendar day they fall on, labelled `Today`, `Yesterday` or
// the date, for lists read newest first.
import { DateFormatter } from '../../primitives/index.js';
import { createCalendarDayReader, formatRelativeDay, } from '../../utils/calendar-day.js';
function labelDay(day, locale) {
    if (day.offset === 0 || day.offset === -1)
        return formatRelativeDay(day.offset, locale);
    const formatter = new DateFormatter(locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: day.isThisYear ? undefined : 'numeric',
    });
    return formatter.format(day.start);
}
/**
 * Groups entries by the local calendar day of their date, keeping the groups in the order their
 * first entry appears and the entries in their given order. Entries without a readable date share
 * one group labelled `unknownLabel`.
 */
export function groupByDay(items, options) {
    const groups = new Map();
    const readDay = createCalendarDayReader(options.now);
    for (const item of items) {
        const day = readDay(options.getDate(item));
        const key = day ? day.key : '';
        let group = groups.get(key);
        if (!group) {
            const label = day ? labelDay(day, options.locale) : options.unknownLabel;
            group = { day: key, label, items: [] };
            groups.set(key, group);
        }
        group.items.push(item);
    }
    return [...groups.values()];
}
//# sourceMappingURL=group-by-day.js.map