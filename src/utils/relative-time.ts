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

export interface RelativeTimeOptions {
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

export interface RelativeTimeText {
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
const DAY = 24 * HOUR;

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

/** The step under a day that words an instant's distance from now, in milliseconds and as a unit. */
function timeStep(milliseconds: number): [number, Intl.RelativeTimeFormatUnit] {
  if (Math.abs(milliseconds) < MINUTE) return [SECOND, 'second'];
  if (Math.abs(milliseconds) < HOUR) return [MINUTE, 'minute'];
  return [HOUR, 'hour'];
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
 * or hours for an instant within a day, calendar days within `fallbackAfterDays`, and the absolute
 * date beyond. `null` when the value is not a date.
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
  if (parsed.instant && Math.abs(offset) < DAY) {
    const [step, unit] = timeStep(offset);
    const count = Math.round(offset / step);
    const pastDay = offset < 0 ? DAY + offset + 1 : Infinity;
    return {
      relative: formatter.format(count, unit),
      absolute,
      relation: relationOf(count),
      isRelative: true,
      nextChange: Math.min(untilNextStep(offset, step), pastDay),
    };
  }
  if (Math.abs(days) >= options.fallbackAfterDays) {
    const nextChange = days > 0 ? untilMidnight(now) : null;
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
    nextChange: untilMidnight(now),
  };
}
