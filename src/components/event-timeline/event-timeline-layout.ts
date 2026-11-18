import type { Key, Tone } from '../../core/props.js';
import { clamp } from '../../utils/clamp.js';
import { createLinearScale } from '../../utils/linear-scale.js';

/** An event the caller reports, read by the layout. */
export interface EventTimelineEventInput {
  id: Key;
  at: number;
  duration?: number | undefined;
  tone?: Tone | undefined;
}

/** The first and last elapsed time the axis shows, in the caller's unit. */
export interface EventTimelineRange {
  start: number;
  end: number;
}

/** Which ends of an interval the range cuts off. */
type EventTimelineClip = 'start' | 'end' | 'both';

/** An event placed on the axis: its lane and its offset and width as percentages of the axis. */
export interface PlacedEvent<E extends EventTimelineEventInput> {
  event: E;
  /** The event's place in time order, ties kept in input order. */
  order: number;
  lane: number;
  offset: number;
  width: number;
  isInterval: boolean;
  clip: EventTimelineClip | undefined;
}

/** A tick on the axis: its value and its offset as a percentage of the axis. */
interface EventTimelineTick {
  value: number;
  offset: number;
  /** The value written for the locale with as many decimals as the tick step has. */
  label: string;
}

export interface EventTimelineLayout<E extends EventTimelineEventInput> {
  range: EventTimelineRange;
  /** Every readable event in time order, drawn or not; the companion table lists these. */
  events: readonly E[];
  /** The events drawn in the range, in time order. */
  placed: ReadonlyArray<PlacedEvent<E>>;
  lanes: number;
  ticks: readonly EventTimelineTick[];
}

/** Whether an event has a readable position. */
function isReadableEvent(event: EventTimelineEventInput): boolean {
  return typeof event.at === 'number' && Number.isFinite(event.at);
}

/** An event's length, or 0 for a marker: a duration that is not a finite, positive number. */
export function readDuration(event: EventTimelineEventInput): number {
  const { duration } = event;
  return typeof duration === 'number' && Number.isFinite(duration) && duration > 0 ? duration : 0;
}

function isReadableRange(range: EventTimelineRange | undefined): range is EventTimelineRange {
  return (
    range !== undefined &&
    Number.isFinite(range.start) &&
    Number.isFinite(range.end) &&
    range.end > range.start
  );
}

/** The given range when readable, otherwise the events' first start to last end, widened to whole ticks. */
function resolveRange(
  events: readonly EventTimelineEventInput[],
  given: EventTimelineRange | undefined,
): EventTimelineRange {
  if (isReadableRange(given)) return { start: given.start, end: given.end };
  let start = Infinity;
  let end = -Infinity;
  for (const event of events) {
    start = Math.min(start, event.at);
    end = Math.max(end, event.at + readDuration(event));
  }
  if (start === Infinity) return { start: 0, end: 1 };
  const [low, high] = createLinearScale({ domain: [start, end], range: [0, 1], nice: true }).domain;
  return { start: low, end: high };
}

function readClip(
  [first, last]: readonly [number, number],
  range: EventTimelineRange,
): EventTimelineClip | undefined {
  const cutsStart = first < range.start;
  const cutsEnd = last > range.end;
  if (cutsStart && cutsEnd) return 'both';
  if (cutsStart) return 'start';
  return cutsEnd ? 'end' : undefined;
}

/**
 * Puts each event in the first lane whose last event (with the room after it) ends before it
 * starts, so coincident or overlapping events never share a lane. `ends` holds each lane's last
 * end and grows as needed.
 */
function assignLane(ends: number[], [first, last]: readonly [number, number]): number {
  const free = ends.findIndex((end) => end < first);
  const lane = free === -1 ? ends.length : free;
  ends[lane] = last;
  return lane;
}

/**
 * Places readable events on the axis in time order (ties in input order): each event within the
 * range gets a lane, an offset and, for an interval, a width, cut at the range's ends. Events wholly
 * outside the range are not drawn. Positions stay exact: offsets are proportions of the range.
 */
export function layoutEventTimeline<E extends EventTimelineEventInput>(
  input: readonly E[],
  {
    range: given,
    locale,
    spacing,
  }: { range: EventTimelineRange | undefined; locale: string; spacing: number },
): EventTimelineLayout<E> {
  const events = input
    .filter(isReadableEvent)
    .map((event, index) => ({ event, index }))
    .sort((a, b) => a.event.at - b.event.at || a.index - b.index)
    .map(({ event }) => event);
  const range = resolveRange(events, given);
  const scale = createLinearScale({ domain: [range.start, range.end], range: [0, 100], locale });
  const ends: number[] = [];
  // A spacing outside 0 to 1 is clamped; one that is not a finite number keeps no room.
  const room = (range.end - range.start) * (Number.isFinite(spacing) ? clamp(spacing, 0, 1) : 0);
  const placed: Array<PlacedEvent<E>> = [];
  events.forEach((event, order) => {
    const span = [event.at, event.at + readDuration(event)] as const;
    if (span[1] < range.start || span[0] > range.end) return;
    const first = Math.max(span[0], range.start);
    const last = Math.min(span[1], range.end);
    const offset = scale.map(first);
    placed.push({
      event,
      order,
      lane: assignLane(ends, [span[0], span[1] + room]),
      offset,
      width: scale.map(last) - offset,
      isInterval: span[1] > span[0],
      clip: readClip(span, range),
    });
  });
  const ticks = scale
    .ticks()
    .map(({ value, position, label }) => ({ value, offset: position, label }));
  return { range, events, placed, lanes: Math.max(ends.length, 1), ticks };
}
