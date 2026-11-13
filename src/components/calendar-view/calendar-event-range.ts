// The event editor's value model: an event's start and end as a date or date-time range, back and
// forth, in the calendar's zone (specs/CALENDAR-VIEW.md, UIC-CALENDAR-VIEW-5.2).

import {
  formatIsoDate,
  fromDate,
  parseIsoDate,
  parseIsoDateTime,
  toCalendarDate,
  toCalendarDateTime,
} from '../../primitives/index.js';
import type { PlacedEvent } from './calendar-layout.js';
import type { CalendarViewEvent } from './calendar-view.js';

/** An event's start and end as the editor shows them: dates, or date-times. */
export interface EventRange {
  start: string;
  end: string;
}

/** The time an event made timed in the editor starts and ends at, on its first and last days. */
const timedDefaults = { start: '09:00', end: '10:00' };

/** The day a date-time text falls on in `timeZone`, or the text itself when it is not one. */
function toDayText(text: string, timeZone: string): string {
  const value = parseIsoDateTime(text, timeZone);
  return value ? toCalendarDate(value).toString() : text;
}

/**
 * The last day a timed range occupies in `timeZone`: its end's day, or the day before when it ends
 * exactly at midnight after it starts, since a timed end is exclusive and an all-day end is not.
 */
function toLastDayText(range: EventRange, timeZone: string): string {
  const end = parseIsoDateTime(range.end, timeZone);
  if (!end) return range.end;
  const start = parseIsoDateTime(range.start, timeZone);
  const day = toCalendarDate(end);
  const isMidnight =
    end.hour === 0 && end.minute === 0 && end.second === 0 && end.millisecond === 0;
  const isAfterStart = start !== null && end.compare(start) > 0;
  return (isMidnight && isAfterStart ? day.subtract({ days: 1 }) : day).toString();
}

/** A range in the other form: the days a timed range covers, or the default hours of all-day days. */
export function convertRange(range: EventRange, toAllDay: boolean, timeZone: string): EventRange {
  if (toAllDay)
    return { start: toDayText(range.start, timeZone), end: toLastDayText(range, timeZone) };
  return {
    start: `${range.start}T${timedDefaults.start}`,
    end: `${range.end}T${timedDefaults.end}`,
  };
}

/** The event's own range: its days when all-day, its start and end (an hour by default) when timed. */
function readRange(placed: PlacedEvent, timeZone: string): EventRange {
  if (placed.isAllDay) return { start: placed.startDay, end: placed.endDay };
  const { start, end } = placed.event;
  return { start, end: end ?? formatIsoDate(fromDate(new Date(placed.end), timeZone)) };
}

/** The event's range in the editor's form, all-day or timed. */
export function toEventRange(placed: PlacedEvent, isAllDay: boolean, timeZone: string): EventRange {
  const own = readRange(placed, timeZone);
  return placed.isAllDay === isAllDay ? own : convertRange(own, isAllDay, timeZone);
}

/** Whether a range's end does not come before its start; a range the form cannot read is not. */
export function isOrderedRange(range: EventRange, isAllDay: boolean, timeZone: string): boolean {
  if (isAllDay) {
    const start = parseIsoDate(range.start);
    const end = parseIsoDate(range.end);
    return start !== null && end !== null && end.compare(start) >= 0;
  }
  const start = parseIsoDateTime(range.start, timeZone);
  const end = parseIsoDateTime(range.end, timeZone);
  if (!start || !end || !('timeZone' in start) || !('timeZone' in end)) return false;
  return end.toDate().getTime() >= start.toDate().getTime();
}

/** Whether a date-time text names its offset or zone, rather than a wall clock. */
function isAnchored(text: string): boolean {
  return /T.*(?:Z|[+-]\d{2}(?::?\d{2})?|\])$/i.test(text);
}

/** A bracketed zone name ending a date-time text, as in `…-04:00[America/New_York]`. */
const zoneName = /\[[^\]]*\]$/;

/**
 * A date-time the editor wrote, in the form of the event's start: with its offset and zone name
 * when the start names a zone, with its offset alone when the start gives an offset or `Z` (a text
 * `Date` reads), else as the wall clock in the calendar's zone, as the event gave it.
 */
export function toEventText(text: string, like: string, timeZone: string): string {
  if (zoneName.test(like)) return text;
  if (isAnchored(like)) return text.replace(zoneName, '');
  const value = parseIsoDateTime(text, timeZone);
  return value ? formatIsoDate(toCalendarDateTime(value)) : text;
}

/** The event with the editor's title and range. */
export function applyEdit(
  event: CalendarViewEvent,
  edit: { title: string; isAllDay: boolean; range: EventRange },
  timeZone: string,
): CalendarViewEvent {
  const { title, isAllDay, range } = edit;
  if (isAllDay) return { ...event, title, start: range.start, end: range.end };
  return {
    ...event,
    title,
    start: toEventText(range.start, event.start, timeZone),
    end: toEventText(range.end, event.start, timeZone),
  };
}
