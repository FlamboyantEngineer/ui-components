// The days of a calendar heatmap: a week per column, a weekday per row (specs/CHART.md).

import { parseIsoDate, startOfWeek } from '../../primitives/index.js';

/** A day of the week, as the date fields name it. */
export type HeatmapWeekday = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

/** One day's measurement. */
export interface CalendarHeatmapDay {
  /** The calendar day, `YYYY-MM-DD`; it is a day, not an instant, so no time zone moves it. */
  date: string;
  /** The day's value; `null`, or one that is not a finite number, is a missing value. */
  value: number | null;
}

/** `value`: a finite number; `missing`: given without one; `absent`: not given at all. */
export type HeatmapDayState = 'value' | 'missing' | 'absent';

/** A drawn day. */
export interface HeatmapCell {
  /** The day, `YYYY-MM-DD`, which also keys it. */
  key: string;
  /** Its row: its place in the week, from the first day of the week. */
  series: number;
  /** Its column: its week, from the left edge (the right edge in right-to-left reading). */
  index: number;
  state: HeatmapDayState;
  value: number | null;
  /** The intensity level of a value: 0 at or below the low bound, up to `levels`. */
  level: number | undefined;
  /** Whether the value lies beyond the bounds, drawn at the nearest level. */
  outlier: 'low' | 'high' | undefined;
  x: number;
  y: number;
}

/** The first column of each month, with its first day, for a label above it. */
export interface HeatmapMonth {
  date: string;
  column: number;
  x: number;
}

/** The levels' bounds: values at or below `low` are level 0; each level spans `step` above it. */
export interface HeatmapScale {
  low: number;
  high: number;
  levels: number;
  step: number;
}

export interface HeatmapGeometryInput {
  days: readonly CalendarHeatmapDay[];
  /** The first and last days drawn; default to the first and last given days. */
  start?: string | undefined;
  end?: string | undefined;
  locale: string;
  firstDayOfWeek?: HeatmapWeekday | undefined;
  minValue?: number | undefined;
  maxValue?: number | undefined;
  levels: number;
  /** The widest a day's square may be, and the room left for weekday names and month names. */
  cellSize: number;
  width: number;
  margin: { left: number; top: number };
  isRtl: boolean;
}

export interface HeatmapGeometry {
  cells: HeatmapCell[];
  months: HeatmapMonth[];
  /** The weekday names' rows: each row's first day, and its centre. */
  weekdays: { date: string; y: number }[];
  scale: HeatmapScale;
  cell: number;
  width: number;
  height: number;
}

const dayLength = 86_400_000;
const gap = 2;
const smallestCell = 8;

/** A day as a count of days since 1970-01-01, or `null` for a text that is not a calendar day. */
export function toDayNumber(text: string): number | null {
  const day = parseIsoDate(text);
  return day ? Date.UTC(day.year, day.month - 1, day.day) / dayLength : null;
}

/** A day count as its `YYYY-MM-DD` text. */
export function toDayText(day: number): string {
  return new Date(day * dayLength).toISOString().slice(0, 10);
}

/** The given days by day count, each date's first entry kept; unreadable dates are left out. */
function indexDays(days: readonly CalendarHeatmapDay[]): Map<number, CalendarHeatmapDay> {
  const byDay = new Map<number, CalendarHeatmapDay>();
  for (const day of days) {
    const number = toDayNumber(day.date);
    if (number !== null && !byDay.has(number)) byDay.set(number, day);
  }
  return byDay;
}

/** The days drawn: the given bounds, else the first and last given days. */
function findRange(input: HeatmapGeometryInput, byDay: Map<number, CalendarHeatmapDay>) {
  const given = [...byDay.keys()];
  const first = input.start === undefined ? Math.min(...given) : toDayNumber(input.start);
  const last = input.end === undefined ? Math.max(...given) : toDayNumber(input.end);
  if (first === null || last === null || !Number.isFinite(first) || !Number.isFinite(last))
    return null;
  return first <= last ? { first, last } : null;
}

const isFiniteValue = (value: number | null): value is number =>
  value !== null && Number.isFinite(value);

