import type { CalendarViewMode } from './calendar-view.js';
/** A shift of a day by whole days, weeks or months. */
export interface DayShift {
    days?: number | undefined;
    weeks?: number | undefined;
    months?: number | undefined;
}
/** The day `amount` away from `day`; a month shift keeps the day of the month where it can. */
export declare function shiftDay(day: string, amount: DayShift): string;
/** Orders two days in calendar order, for sorting. */
export declare function compareDays(first: string, second: string): number;
/** The day an instant falls on in `timeZone`. */
export declare function getDayOf(instant: number, timeZone: string): string;
/** The epoch milliseconds a day starts at in `timeZone`. */
export declare function getDayStart(day: string, timeZone: string): number;
/** The days of the week holding `day`, from the locale's first day of the week. */
export declare function getWeekDays(day: string, locale: string): string[];
/** The weeks that show the month holding `day`, each from the locale's first day of the week. */
export declare function getMonthWeeks(day: string, locale: string): string[][];
/** Whether two days fall in the same month. */
export declare function isSameMonth(first: string, second: string): boolean;
/** The day a key moves a calendar grid's focused day to, or `null` for any other key. */
export declare function moveFocusedDay(day: string, { key, mode, isRightToLeft, locale, }: {
    key: string;
    mode: CalendarViewMode;
    isRightToLeft: boolean;
    locale: string;
}): string | null;
//# sourceMappingURL=calendar-days.d.ts.map