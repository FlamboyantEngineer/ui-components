import type { ReactNode } from 'react';
import type { CalendarViewDay } from './calendar-view.js';
import type { PlacedEvent } from './calendar-layout.js';
import type { CalendarFormat } from './use-calendar-format.js';
/** What a calendar grid's day cells share. */
export interface CalendarDayContext {
    focused: string;
    today: string;
    format: CalendarFormat;
    renderDay: ((day: CalendarViewDay) => ReactNode) | undefined;
}
export interface CalendarDayCellProps {
    day: string;
    context: CalendarDayContext;
    /** The events that cover the day. */
    events: readonly PlacedEvent[];
    /** The day belongs to a neighbouring month of a month view. */
    isOutsideMonth: boolean;
    /** Shows the day of the month in the cell (a week view shows it in the column header). */
    showNumber: boolean;
    children?: ReactNode;
}
/** The events of `events` that cover `day`. */
export declare function findDayEvents(events: readonly PlacedEvent[], day: string): PlacedEvent[];
/**
 * A day of a calendar grid: a grid cell whose name starts with the day in full (hidden text), the
 * grid's tab stop while it is the focused day, marked as today with `aria-current="date"`, holding
 * the caller's `renderDay` content and the day's events.
 */
export declare function CalendarDayCell({ day, context, events, isOutsideMonth, showNumber, children, }: CalendarDayCellProps): import("react").JSX.Element;
//# sourceMappingURL=calendar-day.d.ts.map