/** The levels' bounds: the given ones, else zero (or a lower value) and the highest value. */
export function resolveHeatmapScale(
  values: readonly number[],
  bounds: Pick<HeatmapGeometryInput, 'minValue' | 'maxValue' | 'levels'>,
): HeatmapScale {
  const levels = Math.max(1, Math.floor(bounds.levels));
  const low = bounds.minValue ?? Math.min(0, ...values);
  const high = Math.max(low, bounds.maxValue ?? Math.max(low, ...values));
  return { low, high, levels, step: (high - low) / levels };
}

/** A value's level, and whether it lies beyond the bounds. */
export function toLevel(
  value: number,
  scale: HeatmapScale,
): { level: number; outlier: 'low' | 'high' | undefined } {
  const outlier = value < scale.low ? 'low' : value > scale.high ? 'high' : undefined;
  if (value <= scale.low) return { level: 0, outlier };
  if (scale.step === 0) return { level: scale.levels, outlier };
  const level = Math.ceil((value - scale.low) / scale.step);
  return { level: Math.min(scale.levels, Math.max(1, level)), outlier };
}

/** The first day count of the week holding `day`. */
function findWeekStart(day: number, input: HeatmapGeometryInput): number {
  const date = parseIsoDate(toDayText(day));
  if (!date) return day;
  const start = startOfWeek(date, input.locale, input.firstDayOfWeek);
  return Date.UTC(start.year, start.month - 1, start.day) / dayLength;
}

/**
 * Lays the days from `start` to `end` out as squares, a week per column and a weekday per row
 * from the first day of the week. Each day draws, given or not: a value, a missing value or an
 * absent day. Squares shrink to fit `width`, down to 8 pixels, past which the drawing overflows.
 * Right-to-left reading mirrors the columns, so the arrow keys still move as they look.
 */
export function resolveHeatmapGeometry(input: HeatmapGeometryInput): HeatmapGeometry | null {
  const byDay = indexDays(input.days);
  const range = findRange(input, byDay);
  if (!range) return null;
  const firstWeek = findWeekStart(range.first, input);
  const weeks = Math.floor((range.last - firstWeek) / 7) + 1;
  const room = (input.width - input.margin.left) / weeks - gap;
  const cell = Math.max(smallestCell, Math.min(input.cellSize, Math.floor(room)));
  const pitch = cell + gap;
  const width = input.margin.left + weeks * pitch;
  const toX = (column: number) => {
    const x = input.margin.left + column * pitch;
    return input.isRtl ? width - x - cell : x;
  };
  const values: number[] = [];
  for (let day = range.first; day <= range.last; day += 1) {
    const value = byDay.get(day)?.value ?? null;
    if (isFiniteValue(value)) values.push(value);
  }
  const scale = resolveHeatmapScale(values, input);
  const cells: HeatmapCell[] = [];
  const months: HeatmapMonth[] = [];
  for (let day = range.first; day <= range.last; day += 1) {
    const offset = day - firstWeek;
    const column = Math.floor(offset / 7);
    const given = byDay.get(day);
    const value = given && isFiniteValue(given.value) ? given.value : null;
    const state: HeatmapDayState = !given ? 'absent' : value === null ? 'missing' : 'value';
    const level = value === null ? { level: undefined, outlier: undefined } : toLevel(value, scale);
    const date = toDayText(day);
    if (day === range.first || date.endsWith('-01')) months.push({ date, column, x: toX(column) });
    cells.push({
      key: date,
      series: offset % 7,
      index: input.isRtl ? weeks - 1 - column : column,
      state,
      value,
      ...level,
      x: toX(column),
      y: input.margin.top + (offset % 7) * pitch,
    });
  }
  const weekdays = Array.from({ length: 7 }, (_, row) => ({
    date: toDayText(firstWeek + row),
    y: input.margin.top + row * pitch + cell / 2,
  }));
  // A month that begins too near the next one to name it leaves the room to that one.
  const named = months.filter(
    (month, place) => (months[place + 1]?.column ?? Infinity) - month.column >= 3,
  );
  return {
    cells,
    months: named,
    weekdays,
    scale,
    cell,
    width,
    height: input.margin.top + 7 * pitch,
  };
}
