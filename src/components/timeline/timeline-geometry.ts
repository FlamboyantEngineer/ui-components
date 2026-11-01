// Pure timeline layout: the range and axis, scale header cells, item spans, item changes from keys
// and drags, and dependency connector paths (specs/TIMELINE.md).

import { clamp } from '../../utils/clamp.js';
import type { Key, Tone } from '../../core/props.js';
import { requireDefined } from '../../utils/require-defined.js';
import {
  addTimeUnits,
  createTimeScale,
  floorToTimeUnit,
  type TimeScale,
  type TimeScaleUnit,
} from '../../utils/time-scale.js';

/** The zoom level: the calendar unit of the scale's lower header row and of a keyboard step. */
export type TimelineScale = 'day' | 'week' | 'month' | 'quarter';

/** A `bar` spans its first to its last day; a `milestone` marks one day. */
export type TimelineItemKind = 'bar' | 'milestone';

/** An item on a row: a bar or a milestone. */
export interface TimelineItem {
  /** Identifies the item. */
  id: Key;
  /** The row it sits on. */
  rowId: Key;
  /** Its name, shown on it and read as its accessible name. */
  label: string;
  /** The first day (`YYYY-MM-DD`), or a milestone's day. */
  start: string;
  /** A bar's last day, included (`YYYY-MM-DD`). Missing or before `start`, the bar lasts one day. */
  end?: string | undefined;
  /** Defaults to `bar`. */
  kind?: TimelineItemKind | undefined;
  /** How far a bar has come, from 0 to 1. */
  progress?: number | undefined;
  /** The item's tone, published for the stylesheet. Defaults to `neutral`. */
  tone?: Tone | undefined;
  /** Keeps the item from being moved or resized. */
  isReadOnly?: boolean | undefined;
}

/** An item's new days after a move or a resize. A milestone's `end` equals its `start`. */
export interface TimelineItemChange {
  id: Key;
  start: string;
  end: string;
}

/** A finish-to-start dependency: `to` follows `from`. */
export interface TimelineDependency {
  from: Key;
  to: Key;
}

/** The days a timeline shows, both included, as `YYYY-MM-DD` dates. */
export interface TimelineRange {
  start: string;
  end: string;
}

/** What a dragged pointer grabbed: the whole item, or one end of a bar. */
export type TimelineDragEdge = 'move' | 'start' | 'end';

/** An item read with its kind and a last day never before its first. */
export interface ReadItem {
  id: Key;
  kind: TimelineItemKind;
  start: string;
  end: string;
}

/** The horizontal geometry: a UTC time scale from the first day to the day after the last. */
export interface TimelineAxis {
  scale: TimeScale;
  range: TimelineRange;
  /** The day after the range's last day, where the scale ends. */
  until: string;
  dayWidth: number;
  width: number;
}

/** A cell of a scale header row: the unit's first day (or the range's) and its extent, in pixels. */
interface TimelineScaleCell {
  start: string;
  left: number;
  width: number;
}

interface ConnectorPoints {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  rowHeight: number;
}

interface ScalePlan {
  /** Pixels per day. */
  dayWidth: number;
  /** The unit of the upper header row. */
  major: TimeScaleUnit;
  /** The unit of the lower header row, the gridlines and a keyboard step. */
  minor: TimeScaleUnit;
}

const dayLength = 86_400_000;
const connectorGap = 8;
const arrowSize = 4;

/** The scale plans of the zoom levels. */
export const timelineScales: Readonly<Record<TimelineScale, ScalePlan>> = {
  day: { dayWidth: 32, major: 'month', minor: 'day' },
  week: { dayWidth: 16, major: 'month', minor: 'week' },
  month: { dayWidth: 4, major: 'year', minor: 'month' },
  quarter: { dayWidth: 1.5, major: 'year', minor: 'quarter' },
};

/** Whether a text is a real `YYYY-MM-DD` date. */
function isTimelineDate(text: string | undefined): text is string {
  return text !== undefined && floorToTimeUnit(text, 'day') === text;
}

function countDays(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / dayLength);
}

/** An item's kind and days; `null` when its first day is not a date. */
export function readTimelineItem(item: TimelineItem): ReadItem | null {
  if (!isTimelineDate(item.start)) return null;
  const kind = item.kind ?? 'bar';
  const end = kind === 'bar' && isTimelineDate(item.end) && item.end > item.start;
  return { id: item.id, kind, start: item.start, end: end ? requireDefined(item.end) : item.start };
}

/**
 * A bar's progress as a share from 0 to 1, clamped, or `undefined` when there is none: for a
 * milestone, and for a missing or non-finite value. The chart and the table read it alike.
 */
export function readTimelineProgress(item: TimelineItem): number | undefined {
  const { progress, kind = 'bar' } = item;
  if (kind !== 'bar' || typeof progress !== 'number' || !Number.isFinite(progress))
    return undefined;
  return clamp(progress, 0, 1);
}

/**
 * The caller's range when it is readable; otherwise the items' first to last day (today when there
 * are none), widened to whole units of the scale plus one unit on each side. `null` when there is
 * neither a range nor an item and today is unknown, before the clock may be read.
 */
