// Moving and resizing an event by days and minutes of the wall clock, in the calendar's zone
// (specs/CALENDAR-VIEW.md, UIC-CALENDAR-VIEW-6).

import { formatIsoDate, fromDate, toCalendarDateTime, toZoned } from '../../primitives/index.js';
import { shiftDay } from './calendar-days.js';
import { toEventText } from './calendar-event-range.js';
import type { PlacedEvent } from './calendar-layout.js';
import type { CalendarViewEvent } from './calendar-view.js';

/** A change of an event by its handles: move the whole event, or resize it from its end. */
export type CalendarEventGesture = 'move' | 'resize';

/** How far a handle took an event: whole days, then minutes of the wall clock. */
export interface EventShift {
  days: number;
  minutes: number;
}

/** A handle's change: its gesture and how far it took the event. */
export interface EventChange {
  gesture: CalendarEventGesture;
  shift: EventShift;
}

/** The least a resize leaves a timed event, in minutes. */
export const minEventMinutes = 15;

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

/** An all-day event moved by whole days, or its last day moved, never before its first. */
function changeAllDay(
  placed: PlacedEvent,
  gesture: CalendarEventGesture,
  days: number,
): CalendarViewEvent {
  const { event, startDay, endDay } = placed;
  if (gesture === 'resize') {
    const end = shiftDay(endDay, { days });
    // An event without an end lasts its start day, as it would ending there.
    if (end <= startDay && event.end === undefined) return event;
    return { ...event, end: end < startDay ? startDay : end };
  }
  const moved = { ...event, start: shiftDay(startDay, { days }) };
  return event.end === undefined ? moved : { ...moved, end: shiftDay(endDay, { days }) };
}

/**
 * A timed event moved on the wall clock, keeping its elapsed length, or its end moved, leaving it
 * at least `minEventMinutes` long. An event without an end keeps none when it moves.
 */
function changeTimed(
  placed: PlacedEvent,
  { gesture, shift }: EventChange,
  timeZone: string,
): CalendarViewEvent {
  const { event } = placed;
  if (gesture === 'resize') {
    const end = Math.max(
      shiftWall(placed.end, shift, timeZone),
      placed.start + minEventMinutes * minuteMs,
    );
    return { ...event, end: writeInstant(end, event.start, timeZone) };
  }
  const start = shiftWall(placed.start, shift, timeZone);
  const moved = { ...event, start: writeInstant(start, event.start, timeZone) };
  if (event.end === undefined) return moved;
  return { ...moved, end: writeInstant(start + placed.end - placed.start, event.start, timeZone) };
}

/**
 * The event a handle's shift makes, or `null` when the shift changes nothing: a move shifts its
 * start and end alike, keeping its length; a resize shifts its end only. All-day events move and
 * resize by whole days; timed events by days and wall-clock minutes, so a move across a change of
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
