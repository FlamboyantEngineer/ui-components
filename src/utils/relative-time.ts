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

/** An `Intl.DateTimeFormat` date or time style. */
export type RelativeTimeStyle = 'full' | 'long' | 'medium' | 'short';

interface RelativeTimeOptions {
  /** The moment the value is read against. */
  now: Date;
  locale: string;
  /** Values this many calendar days away or more read as the absolute date. */
  fallbackAfterDays: number;
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

/** A unit under a day, and how many of it round up to the next unit. */
const timeUnits: ReadonlyArray<[number, Intl.RelativeTimeFormatUnit, number]> = [
  [SECOND, 'second', 60],
  [MINUTE, 'minute', 60],
  [HOUR, 'hour', 24],
];

/** Distance from now at which an instant's rounded hours reach a day, so it reads in days. */
const dayDistance = (24 - 0.5) * HOUR;

interface TimeStep {
  step: number;
  unit: Intl.RelativeTimeFormatUnit;
  /** The smallest distance from now that still reads in this unit. */
  floor: number;
}

/**
 * The unit that words an instant `offset` milliseconds from now, chosen by its rounded count so a
 * count never reads 60 seconds, 60 minutes or 24 hours; `null` once the instant reads in days.
 */
function timeStep(offset: number): TimeStep | null {
  let floor = 0;
  for (const [step, unit, limit] of timeUnits) {
    const ceiling = (limit - 0.5) * step;
    if (Math.abs(offset) < ceiling) return { step, unit, floor };
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

/** Upper-cases the first letter, for relative text that starts a label or a sentence. */
export function capitalizeText(text: string, locale: string): string {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/**
 * Describes an ISO 8601 date (`YYYY-MM-DD`) or date and time relative to `now`: seconds, minutes
 * or hours for an instant within a day, by its rounded count (59.7 seconds reads `1 minute`, 23.6
 * hours reads in days), calendar days within `fallbackAfterDays`, and the absolute date beyond.
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
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const absolute = new DateFormatter(locale, {
    dateStyle: options.dateStyle ?? 'medium',
    timeStyle: parsed.instant ? (options.timeStyle ?? 'short') : undefined,
  }).format(parsed.instant ?? parsed.date.toDate(getLocalTimeZone()));
  const offset = parsed.instant ? parsed.instant.getTime() - now.getTime() : 0;
  const time = parsed.instant ? timeStep(offset) : null;
  if (time) {
    const count = Math.round(offset / time.step);
    // A future instant moves down to the smaller unit once it comes nearer than this unit's floor.
    const nearer = offset > 0 && time.floor > 0 ? offset - time.floor + 1 : Infinity;
    return {
      relative: formatter.format(count, time.unit),
      absolute,
      relation: relationOf(count),
      isRelative: true,
      nextChange: Math.min(untilNextStep(offset, time.step), nearer),
    };
  }
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
