// Relative time text (`yesterday`, `in 3 days`, `5 minutes ago`) for ISO 8601 dates and date-times,
// formatted through Intl for the reader's locale. Relative Time and Relative Date Field share it.

import {
  DateFormatter,
  fromDate,
  getLocalTimeZone,
  parseIsoDate,
  parseIsoDateTime,
  toCalendarDate,
  type CalendarDate,
} from '../primitives/index.js';

/** Whether a value lies before, at or after now. */
export type RelativeTimeRelation = 'past' | 'present' | 'future';

/**
 * How finely an instant within a minute reads: `minute` says `Now` for the first minute and then
 * counts whole elapsed minutes, `second` counts seconds live.
 */
export type RelativeTimePrecision = 'minute' | 'second';

/** An `Intl.RelativeTimeFormat` style: `5 minutes ago`, `5 min. ago` or `5m ago` in English. */
export type RelativeTimeUnitStyle = 'long' | 'short' | 'narrow';

/** An `Intl.DateTimeFormat` date or time style. */
export type RelativeTimeStyle = 'full' | 'long' | 'medium' | 'short';

interface RelativeTimeOptions {
  /** The moment the value is read against. */
  now: Date;
  locale: string;
  /** Values this many calendar days away or more read as the absolute date. */
  fallbackAfterDays: number;
  /** How finely an instant within a minute reads. Defaults to `minute`. */
  precision?: RelativeTimePrecision | undefined;
  /** How the relative words spell their units. Defaults to `long`. */
  unitStyle?: RelativeTimeUnitStyle | undefined;
  /** The absolute date's style. Defaults to `medium`. */
  dateStyle?: RelativeTimeStyle | undefined;
  /** The absolute time's style, for a date and time. Defaults to `short`. */
  timeStyle?: RelativeTimeStyle | undefined;
}

interface RelativeTimeText {
  /**
   * The value relative to now as Intl words it mid-sentence (`yesterday`, `in 2 hours`), or the
   * absolute text once the value is `fallbackAfterDays` away.
   */
  relative: string;
  /** The value as a localized date, or date and time. */
  absolute: string;
  relation: RelativeTimeRelation;
  /** Whether `relative` reads relative; false once it falls back to the absolute text. */
  isRelative: boolean;
  /** Milliseconds until `relative` may read differently, or `null` when it never will. */
  nextChange: number | null;
}

