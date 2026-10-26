// The days of a calendar view as `YYYY-MM-DD` texts, which sort in calendar order: today in a time
// zone, shifts by days, weeks and months, the days of a week or a month, and keyboard moves.
import { fromDate, parseIsoDate, startOfWeek, toCalendarDate, toZoned, } from '../../primitives/index.js';
/** A `YYYY-MM-DD` day as a date object; the view only makes readable days. */
function readDay(text) {
    const day = parseIsoDate(text);
    if (!day)
        throw new RangeError(`Not a YYYY-MM-DD day: ${text}`);
    return day;
}
/** The day `amount` away from `day`; a month shift keeps the day of the month where it can. */
export function shiftDay(day, amount) {
    const { days = 0, weeks = 0, months = 0 } = amount;
    return readDay(day).add({ days, weeks, months }).toString();
}
/** Orders two days in calendar order, for sorting. */
export function compareDays(first, second) {
    return Number(first > second) - Number(first < second);
}
/** The day an instant falls on in `timeZone`. */
export function getDayOf(instant, timeZone) {
    return toCalendarDate(fromDate(new Date(instant), timeZone)).toString();
}
/** The epoch milliseconds a day starts at in `timeZone`. */
export function getDayStart(day, timeZone) {
    return toZoned(readDay(day), timeZone).toDate().getTime();
}
/** The days of the week holding `day`, from the locale's first day of the week. */
export function getWeekDays(day, locale) {
    const first = startOfWeek(readDay(day), locale);
    return Array.from({ length: 7 }, (_, index) => first.add({ days: index }).toString());
}
/** The weeks that show the month holding `day`, each from the locale's first day of the week. */
export function getMonthWeeks(day, locale) {
    const first = readDay(day).set({ day: 1 });
    const last = first.add({ months: 1 }).subtract({ days: 1 });
    const weeks = [];
    for (let start = startOfWeek(first, locale); start.compare(last) <= 0; start = start.add({ weeks: 1 })) {
        weeks.push(getWeekDays(start.toString(), locale));
    }
    return weeks;
}
/** Whether two days fall in the same month. */
export function isSameMonth(first, second) {
    return first.slice(0, 7) === second.slice(0, 7);
}
/** The day a key moves a calendar grid's focused day to, or `null` for any other key. */
export function moveFocusedDay(day, { key, mode, isRightToLeft, locale, }) {
    const period = mode === 'month' ? 'months' : 'weeks';
    const moves = {
        ArrowLeft: () => shiftDay(day, { days: isRightToLeft ? 1 : -1 }),
        ArrowRight: () => shiftDay(day, { days: isRightToLeft ? -1 : 1 }),
        ArrowUp: () => shiftDay(day, { weeks: -1 }),
        ArrowDown: () => shiftDay(day, { weeks: 1 }),
        Home: () => getWeekDays(day, locale)[0] ?? day,
        End: () => getWeekDays(day, locale)[6] ?? day,
        PageUp: () => shiftDay(day, { [period]: -1 }),
        PageDown: () => shiftDay(day, { [period]: 1 }),
    };
    return moves[key]?.() ?? null;
}
//# sourceMappingURL=calendar-days.js.map