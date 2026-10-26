import type { CalendarViewMode } from './calendar-view.js';
import type { PlacedEvent } from './calendar-layout.js';
/** The texts a calendar view shows and reads out, in the provider's locale and the view's time zone. */
export interface CalendarFormat {
    locale: string;
    /** The month (`March 2026`) or the week (`Mar 1 – 7, 2026`) on show. */
    formatTitle: (mode: CalendarViewMode, days: readonly string[], focused: string) => string;
    /** A day in full, such as `Monday, March 2, 2026`. */
    formatDay: (day: string) => string;
    /** A weekday's short and long names. */
    formatWeekday: (day: string) => {
        short: string;
        long: string;
    };
    /** A day of the month, such as `2`. */
    formatDayNumber: (day: string) => string;
    /** An instant's time of day, such as `10:00 AM`. */
    formatTime: (instant: number) => string;
    /** An hour of the day, such as `9 AM`, for the time grid. */
    formatHour: (hour: number) => string;
    /** When an event happens: its days, or its times. */
    formatWhen: (placed: PlacedEvent) => string;
}
/** The formatters of a calendar view, made once per locale and time zone. */
export declare function useCalendarFormat(timeZone: string): CalendarFormat;
//# sourceMappingURL=use-calendar-format.d.ts.map