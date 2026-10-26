import { type CalendarDayContext } from './calendar-day.js';
import { type CalendarEventContext } from './calendar-event.js';
import { type PlacedEvent } from './calendar-layout.js';
import type { CalendarGrid } from './use-calendar-grid.js';
export interface CalendarMonthProps {
    events: readonly PlacedEvent[];
    grid: CalendarGrid;
    titleId: string;
    /** The most rows of events a day shows, the `+n more` button included. */
    maxEvents: number;
    day: CalendarDayContext;
    event: CalendarEventContext;
}
/** The month view: weekday headers, then one row per week of the focused day's month. */
export declare function CalendarMonth({ grid, titleId, ...rest }: CalendarMonthProps): import("react").JSX.Element;
//# sourceMappingURL=calendar-month.d.ts.map