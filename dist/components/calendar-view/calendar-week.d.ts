import { type CalendarDayContext } from './calendar-day.js';
import { type CalendarEventContext } from './calendar-event.js';
import { type PlacedEvent } from './calendar-layout.js';
import type { CalendarGrid } from './use-calendar-grid.js';
export interface CalendarWeekProps {
    events: readonly PlacedEvent[];
    grid: CalendarGrid;
    titleId: string;
    timeZone: string;
    day: CalendarDayContext;
    event: CalendarEventContext;
}
/** The week view: day headers, then the days of the focused day's week with all-day bars and a time grid. */
export declare function CalendarWeek({ grid, titleId, ...rest }: CalendarWeekProps): import("react").JSX.Element;
//# sourceMappingURL=calendar-week.d.ts.map