// Time scales: ISO 8601 dates to positions, with calendar ticks and their labels (specs/SCALES.md).

import {
  type CalendarDate,
  fromDate,
  getLocalTimeZone,
  parseIsoDate,
  startOfWeek,
  toCalendarDate,
  toZoned,
} from '../primitives/index.js';
import { getDateTimeFormat } from './intl-format.js';
import { createLinearScale, type ScaleInterval, type ScaleTick } from './linear-scale.js';
import { readTimeInstant } from './read-time-instant.js';

/** The calendar unit between a time scale's ticks. */
export type TimeScaleUnit = 'day' | 'week' | 'month' | 'quarter' | 'year';

/** The unit between ticks: a calendar unit, or hours and minutes for a domain shorter than days. */
export type TimeTickUnit = TimeScaleUnit | 'hour' | 'minute';

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
  unit?: TimeTickUnit | undefined;
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
  /**
   * The starts of calendar units inside the domain, as `YYYY-MM-DD` dates in increasing order, or
   * for hours and minutes the instants as ISO 8601 date-times in UTC.
   */
  ticks(options?: TimeTickOptions): Array<ScaleTick<string>>;
  /** An ISO 8601 date or date-time as the label of a tick of `unit`. */
  format(value: string, unit: TimeTickUnit): string;
}

/** How ticks step: one unit at a time, or several years for long domains. */
interface TickPlan {
  unit: TimeScaleUnit;
  step: number;
}

const defaultTimeTickCount = 8;
const units: readonly TimeScaleUnit[] = ['day', 'week', 'month', 'quarter', 'year'];
const labelFormats: Readonly<Record<TimeTickUnit, Intl.DateTimeFormatOptions>> = {
  minute: { hour: 'numeric', minute: '2-digit' },
  hour: { hour: 'numeric', minute: '2-digit' },
  day: { month: 'short', day: 'numeric' },
  week: { month: 'short', day: 'numeric' },
  month: { month: 'short', year: 'numeric' },
  quarter: { month: 'short', year: 'numeric' },
  year: { year: 'numeric' },
};

/** A sub-day tick step: a unit and how many of it. */
interface ClockPlan {
  unit: 'hour' | 'minute';
  step: number;
}

/** The first and last instants of a domain, in epoch milliseconds. */
type TimeSpan = readonly [low: number, high: number];

/** The sub-day steps a domain shorter than a few days may tick at, smallest first. */
const clockPlans: readonly ClockPlan[] = [
  ...[1, 5, 15, 30].map((step) => ({ unit: 'minute' as const, step })),
  ...[1, 2, 3, 6, 12].map((step) => ({ unit: 'hour' as const, step })),
];

const clockUnitMs = { minute: 60_000, hour: 3_600_000 } as const;

/**
 * The instants of a sub-day plan inside `[low, high]`: whole multiples of the step on the clock of
 * `timeZone` (every 15 minutes from the hour, every 6 hours from midnight), as epoch milliseconds.
 */
function listClockTicks([low, high]: TimeSpan, plan: ClockPlan, timeZone: string): number[] {
  const unitMs = clockUnitMs[plan.unit];
  const start = fromDate(new Date(low), timeZone);
  const floored =
    plan.unit === 'minute'
      ? start.set({
          minute: Math.floor(start.minute / plan.step) * plan.step,
          second: 0,
          millisecond: 0,
        })
      : start.set({
          hour: Math.floor(start.hour / plan.step) * plan.step,
          minute: 0,
          second: 0,
          millisecond: 0,
        });
  const first = floored.toDate().getTime();
  const result: number[] = [];
  for (
    let at = first < low ? first + plan.step * unitMs : first;
    at <= high;
    at += plan.step * unitMs
  )
    result.push(at);
  return result;
}

/** The sub-day plan a domain of date-times takes, when days alone tick it too sparsely. */
function planClockTicks(
  { unit, count }: TimeTickOptions,
  countTicks: (plan: ClockPlan) => number,
): ClockPlan | undefined {
  if (unit === 'hour' || unit === 'minute') return { unit, step: 1 };
  if (unit) return undefined;
  const wanted = typeof count === 'number' && Number.isFinite(count) ? count : defaultTimeTickCount;
  const most = Math.max(1, Math.round(wanted));
  return clockPlans.find((plan) => countTicks(plan) <= most);
}

/**
 * The clock ticks of a domain: when the caller asks for hours or minutes, or when the domain holds
 * date-times that days would tick fewer than three times; otherwise `undefined`.
 */
function findClockTicks(
  span: TimeSpan,
  options: TimeTickOptions & { hasClock: boolean; countDays: () => number },
  timeZone: string,
): { unit: ClockPlan['unit']; instants: number[] } | undefined {
  const { unit, hasClock, countDays } = options;
  const needsClock =
    unit === 'hour' || unit === 'minute' || (unit === undefined && hasClock && countDays() < 3);
  const countTicks = (plan: ClockPlan) => listClockTicks(span, plan, timeZone).length;
  const plan = needsClock ? planClockTicks(options, countTicks) : undefined;
  return plan && { unit: plan.unit, instants: listClockTicks(span, plan, timeZone) };
}

function planTicks(
  { unit, count }: { unit?: TimeScaleUnit | undefined; count?: number | undefined },
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
  const weekLocale = locale ?? getDateTimeFormat(undefined).resolvedOptions().locale;
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
  const locale = options.locale ?? getDateTimeFormat(undefined).resolvedOptions().locale;
  const start = readTimeInstant(options.domain[0], timeZone);
  const end = readTimeInstant(options.domain[1], timeZone);
  const isReadable = Number.isFinite(start) && Number.isFinite(end);
  const linear = createLinearScale({ domain: [start, end], range: options.range });
  const instantOf = (date: CalendarDate) => toZoned(date, timeZone).toDate().getTime();
  const map = (value: string) =>
    isReadable ? linear.map(readTimeInstant(value, timeZone)) : Number.NaN;
  const hasClock = options.domain.some((text) => text.includes('T'));
  const format = (value: string, unit: TimeTickUnit) => {
    const instant = readTimeInstant(value, timeZone);
    if (!Number.isFinite(instant)) return '';
    return getDateTimeFormat(locale, { timeZone, ...labelFormats[unit] }).format(instant);
  };
  const toTick = (value: string, unit: TimeTickUnit) => ({
    value,
    position: map(value),
    label: format(value, unit),
  });
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
    const countDays = () => countTicks({ unit: 'day', step: 1 });
    const clock = findClockTicks([low, high], { ...tickOptions, hasClock, countDays }, timeZone);
    if (clock) return clock.instants.map((at) => toTick(new Date(at).toISOString(), clock.unit));
    const plan = planTicks(
      { unit: tickOptions.unit as TimeScaleUnit | undefined, count: tickOptions.count },
      countTicks,
    );
    let date = firstTick(plan);
    const result: Array<ScaleTick<string>> = [];
    for (; date && instantOf(date) <= high; date = addUnit(date, plan, locale)) {
      result.push(toTick(date.toString(), plan.unit));
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