export function resolveTimelineRange(options: {
  range: TimelineRange | undefined;
  items: readonly TimelineItem[];
  scale: TimelineScale;
  today: string | null;
  locale: string;
}): TimelineRange | null {
  const { range, items, scale, today, locale } = options;
  if (range && isTimelineDate(range.start) && isTimelineDate(range.end)) {
    if (range.end >= range.start) return range;
  }
  let low: string | undefined;
  let high: string | undefined;
  for (const item of items) {
    const read = readTimelineItem(item);
    if (!read) continue;
    if (low === undefined || read.start < low) low = read.start;
    if (high === undefined || read.end > high) high = read.end;
  }
  const from = low ?? today;
  const to = high ?? today;
  if (from === null || to === null) return null;
  const unit = timelineScales[scale].minor;
  const first = floorToTimeUnit(from, unit, locale);
  const last = floorToTimeUnit(to, unit, locale);
  return {
    start: addTimeUnits(first, unit, -1),
    end: addTimeUnits(addTimeUnits(last, unit, 2), 'day', -1),
  };
}

export function createTimelineAxis(
  range: TimelineRange,
  scale: TimelineScale,
  locale: string,
): TimelineAxis {
  const { dayWidth } = timelineScales[scale];
  const until = addTimeUnits(range.end, 'day', 1);
  const width = countDays(range.start, until) * dayWidth;
  const timeScale = createTimeScale({
    domain: [range.start, until],
    range: [0, width],
    timeZone: 'UTC',
    locale,
  });
  return { scale: timeScale, range, until, dayWidth, width };
}

/** The cells of a header row of `unit`: whole units, with partial ones at the range's ends. */
export function resolveScaleCells(axis: TimelineAxis, unit: TimeScaleUnit): TimelineScaleCell[] {
  const starts = axis.scale
    .ticks({ unit })
    .map((tick) => tick.value)
    .filter((value) => value < axis.until);
  if (starts[0] !== axis.range.start) starts.unshift(axis.range.start);
  return starts.map((start, index) => {
    const left = axis.scale.map(start);
    return { start, left, width: axis.scale.map(starts[index + 1] ?? axis.until) - left };
  });
}

/** A bar's left and right edges, or a milestone's day centre as both, in pixels. */
export function resolveItemSpan(axis: TimelineAxis, item: ReadItem) {
  const left = axis.scale.map(item.start);
  if (item.kind === 'milestone') {
    const center = left + axis.dayWidth / 2;
    return { left: center, right: center };
  }
  // A bar that crosses an end of the range is cut at it, so nothing reaches past the axis.
  const right = axis.scale.map(addTimeUnits(item.end, 'day', 1));
  return { left: clamp(left, 0, axis.width), right: clamp(right, 0, axis.width) };
}

/** Whether any day of the item falls in the axis's range, so the chart draws it. */
export function isInTimelineRange(axis: TimelineAxis, item: ReadItem): boolean {
  return item.end >= axis.range.start && item.start <= axis.range.end;
}

/**
 * A physical inline offset from the axis's start: from the left, or from the right on a
 * right-to-left axis. Physical rather than logical, so every renderer and test reads it the same.
 */
export function toInlineStart(
  offset: number,
  isRtl: boolean,
): { left: number } | { right: number } {
  return isRtl ? { right: offset } : { left: offset };
}

/**
 * The change an arrow key asks for: Left and Right move the item by one unit of the scale, keeping
 * a bar's length in days; with Shift they move a bar's last day, never before its first. On a
 * right-to-left axis Left moves later and Right earlier. `null` for any other key, and for Shift
 * with a milestone.
 */
export function resolveKeyboardChange(
  item: ReadItem,
  key: { key: string; shiftKey: boolean; isRtl?: boolean | undefined },
  scale: TimelineScale,
): TimelineItemChange | null {
  const step = { ArrowLeft: -1, ArrowRight: 1 }[key.key];
  if (step === undefined) return null;
  const direction = key.isRtl ? -step : step;
  const unit = timelineScales[scale].minor;
  if (key.shiftKey) {
    if (item.kind === 'milestone') return null;
    const end = addTimeUnits(item.end, unit, direction);
    return { id: item.id, start: item.start, end: end < item.start ? item.start : end };
  }
  const start = addTimeUnits(item.start, unit, direction);
  const end = addTimeUnits(item.end, 'day', countDays(item.start, start));
  return { id: item.id, start, end };
}

/** The change a pointer drag of `days` whole days asks for, by what it grabbed. */
export function resolveDragChange(
  item: ReadItem,
  edge: TimelineDragEdge,
  days: number,
): TimelineItemChange {
  const shift = (date: string) => addTimeUnits(date, 'day', days);
  if (edge === 'start') {
    const start = shift(item.start);
    return { id: item.id, start: start > item.end ? item.end : start, end: item.end };
  }
  if (edge === 'end') {
    const end = shift(item.end);
    return { id: item.id, start: item.start, end: end < item.start ? item.start : end };
  }
  return { id: item.id, start: shift(item.start), end: shift(item.end) };
}

/** A dependency is in conflict when the item that follows starts before the one it follows ends. */
export function isDependencyConflict(from: ReadItem, to: ReadItem): boolean {
  return to.start < from.end;
}

/**
 * An orthogonal connector from the end of one item to the start of another, ending in an arrow
 * head. When the target starts too close or before the source ends, the path steps back along the
 * boundary of the target's row.
 */
export function resolveConnectorPath({ x1, y1, x2, y2, rowHeight }: ConnectorPoints): string {
  const out = x1 + connectorGap;
  const head = `M${x2 - arrowSize},${y2 - arrowSize}L${x2},${y2}L${x2 - arrowSize},${y2 + arrowSize}`;
  if (x2 - x1 >= 2 * connectorGap) {
    const line = y1 === y2 ? `M${x1},${y1}H${x2}` : `M${x1},${y1}H${out}V${y2}H${x2}`;
    return line + head;
  }
  const boundary = y2 > y1 ? y2 - rowHeight / 2 : y2 + rowHeight / 2;
  return `M${x1},${y1}H${out}V${boundary}H${x2 - connectorGap}V${y2}H${x2}${head}`;
}
