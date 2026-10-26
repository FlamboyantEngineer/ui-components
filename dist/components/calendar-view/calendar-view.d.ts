import { type ReactNode } from 'react';
import type { BaseProps, Key, Tone } from '../../core/props.js';
/** The period a calendar view shows. */
export type CalendarViewMode = 'month' | 'week';
/** An event on the calendar. */
export interface CalendarViewEvent {
    id: Key;
    title: string;
    /** A `YYYY-MM-DD` date for an all-day event, or an ISO 8601 date-time. */
    start: string;
    /**
     * The last day of an all-day event (inclusive), or the end of a timed event (exclusive). Defaults
     * to the start day, or an hour after the start.
     */
    end?: string | undefined;
    /** Semantic emphasis, published as `data-tone`. Defaults to `neutral`. */
    tone?: Tone | undefined;
}
/** A day as `renderDay` receives it. */
export interface CalendarViewDay {
    /** The day, as `YYYY-MM-DD`. */
    date: string;
    isToday: boolean;
    /** The day belongs to a neighbouring month of the month view. */
    isOutsideMonth: boolean;
    /** The events that cover the day. */
    events: CalendarViewEvent[];
}
export interface CalendarViewProps extends BaseProps {
    /** The events, as plain data. */
    events: readonly CalendarViewEvent[];
    /** The view on show, controlled. */
    view?: CalendarViewMode | undefined;
    /** The view on show at first, uncontrolled. Defaults to `month`. */
    defaultView?: CalendarViewMode | undefined;
    /** Called with the view the reader picks. */
    onViewChange?: ((view: CalendarViewMode) => void) | undefined;
    /** The views the reader may pick between; one view hides the choice. Defaults to both. */
    views?: readonly CalendarViewMode[] | undefined;
    /** The focused day as `YYYY-MM-DD`, controlled; its month or week is on show. */
    date?: string | undefined;
    /** The focused day at first, uncontrolled. Defaults to today. */
    defaultDate?: string | undefined;
    /** Called with the day the reader moves to, by keyboard, navigation or focus. */
    onDateChange?: ((date: string) => void) | undefined;
    /** The IANA time zone that places events on days and hours. Defaults to the runtime's. */
    timeZone?: string | undefined;
    /** The most rows of events a month cell shows, its `+n more` button included. Defaults to 3. */
    maxEvents?: number | undefined;
    /** Called with the key of the event the reader presses. */
    onEventAction?: ((key: Key) => void) | undefined;
    /** Draws extra content in each day cell, such as a marker or a count. */
    renderDay?: ((day: CalendarViewDay) => ReactNode) | undefined;
    /** The clock that decides today. Defaults to `new Date()`. */
    getNow?: (() => Date) | undefined;
}
/**
 * A calendar of events in a month or week view. Events are plain data: all-day events on dates and
 * timed events on ISO 8601 date-times, placed in `timeZone`. The month view packs each week's events
 * into lanes, multi-day events as bars across days, and lists a crowded day's hidden events behind
 * `+n more`; the week view shows all-day bars above a time grid of timed events. The toolbar moves
 * by month or week, back to today and between views; the arrow keys, Home, End, PageUp and PageDown
 * move between days. Pressing an event calls `onEventAction`.
 */
export declare function CalendarView({ events, view, defaultView, onViewChange, views, date, defaultDate, onDateChange, timeZone, maxEvents, onEventAction, renderDay, getNow, className, ...rest }: CalendarViewProps): import("react").JSX.Element;
//# sourceMappingURL=calendar-view.d.ts.map