interface ParsedValue {
  date: CalendarDate;
  /** The moment a date and time stands for; `null` for a date. */
  instant: Date | null;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

/** A date, or a date and time read as local wall time (an offset or zone converts to it). */
function parseValue(value: string): ParsedValue | null {
  const date = parseIsoDate(value);
  if (date) return { date, instant: null };
  const dateTime = parseIsoDateTime(value);
  if (!dateTime) return null;
  return { date: toCalendarDate(dateTime), instant: dateTime.toDate(getLocalTimeZone()) };
}

/** The local calendar day of a moment. */
function toDay(moment: Date): CalendarDate {
  return toCalendarDate(fromDate(moment, getLocalTimeZone()));
}

/**
 * A unit under a day: its length, the distance from now under which it words an instant, and
 * whether its count rounds or truncates to whole elapsed units.
 */
type TimeUnit = [step: number, unit: Intl.RelativeTimeFormatUnit, ceiling: number, whole: boolean];

/** Rounded counts that never read 60 seconds, 60 minutes or 24 hours. */
const secondUnits: readonly TimeUnit[] = [
  [SECOND, 'second', 59.5 * SECOND, false],
  [MINUTE, 'minute', 59.5 * MINUTE, false],
  [HOUR, 'hour', 23.5 * HOUR, false],
];

/** Whole elapsed minutes, where a count of 0 reads `Now`, then rounded hours. */
const minuteUnits: readonly TimeUnit[] = [
  [MINUTE, 'minute', HOUR, true],
  [HOUR, 'hour', 23.5 * HOUR, false],
];

/** Distance from now at which an instant's rounded hours reach a day, so it reads in days. */
const dayDistance = (24 - 0.5) * HOUR;

interface TimeStep {
  step: number;
  unit: Intl.RelativeTimeFormatUnit;
  whole: boolean;
  /** The smallest distance from now that still reads in this unit. */
  floor: number;
}

/** The unit that words an instant `offset` milliseconds from now; `null` once it reads in days. */
function timeStep(offset: number, precision: RelativeTimePrecision): TimeStep | null {
  let floor = 0;
  for (const [step, unit, ceiling, whole] of precision === 'second' ? secondUnits : minuteUnits) {
    if (Math.abs(offset) < ceiling) return { step, unit, whole, floor };
    floor = ceiling;
  }
  return null;
}

function relationOf(distance: number): RelativeTimeRelation {
  if (distance === 0) return 'present';
  return distance > 0 ? 'future' : 'past';
}

/** Milliseconds from `now` to the next local midnight, when day counts move on. */
function untilMidnight(now: Date): number {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return midnight.getTime() - now.getTime();
}

/**
 * Milliseconds until the rounded count of `step`s in `offset` (value minus now, which shrinks as
 * time passes) changes, just past the half-step where rounding flips.
 */
function untilNextStep(offset: number, step: number): number {
  const boundary = (Math.round(offset / step) - 0.5) * step;
  return Math.max(offset - boundary, 0) + 1;
}

/**
 * Milliseconds until the whole count of `step`s in `offset` changes: a future count drops just
 * below its multiple, a past count grows at the next one.
 */
function untilNextWholeStep(offset: number, step: number): number {
  const count = Math.trunc(offset / step);
  if (count > 0) return offset - count * step + 1;
  return offset - (count - 1) * step;
}

/**
 * Words an instant `offset` milliseconds from now within a day, with when the words change; `null`
 * once it reads in days.
 */
function describeInstant(
  offset: number,
  formatter: Intl.RelativeTimeFormat,
  precision: RelativeTimePrecision = 'minute',
): Pick<RelativeTimeText, 'relative' | 'relation' | 'nextChange'> | null {
  const time = timeStep(offset, precision);
  if (!time) return null;
  const count = time.whole ? Math.trunc(offset / time.step) : Math.round(offset / time.step);
  const untilStep = time.whole ? untilNextWholeStep : untilNextStep;
  // A future instant moves down to the smaller unit once it comes nearer than this unit's floor.
  const nearer = offset > 0 && time.floor > 0 ? offset - time.floor + 1 : Infinity;
  return {
    // Intl words a count of 0 minutes `this minute`; within the first minute it reads `now`.
    relative: count === 0 ? formatter.format(0, 'second') : formatter.format(count, time.unit),
    relation: relationOf(count),
    nextChange: Math.min(untilStep(offset, time.step), nearer),
  };
}

/** Upper-cases the first letter, for relative text that starts a label or a sentence. */
export function capitalizeText(text: string, locale: string): string {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/**
 * Describes an ISO 8601 date (`YYYY-MM-DD`) or date and time relative to `now`: an instant within a
 * day in `Now`, whole minutes and rounded hours, or with `precision: 'second'` in rounded seconds,
 * minutes and hours (59.7 seconds reads `1 minute`; 23.6 hours reads in days), calendar days within `fallbackAfterDays`, and the absolute date beyond.
 * `null` when the value is not a date.
 */
export function describeRelativeTime(
  value: string,
  options: RelativeTimeOptions,
): RelativeTimeText | null {
  const parsed = parseValue(value);
  if (!parsed) return null;
  const { locale, now } = options;
  const days = parsed.date.compare(toDay(now));
  const formatter = new Intl.RelativeTimeFormat(locale, {
    numeric: 'auto',
    style: options.unitStyle ?? 'long',
  });
  const absolute = new DateFormatter(locale, {
    dateStyle: options.dateStyle ?? 'medium',
    timeStyle: parsed.instant ? (options.timeStyle ?? 'short') : undefined,
  }).format(parsed.instant ?? parsed.date.toDate(getLocalTimeZone()));
  const offset = parsed.instant ? parsed.instant.getTime() - now.getTime() : 0;
  const time = parsed.instant ? describeInstant(offset, formatter, options.precision) : null;
  if (time) return { ...time, absolute, isRelative: true };
  // A future instant read in days starts reading in hours once it is nearer than a day.
  const untilHours = parsed.instant && offset > 0 ? offset - dayDistance + 1 : Infinity;
  if (Math.abs(days) >= options.fallbackAfterDays) {
    const nextChange = days > 0 ? Math.min(untilMidnight(now), untilHours) : null;
    return {
      relative: absolute,
      absolute,
      relation: relationOf(days),
      isRelative: false,
      nextChange,
    };
  }
  return {
    relative: formatter.format(days, 'day'),
    absolute,
    relation: relationOf(days),
    isRelative: true,
    nextChange: Math.min(untilMidnight(now), untilHours),
  };
}
