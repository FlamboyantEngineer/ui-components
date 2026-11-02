// Moving and resizing an event by days and minutes of the wall clock, in the calendar's zone
// (specs/CALENDAR-VIEW.md, UIC-CALENDAR-VIEW-6).

import { formatIsoDate, fromDate, toCalendarDateTime, toZoned } from '../../primitives/index.js';
import { shiftDay } from './calendar-days.js';
import { toEventText } from './calendar-event-range.js';
import type { PlacedEvent } from './calendar-layout.js';
import type { CalendarViewEvent } from './calendar-view.js';

/** A drag of an event: move the whole event, or move its start or its end alone. */
export type CalendarEventGesture = 'move' | 'start' | 'end';

/** How far a drag took an event: whole days, then minutes of the wall clock. */
export interface EventShift {
  days: number;
  minutes: number;
}

/** A drag's change: its gesture and how far it took the event. */
export interface EventChange {
  gesture: CalendarEventGesture;
  shift: EventShift;
}

/** The least a start or end drag leaves a timed event, in minutes. */
export const leastChangeMinutes = 15;

const minuteMs = 60_000;

/** An instant shifted by wall-clock days and minutes in `timeZone`; a skipped time resolves later. */
function shiftWall(instant: number, shift: EventShift, timeZone: string): number {
  const wall = toCalendarDateTime(fromDate(new Date(instant), timeZone)).add({
    days: shift.days,
    minutes: shift.minutes,
  });
  return toZoned(wall, timeZone).toDate().getTime();
}

function writeInstant(instant: number, like: string, timeZone: string): string {
  return toEventText(formatIsoDate(fromDate(new Date(instant), timeZone)), like, timeZone);
}

/**
 * An all-day event moved by whole days, or its first or last day moved, never past the other. An
 * event without an end that gains a later end, or an earlier start, is given one.
 */
function changeAllDay(
  placed: PlacedEvent,
  gesture: CalendarEventGesture,
  days: number,
): CalendarViewEvent {
  const { event, startDay, endDay } = placed;
  if (gesture === 'end') {
    const end = shiftDay(endDay, { days });
    // An event without an end lasts its start day, as it would ending there.
    if (end <= startDay && event.end === undefined) return event;
    return { ...event, end: end < startDay ? startDay : end };
  }
  if (gesture === 'start') {
    const start = shiftDay(startDay, { days });
    return { ...event, start: start > endDay ? endDay : start, end: endDay };
  }
  const moved = { ...event, start: shiftDay(startDay, { days }) };
  return event.end === undefined ? moved : { ...moved, end: shiftDay(endDay, { days }) };
}

/**
 * A timed event moved on the wall clock, keeping its elapsed length, or its start or end moved,
 * leaving it at least `leastChangeMinutes` long. An event without an end keeps none when it moves,
 * and is given its end when its start moves.
 */
function changeTimed(
  placed: PlacedEvent,
  { gesture, shift }: EventChange,
  timeZone: string,
): CalendarViewEvent {
  const { event } = placed;
  const least = leastChangeMinutes * minuteMs;
  const write = (instant: number) => writeInstant(instant, event.start, timeZone);
  if (gesture === 'end') {
    const end = Math.max(shiftWall(placed.end, shift, timeZone), placed.start + least);
    return { ...event, end: write(end) };
  }
  if (gesture === 'start') {
    const start = Math.min(shiftWall(placed.start, shift, timeZone), placed.end - least);
    return { ...event, start: write(start), end: event.end ?? write(placed.end) };
  }
  const start = shiftWall(placed.start, shift, timeZone);
  const moved = { ...event, start: write(start) };
  if (event.end === undefined) return moved;
  return { ...moved, end: write(start + placed.end - placed.start) };
}

/**
 * The event a drag's shift makes, or `null` when the shift changes nothing: a move shifts its
 * start and end alike, keeping its length; a start or end drag shifts that end only. All-day
 * events change by whole days; timed events by days and wall-clock minutes, so a move across a change of
 * the clocks keeps its wall-clock start.
 */
export function changeEvent(
  placed: PlacedEvent,
  change: EventChange,
  timeZone: string,
): CalendarViewEvent | null {
  const { gesture, shift } = change;
  if (shift.days === 0 && shift.minutes === 0) return null;
  const next = placed.isAllDay
    ? changeAllDay(placed, gesture, shift.days)
    : changeTimed(placed, change, timeZone);
  return next.start === placed.event.start && next.end === placed.event.end ? null : next;
}
