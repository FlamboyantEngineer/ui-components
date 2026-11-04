// The days of a calendar view as `YYYY-MM-DD` texts, which sort in calendar order: today in a time
// zone, shifts by days, weeks and months, the days of a week or a month, and keyboard moves.

import {
  type CalendarDate,
  fromDate,
  parseIsoDate,
  startOfWeek,
  toCalendarDate,
  toCalendarDateTime,
  toZoned,
} from '../../primitives/index.js';
import type { CalendarViewMode } from './calendar-view.js';

/** A shift of a day by whole days, weeks or months. */
interface DayShift {
  days?: number | undefined;
  weeks?: number | undefined;
  months?: number | undefined;
}

/** A `YYYY-MM-DD` day as a date object; the view only makes readable days. */
function readDay(text: string): CalendarDate {
  const day = parseIsoDate(text);
  if (!day) throw new RangeError(`Not a YYYY-MM-DD day: ${text}`);
  return day;
}

/** The day `amount` away from `day`; a month shift keeps the day of the month where it can. */
export function shiftDay(day: string, amount: DayShift): string {
  const { days = 0, weeks = 0, months = 0 } = amount;
  return readDay(day).add({ days, weeks, months }).toString();
}

/** Orders two days in calendar order, for sorting. */
export function compareDays(first: string, second: string): number {
  return Number(first > second) - Number(first < second);
}

/** The day an instant falls on in `timeZone`. */
export function getDayOf(instant: number, timeZone: string): string {
  return toCalendarDate(fromDate(new Date(instant), timeZone)).toString();
}

/** The epoch milliseconds a day starts at in `timeZone`. */
export function getDayStart(day: string, timeZone: string): number {
  return toZoned(readDay(day), timeZone).toDate().getTime();
}

/** An instant's wall-clock time of day in `timeZone`, in hours since midnight, as clocks read it. */
export function getWallHours(instant: number, timeZone: string): number {
  const zoned = fromDate(new Date(instant), timeZone);
  return zoned.hour + zoned.minute / 60 + zoned.second / 3600 + zoned.millisecond / 3_600_000;
}

/** Whether an instant's wall-clock time occurs twice in `timeZone`, as when clocks go back. */
export function isRepeatedTime(instant: number, timeZone: string): boolean {
  const wall = toCalendarDateTime(fromDate(new Date(instant), timeZone));
  return toZoned(wall, timeZone, 'earlier').compare(toZoned(wall, timeZone, 'later')) !== 0;
}

/** The days of the week holding `day`, from the locale's first day of the week. */
export function getWeekDays(day: string, locale: string): string[] {
  const first = startOfWeek(readDay(day), locale);
  return Array.from({ length: 7 }, (_, index) => first.add({ days: index }).toString());
}

/** The weeks that show the month holding `day`, each from the locale's first day of the week. */
export function getMonthWeeks(day: string, locale: string): string[][] {
  const first = readDay(day).set({ day: 1 });
  const last = first.add({ months: 1 }).subtract({ days: 1 });
  const weeks: string[][] = [];
  for (
    let start = startOfWeek(first, locale);
    start.compare(last) <= 0;
    start = start.add({ weeks: 1 })
  ) {
    weeks.push(getWeekDays(start.toString(), locale));
  }
  return weeks;
}

/** Whether two days fall in the same month. */
export function isSameMonth(first: string, second: string): boolean {
  return first.slice(0, 7) === second.slice(0, 7);
}

/** The day a key moves a calendar grid's focused day to, or `null` for any other key. */
export function moveFocusedDay(
  day: string,
  {
    key,
    mode,
    isRightToLeft,
    locale,
  }: { key: string; mode: CalendarViewMode; isRightToLeft: boolean; locale: string },
): string | null {
  const period = mode === 'month' ? 'months' : 'weeks';
  const moves: Readonly<Record<string, () => string>> = {
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
