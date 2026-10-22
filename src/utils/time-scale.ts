// Time scales: ISO 8601 dates to positions, with calendar ticks and their labels (specs/SCALES.md).

import {
  fromDate,
  getLocalTimeZone,
  parseIsoDate,
  startOfWeek,
  toCalendarDate,
  toZoned,
  type CalendarDate,
} from '../primitives/index.js';
import { createLinearScale, type ScaleInterval, type ScaleTick } from './linear-scale.js';
import { readTimeInstant } from './read-time-instant.js';

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
const units: readonly TimeScaleUnit[] = ['day', 'week', 'month', 'quarter', 'year'];
const labelFormats: Readonly<Record<TimeScaleUnit, Intl.DateTimeFormatOptions>> = {
  day: { month: 'short', day: 'numeric' },
  week: { month: 'short', day: 'numeric' },
  month: { month: 'short', year: 'numeric' },
  quarter: { month: 'short', year: 'numeric' },
  year: { year: 'numeric' },
};

function planTicks(
  { unit, count }: TimeTickOptions,
  countTicks: (plan: TickPlan) => number,
): TickPlan {
  if (unit) return { unit, step: 1 };
  const wanted = typeof count === 'number' && Number.isFinite(count) ? count : defaultTimeTickCount;
  const most = Math.max(1, Math.round(wanted));
  const fitting = units.find((candidate) => countTicks({ unit: candidate, step: 1 }) <= most);
  if (fitting) return { unit: fitting, step: 1 };
  let step = 2;
  while (countTicks({ unit: 'year', step }) > most) step += 1;
  return { unit: 'year', step };
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

/** `date` moved by `count` units, which may be negative; month ends clamp (Jan 31 + 1 month is Feb 28). */
function shiftByUnits(date: CalendarDate, unit: TimeScaleUnit, count: number): CalendarDate {
  switch (unit) {
    case 'day':
      return date.add({ days: count });
    case 'week':
      return date.add({ weeks: count });
    case 'month':
      return date.add({ months: count });
    case 'quarter':
      return date.add({ months: 3 * count });
    case 'year':
      return date.add({ years: count });
  }
}

function addUnit(date: CalendarDate, plan: TickPlan, locale: string): CalendarDate | undefined {
  const next = shiftByUnits(date, plan.unit, plan.unit === 'year' ? plan.step : 1);
  // Calendar arithmetic clamps at its supported limit, sometimes between unit boundaries.
  return next.compare(date) > 0 && floorToUnit(next, plan, locale).compare(next) === 0
    ? next
    : undefined;
}

/**
 * The first day of the calendar `unit` holding a `YYYY-MM-DD` date, as a `YYYY-MM-DD` date; weeks
 * start on the first day of the week of `locale` (the runtime's by default). Empty for a text that
 * is not a date.
 */
export function floorToTimeUnit(date: string, unit: TimeScaleUnit, locale?: string): string {
  const parsed = parseIsoDate(date);
  const weekLocale = locale ?? new Intl.DateTimeFormat().resolvedOptions().locale;
  return parsed ? floorToUnit(parsed, { unit, step: 1 }, weekLocale).toString() : '';
}

/**
 * A `YYYY-MM-DD` date moved by `count` calendar units (negative counts move back), as a
 * `YYYY-MM-DD` date. A day past the end of the target month clamps to its last day. Empty for a
 * text that is not a date.
 */
export function addTimeUnits(date: string, unit: TimeScaleUnit, count: number): string {
  const parsed = parseIsoDate(date);
  return parsed && Number.isFinite(count)
    ? shiftByUnits(parsed, unit, Math.trunc(count)).toString()
    : '';
}

/**
 * A time scale from a domain of ISO 8601 instants to a range of positions, linear in elapsed time,
 * with ticks at the starts of calendar days, weeks, months, quarters or years in its time zone.
 */
export function createTimeScale(options: TimeScaleOptions): TimeScale {
  const timeZone = options.timeZone ?? getLocalTimeZone();
  const locale = options.locale ?? new Intl.DateTimeFormat().resolvedOptions().locale;
  const [start, end] = options.domain.map((text) => readTimeInstant(text, timeZone)) as [
    number,
    number,
  ];
  const isReadable = Number.isFinite(start) && Number.isFinite(end);
  const linear = createLinearScale({ domain: [start, end], range: options.range });
  const labels = new Map<TimeScaleUnit, Intl.DateTimeFormat>();
  const instantOf = (date: CalendarDate) => toZoned(date, timeZone).toDate().getTime();
  const map = (value: string) =>
    isReadable ? linear.map(readTimeInstant(value, timeZone)) : Number.NaN;
  const format = (value: string, unit: TimeScaleUnit) => {
    const instant = readTimeInstant(value, timeZone);
    if (!Number.isFinite(instant)) return '';
    let formatter = labels.get(unit);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat(locale, { timeZone, ...labelFormats[unit] });
      labels.set(unit, formatter);
    }
    return formatter.format(instant);
  };
  const ticks = (tickOptions: TimeTickOptions = {}) => {
    if (!isReadable) return [];
    const [low, high] = [Math.min(start, end), Math.max(start, end)];
    const lowDate = toCalendarDate(fromDate(new Date(low), timeZone));
    const highDate = toCalendarDate(fromDate(new Date(high), timeZone));
    const firstYear = lowDate.year + (instantOf(lowDate.set({ month: 1, day: 1 })) < low ? 1 : 0);
    const firstTick = (plan: TickPlan) => {
      if (plan.unit === 'year') {
        const year = Math.ceil(firstYear / plan.step) * plan.step;
        return year > lowDate.calendar.getYearsInEra(lowDate)
          ? undefined
          : lowDate.set({ year, month: 1, day: 1 });
      }
      const date = floorToUnit(lowDate, plan, locale);
      return instantOf(date) < low ? addUnit(date, plan, locale) : date;
    };
    const countTicks = (plan: TickPlan) => {
      if (plan.unit === 'year') {
        return Math.max(
          0,
          Math.floor(highDate.year / plan.step) - Math.ceil(firstYear / plan.step) + 1,
        );
      }
      const first = firstTick(plan);
      if (!first || instantOf(first) > high) return 0;
      if (plan.unit === 'day' || plan.unit === 'week') {
        const days = highDate.calendar.toJulianDay(highDate) - first.calendar.toJulianDay(first);
        return Math.floor(days / (plan.unit === 'week' ? 7 : 1)) + 1;
      }
      const months = (highDate.year - first.year) * 12 + highDate.month - first.month;
      return Math.floor(months / (plan.unit === 'quarter' ? 3 : 1)) + 1;
    };
    const plan = planTicks(tickOptions, countTicks);
    let date = firstTick(plan);
    const result: Array<ScaleTick<string>> = [];
    for (; date && instantOf(date) <= high; date = addUnit(date, plan, locale)) {
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
