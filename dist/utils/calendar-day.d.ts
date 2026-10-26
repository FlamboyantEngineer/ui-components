/** The local calendar day a value falls on, read against today. */
export interface CalendarDay {
    /** The day as an ISO 8601 date (`YYYY-MM-DD`). */
    key: string;
    /** Whole days from today: 0 today, -1 yesterday, 1 tomorrow. */
    offset: number;
    /** The day's local midnight, for formatting it. */
    start: Date;
    /** The day falls in the current year. */
    isThisYear: boolean;
}
/**
 * Returns a reader of the calendar day of an ISO 8601 date, or of a date and time read as local
 * wall time, against the local day of `now`; it gives `null` for a value that is neither.
 */
export declare function createCalendarDayReader(now: Date): (value: string) => CalendarDay | null;
/** A day `offset` days from today as Intl words it with `numeric: 'auto'`, capitalized: `Today`. */
export declare function formatRelativeDay(offset: number, locale: string): string;
//# sourceMappingURL=calendar-day.d.ts.map