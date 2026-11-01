// Relative time text (`yesterday`, `in 3 days`, `5 minutes ago`) for ISO 8601 dates and date-times,
// formatted through Intl for the reader's locale. Relative Time and Relative Date Field share it.

import {
  fromDate,
  parseIsoDate,
  parseIsoDateTime,
  toCalendarDate,
  type CalendarDate,
} from '../primitives/index.js';
import { getDateFormatter, getRelativeTimeFormat } from './intl-format.js';

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

/** The absolute text's styles and zone. */
interface AbsoluteTimeStyles {
  /** The IANA time zone days and times are read in: the reader's, from `useTimeZone`. */
  timeZone: string;
  /** The absolute date's style. Defaults to `medium`. */
  dateStyle?: RelativeTimeStyle | undefined;
  /** The absolute time's style, for a date and time. Defaults to `short`. */
  timeStyle?: RelativeTimeStyle | undefined;
}

interface RelativeTimeOptions extends AbsoluteTimeStyles {
  /** The moment the value is read against. */
  now: Date;
  locale: string;
  /** Values this many calendar days away or more read as the absolute date. */
  fallbackAfterDays: number;
  /** How finely an instant within a minute reads. Defaults to `minute`. */
  precision?: RelativeTimePrecision | undefined;
  /** How the relative words spell their units. Defaults to `long`. */
  unitStyle?: RelativeTimeUnitStyle | undefined;
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

const secondMs = 1000;
const minuteMs = 60 * secondMs;
const hourMs = 60 * minuteMs;

/**
 * A date, or a date and time with its instant and the local calendar date of that instant. A value
 * with an offset or a zone keeps its exact instant, also in an hour that daylight saving time
 * repeats; a value without either is local wall time.
 */
function parseValue(value: string, zone: string): ParsedValue | null {
  const date = parseIsoDate(value);
  if (date) return { date, instant: null };
  const dateTime = parseIsoDateTime(value, zone);
  if (!dateTime) return null;
  // Zoned in `zone`, so the instant is exact; `toDate` reads `zone` only for a floating value.
  return { date: toCalendarDate(dateTime), instant: dateTime.toDate(zone) };
}

/** The calendar day of a moment in `zone`. */
function toDay(moment: Date, zone: string): CalendarDate {
  return toCalendarDate(fromDate(moment, zone));
}

/**
 * A unit under a day: its length, the distance from now under which it words an instant, and
 * whether its count rounds or truncates to whole elapsed units.
 */
type TimeUnit = [step: number, unit: Intl.RelativeTimeFormatUnit, ceiling: number, whole: boolean];

/** Rounded counts that never read 60 seconds, 60 minutes or 24 hours. */
const secondUnits: readonly TimeUnit[] = [
  [secondMs, 'second', 59.5 * secondMs, false],
  [minuteMs, 'minute', 59.5 * minuteMs, false],
  [hourMs, 'hour', 23.5 * hourMs, false],
];

/** Whole elapsed minutes, where a count of 0 reads `Now`, then rounded hours. */
const minuteUnits: readonly TimeUnit[] = [
  [minuteMs, 'minute', hourMs, true],
  [hourMs, 'hour', 23.5 * hourMs, false],
];

/** Distance from now at which an instant's rounded hours reach a day, so it reads in days. */
const dayDistance = (24 - 0.5) * hourMs;

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

/** Milliseconds from `now` to the next midnight in `zone`, when day counts move on. */
export function untilMidnight(now: Date, zone: string): number {
  return toDay(now, zone).add({ days: 1 }).toDate(zone).getTime() - now.getTime();
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

/** The value's absolute text, given its parsed date and instant. */
function formatAbsolute(
  parsed: ParsedValue,
  locale: string,
  { dateStyle = 'medium', timeStyle = 'short', timeZone }: AbsoluteTimeStyles,
): string {
  return getDateFormatter(locale, {
    dateStyle,
    timeStyle: parsed.instant ? timeStyle : undefined,
    timeZone,
  }).format(parsed.instant ?? parsed.date.toDate(timeZone));
}

/**
 * An ISO 8601 date (`YYYY-MM-DD`) or date and time as a localized date, or date and time; `null`
 * when the value is not a date.
 */
export function formatAbsoluteTime(
  value: string,
  locale: string,
  styles: AbsoluteTimeStyles,
): string | null {
  const parsed = parseValue(value, styles.timeZone);
  return parsed ? formatAbsolute(parsed, locale, styles) : null;
}

/** A date and time text that names its zone or offset, so it stands for one instant everywhere. */
const zoneDesignator = /(?:Z|[+-]\d{2}(?::?\d{2})?|\])$/i;

/**
 * The value's absolute text independent of the clock and the time zone, as a server and a client
 * hydrating its markup both render it: a date as itself, a date and time without an offset as its
 * wall time, and an instant in UTC with the zone named (a `long` time at least). `null` when the
 * value is not a date.
 */
export function formatStableTime(
  value: string,
  locale: string,
  { dateStyle = 'medium', timeStyle = 'short' }: Omit<AbsoluteTimeStyles, 'timeZone'> = {},
): string | null {
  const date = parseIsoDate(value);
  if (date)
    return getDateFormatter(locale, { dateStyle, timeZone: 'UTC' }).format(date.toDate('UTC'));
  const dateTime = parseIsoDateTime(value, 'UTC');
  if (!dateTime) return null;
  const isInstant = zoneDesignator.test(value);
  const style = isInstant && (timeStyle === 'short' || timeStyle === 'medium') ? 'long' : timeStyle;
  return getDateFormatter(locale, { dateStyle, timeStyle: style, timeZone: 'UTC' }).format(
    dateTime.toDate('UTC'),
  );
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
  const zone = options.timeZone;
  const parsed = parseValue(value, zone);
  if (!parsed) return null;
  const { locale, now } = options;
  const days = parsed.date.compare(toDay(now, zone));
  const formatter = getRelativeTimeFormat(locale, { numeric: 'auto', style: options.unitStyle });
  const absolute = formatAbsolute(parsed, locale, options);
  const offset = parsed.instant ? parsed.instant.getTime() - now.getTime() : 0;
  const time = parsed.instant ? describeInstant(offset, formatter, options.precision) : null;
  if (time) return { ...time, absolute, isRelative: true };
  // A future instant read in days starts reading in hours once it is nearer than a day.
  const untilHours = parsed.instant && offset > 0 ? offset - dayDistance + 1 : Infinity;
  if (Math.abs(days) >= options.fallbackAfterDays) {
    const nextChange = days > 0 ? Math.min(untilMidnight(now, zone), untilHours) : null;
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
    nextChange: Math.min(untilMidnight(now, zone), untilHours),
  };
}
