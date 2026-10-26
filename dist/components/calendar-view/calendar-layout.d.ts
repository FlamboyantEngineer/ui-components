import type { CalendarViewEvent } from './calendar-view.js';
/** An event read in the view's time zone. */
export interface PlacedEvent {
    event: CalendarViewEvent;
    /** Given as dates (`YYYY-MM-DD`): it lasts whole days. */
    isAllDay: boolean;
    /** Lasts whole days or at least 24 hours: drawn as a bar across the days it covers. */
    isSpan: boolean;
    /** The first day it covers. */
    startDay: string;
    /** The last day it covers. */
    endDay: string;
    /** Its start and end, in epoch milliseconds; for an all-day event, those of its days. */
    start: number;
    end: number;
}
/** A bar of an event in a week: the columns it covers and the lane it sits in. */
export interface WeekSegment {
    placed: PlacedEvent;
    /** The first column (day of the week, from 0) it covers. */
    column: number;
    /** How many columns it covers. */
    span: number;
    lane: number;
    /** The event started before this week. */
    continuesBefore: boolean;
    /** The event goes on after this week. */
    continuesAfter: boolean;
}
/** A timed event within one day: its vertical extent and its share of the day's width, in percent. */
export interface DayBlock {
    placed: PlacedEvent;
    top: number;
    height: number;
    left: number;
    width: number;
    /** The event started on an earlier day. */
    continuesBefore: boolean;
    /** The event goes on into a later day. */
    continuesAfter: boolean;
}
/** The events read in `timeZone`; events whose start is not an ISO 8601 date or date-time are left out. */
export declare function readEvents(events: readonly CalendarViewEvent[], timeZone: string): PlacedEvent[];
/**
 * The events of a week as bars packed into lanes: each event takes the first lane free across the
 * days it covers in the week. With `spansOnly`, events within one day that are not all-day are left
 * out (a week view draws them in its time grid).
 */
export declare function layoutWeek(days: readonly string[], events: readonly PlacedEvent[], { spansOnly }: {
    spansOnly: boolean;
}): {
    segments: WeekSegment[];
    laneCount: number;
};
/** The segments that cover a column. */
export declare function findColumnSegments(segments: readonly WeekSegment[], column: number): WeekSegment[];
/**
 * How many lanes a week shows when each day shows at most `maxEvents` rows: all of them when every
 * day fits, otherwise one fewer than `maxEvents`, leaving a row for the count of the hidden ones.
 */
export declare function countVisibleLanes(segments: readonly WeekSegment[], maxEvents: number): number;
/**
 * The timed events of one day (those that are not bars), each clipped to the day and placed by a
 * time scale over the day's real length, with overlapping events side by side.
 */
export declare function layoutDay(day: string, events: readonly PlacedEvent[], timeZone: string): DayBlock[];
//# sourceMappingURL=calendar-layout.d.ts.map