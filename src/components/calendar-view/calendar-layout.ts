// Pure layout for a calendar view: events read in a time zone, event bars packed into lanes across
// a week, and timed events placed within a day. Days are `YYYY-MM-DD` texts (calendar-days.ts).

import { parseIsoDate, parseIsoDateTime } from '../../primitives/index.js';
import type { CalendarViewEvent } from './calendar-view.js';
import { compareDays, getDayOf, getDayStart, getWallHours, shiftDay } from './calendar-days.js';

/** An event read in the view's time zone. */
export interface PlacedEvent {
  event: CalendarViewEvent;
  /** Given as dates (`YYYY-MM-DD`): it lasts whole days. */
  isAllDay: boolean;
  /**
   * Lasts whole days, or at least one wall-clock day in the view's zone (so midnight to midnight on
   * a day the clocks change still counts): drawn as a bar across the days it covers.
   */
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
interface DayBlock {
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

const hourLength = 3_600_000;

function maxDay(first: string, second: string): string {
  return first >= second ? first : second;
}

function readAllDay(event: CalendarViewEvent, timeZone: string): PlacedEvent | null {
  const startDay = parseIsoDate(event.start)?.toString();
  if (!startDay) return null;
  const endDay = maxDay(startDay, parseIsoDate(event.end)?.toString() ?? startDay);
  const start = getDayStart(startDay, timeZone);
  const end = getDayStart(shiftDay(endDay, { days: 1 }), timeZone);
  return { event, isAllDay: true, isSpan: true, startDay, endDay, start, end };
}

function readTimed(event: CalendarViewEvent, timeZone: string): PlacedEvent | null {
  const startTime = parseIsoDateTime(event.start, timeZone);
  if (!startTime || !('timeZone' in startTime)) return null;
  const start = startTime.toDate().getTime();
  const endTime = parseIsoDateTime(event.end, timeZone);
  const given = endTime && 'timeZone' in endTime ? endTime.toDate().getTime() : start + hourLength;
  const end = Math.max(start, given);
  const startDay = getDayOf(start, timeZone);
  const endDay = maxDay(startDay, getDayOf(Math.max(start, end - 1), timeZone));
  // A wall-clock day, not 24 elapsed hours: a day the clocks change lasts 23 or 25 hours.
  const isSpan = end >= startTime.add({ days: 1 }).toDate().getTime();
  return { event, isAllDay: false, isSpan, startDay, endDay, start, end };
}

/** The events read in `timeZone`; events whose start is not an ISO 8601 date or date-time are left out. */
export function readEvents(events: readonly CalendarViewEvent[], timeZone: string): PlacedEvent[] {
  return events.flatMap(
    (event) =>
      (parseIsoDate(event.start) ? readAllDay(event, timeZone) : readTimed(event, timeZone)) ?? [],
  );
}

/** Bars first, then by start, longer bars first, then by title. */
function compareEvents(first: PlacedEvent, second: PlacedEvent): number {
  if (first.isSpan !== second.isSpan) return first.isSpan ? -1 : 1;
  const byDay = compareDays(first.startDay, second.startDay);
  if (byDay !== 0) return byDay;
  const byLength = compareDays(second.endDay, first.endDay);
  if (byLength !== 0) return byLength;
  return first.start - second.start || first.event.title.localeCompare(second.event.title);
}

function findFreeLane(lanes: boolean[][], column: number, span: number): number {
  const isFree = (lane: boolean[]) => lane.slice(column, column + span).every((taken) => !taken);
  const index = lanes.findIndex(isFree);
  if (index >= 0) return index;
  lanes.push(Array.from({ length: 7 }, () => false));
  return lanes.length - 1;
}

/**
 * The events of a week as bars packed into lanes: each event takes the first lane free across the
 * days it covers in the week. With `spansOnly`, events within one day that are not all-day are left
 * out (a week view draws them in its time grid).
 */
export function layoutWeek(
  days: readonly string[],
  events: readonly PlacedEvent[],
  { spansOnly }: { spansOnly: boolean },
): { segments: WeekSegment[]; laneCount: number } {
  const [first, last] = [days[0], days.at(-1)];
  if (!first || !last) return { segments: [], laneCount: 0 };
  const inWeek = events.filter(
    (placed) => (!spansOnly || placed.isSpan) && placed.startDay <= last && placed.endDay >= first,
  );
  const lanes: boolean[][] = [];
  const segments = [...inWeek].sort(compareEvents).map((placed) => {
    const continuesBefore = placed.startDay < first;
    const continuesAfter = placed.endDay > last;
    const column = continuesBefore ? 0 : days.indexOf(placed.startDay);
    const end = continuesAfter ? 6 : days.indexOf(placed.endDay);
    const span = end - column + 1;
    const lane = findFreeLane(lanes, column, span);
    lanes[lane]?.fill(true, column, column + span);
    return { placed, column, span, lane, continuesBefore, continuesAfter };
  });
  return { segments, laneCount: lanes.length };
}

/** The segments that cover a column. */
export function findColumnSegments(
  segments: readonly WeekSegment[],
  column: number,
): WeekSegment[] {
  return segments.filter(
    (segment) => segment.column <= column && column < segment.column + segment.span,
  );
}

/**
 * How many lanes a week shows when each day shows at most `maxEvents` rows: all of them when every
 * day fits, otherwise one fewer than `maxEvents`, leaving a row for the count of the hidden ones.
 */
export function countVisibleLanes(segments: readonly WeekSegment[], maxEvents: number): number {
  const most = Math.max(1, Math.floor(maxEvents));
  const fits = Array.from({ length: 7 }, (_, column) => findColumnSegments(segments, column)).every(
    (covering) => covering.length <= most,
  );
  return fits ? most : most - 1;
}

/** Packs overlapping blocks side by side: each takes the first column free at its start. */
function packColumns(blocks: Array<Omit<DayBlock, 'left' | 'width'>>): DayBlock[] {
  const result: DayBlock[] = [];
  let cluster: Array<{ block: Omit<DayBlock, 'left' | 'width'>; column: number }> = [];
  let columnEnds: number[] = [];
  let clusterEnd = Number.NEGATIVE_INFINITY;
  const flush = () => {
    const width = 100 / Math.max(1, columnEnds.length);
    for (const { block, column } of cluster) result.push({ ...block, left: column * width, width });
    cluster = [];
    columnEnds = [];
  };
  for (const block of blocks) {
    const bottom = block.top + block.height;
    if (block.top >= clusterEnd) flush();
    let column = columnEnds.findIndex((end) => end <= block.top);
    if (column < 0) column = columnEnds.push(bottom) - 1;
    else columnEnds[column] = bottom;
    cluster.push({ block, column });
    clusterEnd = Math.max(clusterEnd, bottom);
  }
  flush();
  return result;
}

const dayMs = 86_400_000;

/**
 * The timed events of one day (those that are not bars), each clipped to the day and placed on
 * the day's 24-hour wall-clock ruler, with overlapping events side by side. An instant sits at its
 * wall-clock time, so a skipped hour stays empty and both passes of a repeated hour share its
 * place; an event whose end reads earlier than its start, running back through a repeated hour,
 * keeps its elapsed length from its start.
 */
export function layoutDay(
  day: string,
  events: readonly PlacedEvent[],
  timeZone: string,
): DayBlock[] {
  const from = getDayStart(day, timeZone);
  const to = getDayStart(shiftDay(day, { days: 1 }), timeZone);
  const place = (instant: number) =>
    instant >= to ? 100 : (getWallHours(instant, timeZone) / 24) * 100;
  const blocks = events
    .filter(
      (placed) =>
        !placed.isSpan && placed.start < to && (placed.end > from || placed.start >= from),
    )
    .sort((first, second) => first.start - second.start || second.end - first.end)
    .map((placed) => {
      const start = Math.max(placed.start, from);
      const end = Math.min(placed.end, to);
      const top = place(start);
      const bottom = place(end);
      const elapsed = ((end - start) / dayMs) * 100;
      return {
        placed,
        top,
        height: bottom >= top ? bottom - top : Math.min(100 - top, elapsed),
        continuesBefore: placed.start < from,
        continuesAfter: placed.end > to,
      };
    });
  return packColumns(blocks);
}
