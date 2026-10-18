// Time scales: ISO 8601 dates to positions, with calendar ticks and their labels (specs/SCALES.md).

import {
  fromDate,
  getLocalTimeZone,
  parseIsoDate,
  parseIsoDateTime,
  startOfWeek,
  toCalendarDate,
  toZoned,
  type CalendarDate,
} from '../primitives/index.js';
import { createLinearScale, type ScaleInterval, type ScaleTick } from './linear-scale.js';

/** The calendar unit between a time scale's ticks. */
export type TimeScaleUnit = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface TimeScaleOptions {
  /** The first and last instants, as ISO 8601 dates (`2026-03-01`) or date-times. */
  domain: readonly [string, string];
  /** The positions they map to, such as pixels; reversed ends flip the scale. */
  range: ScaleInterval;
  /** The IANA time zone whose calendar places ticks and reads dates. Defaults to the runtime's. */
  timeZone?: string | undefined;
  /** BCP 47 locale of the labels and the first day of the week. Defaults to the runtime's. */
  locale?: string | undefined;
}

export interface TimeTickOptions {
  /** The unit between ticks. Defaults to the smallest whose ticks number at most `count`. */
  unit?: TimeScaleUnit | undefined;
  /** The most ticks a chosen unit makes. Defaults to 8. */
  count?: number | undefined;
}

export interface TimeScale {
  readonly domain: readonly [string, string];
  readonly range: ScaleInterval;
  /** The position of an ISO 8601 date or date-time; `NaN` for text that is not one. */
  map(value: string): number;
  /** The instant at a position, as an ISO 8601 date-time in UTC; empty for a non-finite position. */
  invert(position: number): string;
  /** The starts of calendar units inside the domain, as `YYYY-MM-DD` dates in increasing order. */
  ticks(options?: TimeTickOptions): Array<ScaleTick<string>>;
  /** An ISO 8601 date or date-time as the label of a tick of `unit`. */
  format(value: string, unit: TimeScaleUnit): string;
}

/** How ticks step: one unit at a time, or several years for long domains. */
interface TickPlan {
  unit: TimeScaleUnit;
  step: number;
}

const defaultTimeTickCount = 8;
const dayLength = 86_400_000;
const units: readonly TimeScaleUnit[] = ['day', 'week', 'month', 'quarter', 'year'];
const averageDays: Readonly<Record<TimeScaleUnit, number>> = {
  day: 1,
  week: 7,
  month: 30.44,
  quarter: 91.31,
  year: 365.25,
};
const labelFormats: Readonly<Record<TimeScaleUnit, Intl.DateTimeFormatOptions>> = {
  day: { month: 'short', day: 'numeric' },
  week: { month: 'short', day: 'numeric' },
  month: { month: 'short', year: 'numeric' },
  quarter: { month: 'short', year: 'numeric' },
  year: { year: 'numeric' },
};

/** The epoch milliseconds of an ISO 8601 text read in `timeZone`; a date is its first instant. */
function readInstant(text: string, timeZone: string): number {
  const date = parseIsoDate(text);
  if (date) return toZoned(date, timeZone).toDate().getTime();
  const dateTime = parseIsoDateTime(text, timeZone);
  return dateTime && 'timeZone' in dateTime ? dateTime.toDate().getTime() : Number.NaN;
}

function planTicks(spanDays: number, { unit, count }: TimeTickOptions): TickPlan {
  if (unit) return { unit, step: 1 };
  const wanted = typeof count === 'number' && Number.isFinite(count) ? count : defaultTimeTickCount;
  const most = Math.max(1, Math.round(wanted));
  const fitting = units.find((candidate) => spanDays / averageDays[candidate] + 1 <= most);
  if (fitting) return { unit: fitting, step: 1 };
  return { unit: 'year', step: Math.ceil((spanDays / averageDays.year + 1) / most) };
}

/** The start of the unit holding `date`; years align to multiples of the step. */
function floorToUnit(date: CalendarDate, plan: TickPlan, locale: string): CalendarDate {
  switch (plan.unit) {
    case 'day':
      return date;
    case 'week':
      return startOfWeek(date, locale);
    case 'month':
      return date.set({ day: 1 });
    case 'quarter':
      return date.set({ month: date.month - ((date.month - 1) % 3), day: 1 });
    case 'year':
      return date.set({ year: Math.floor(date.year / plan.step) * plan.step, month: 1, day: 1 });
  }
}

function addUnit(date: CalendarDate, { unit, step }: TickPlan): CalendarDate {
  switch (unit) {
    case 'day':
      return date.add({ days: 1 });
    case 'week':
      return date.add({ weeks: 1 });
    case 'month':
      return date.add({ months: 1 });
    case 'quarter':
      return date.add({ months: 3 });
    case 'year':
      return date.add({ years: step });
  }
}

/**
 * A time scale from a domain of ISO 8601 instants to a range of positions, linear in elapsed time,
 * with ticks at the starts of calendar days, weeks, months, quarters or years in its time zone.
 */
export function createTimeScale(options: TimeScaleOptions): TimeScale {
  const timeZone = options.timeZone ?? getLocalTimeZone();
  const locale = options.locale ?? new Intl.DateTimeFormat().resolvedOptions().locale;
  const [start, end] = options.domain.map((text) => readInstant(text, timeZone)) as [
    number,
    number,
  ];
  const isReadable = Number.isFinite(start) && Number.isFinite(end);
  const linear = createLinearScale({ domain: [start, end], range: options.range });
  const instantOf = (date: CalendarDate) => toZoned(date, timeZone).toDate().getTime();
  const map = (value: string) =>
    isReadable ? linear.map(readInstant(value, timeZone)) : Number.NaN;
  const format = (value: string, unit: TimeScaleUnit) => {
    const instant = readInstant(value, timeZone);
    if (!Number.isFinite(instant)) return '';
    return new Intl.DateTimeFormat(locale, { timeZone, ...labelFormats[unit] }).format(instant);
  };
  const ticks = (tickOptions: TimeTickOptions = {}) => {
    if (!isReadable) return [];
    const [low, high] = [Math.min(start, end), Math.max(start, end)];
    const plan = planTicks((high - low) / dayLength, tickOptions);
    let date = floorToUnit(toCalendarDate(fromDate(new Date(low), timeZone)), plan, locale);
    if (instantOf(date) < low) date = addUnit(date, plan);
    const result: Array<ScaleTick<string>> = [];
    for (; instantOf(date) <= high; date = addUnit(date, plan)) {
      const value = date.toString();
      result.push({ value, position: map(value), label: format(value, plan.unit) });
    }
    return result;
  };
  return {
    domain: options.domain,
    range: linear.range,
    map,
    invert: (position) => {
      const instant = linear.invert(position);
      return isReadable && Number.isFinite(instant) ? new Date(instant).toISOString() : '';
    },
    ticks,
    format,
  };
}
