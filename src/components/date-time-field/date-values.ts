// A date-time field's value model: ISO 8601 texts by mode, the field's bounds, unavailable dates and
// the localized text it shows for a value.

import {
  formatIsoDate,
  fromDate,
  getLocalTimeZone,
  parseIsoDate,
  parseIsoDateTime,
  parseIsoTime,
  toCalendarDate,
  toCalendarDateTime,
} from '../../primitives/index.js';
import { getDateFormatter, normalizeIntlSpaces } from '../../utils/intl-format.js';
import { findOrderedBoundIssue, type BoundIssue } from '../../utils/date-bounds.js';

/**
 * `date` (`YYYY-MM-DD`), `time` (`HH:mm`), `date-time` (`YYYY-MM-DDTHH:mm`, or zoned with
 * `timeZone`), or a `{ start, end }` range of dates (`date-range`) or of dates and times
 * (`date-time-range`).
 */
export type DateTimeFieldMode = 'date' | 'time' | 'date-time' | 'date-range' | 'date-time-range';

/** The smallest part of a time the segments edit. */
export type DateTimeFieldGranularity = 'hour' | 'minute' | 'second';

/** A complete range of ISO 8601 dates, or of dates and times in `date-time-range` mode. */
export interface DateRangeValue {
  start: string;
  end: string;
}

/** A date-time field's value with its mode erased. */
export type DateFieldValue = string | DateRangeValue | null;

/** A single value's mode. */
type SingleDateMode = 'date' | 'time' | 'date-time';

/** The settings that decide how a value's text reads and is written. */
export interface DateValueOptions {
  /** Edits dates and times in this IANA time zone, as zoned values, instead of floating ones. */
  timeZone?: string | undefined;
  /**
   * Without `timeZone`, the zone a floating value's wall clock is in: an offset or zoned text reads
   * as wall time there (the local time zone by default).
   */
  localZone?: string | undefined;
  granularity?: DateTimeFieldGranularity | undefined;
}

export interface DateBounds {
  minValue?: string | undefined;
  maxValue?: string | undefined;
}

/** The mode of each end of a range, or of a single value. */
export function toSingleMode(mode: DateTimeFieldMode): SingleDateMode {
  if (mode === 'date-range') return 'date';
  return mode === 'date-time-range' ? 'date-time' : mode;
}

/** A text as a moment on one scale per mode (milliseconds), or `null` when the mode cannot read it. */
function toMoment(text: string, mode: SingleDateMode, options: DateValueOptions): number | null {
  if (mode === 'time') {
    const time = parseIsoTime(text);
    return time ? ((time.hour * 60 + time.minute) * 60 + time.second) * 1000 : null;
  }
  if (mode === 'date') return parseIsoDate(text)?.toDate('UTC').getTime() ?? null;
  const value = parseIsoDateTime(text, options.timeZone, options.localZone);
  if (!value) return null;
  return ('timeZone' in value ? value.toDate() : value.toDate('UTC')).getTime();
}

/**
 * Whether the mode can read a value: a single text for a single mode, and a `{ start, end }` range
 * whose ends it can both read for a range mode. `null` (no value) is readable.
 */
export function isReadableValue(
  value: DateFieldValue,
  mode: DateTimeFieldMode,
  options: DateValueOptions = {},
): boolean {
  if (value === null) return true;
  const single = toSingleMode(mode);
  const isRange = single !== mode;
  if (typeof value === 'string') return !isRange && toMoment(value, single, options) !== null;
  return (
    isRange &&
    toMoment(value.start, single, options) !== null &&
    toMoment(value.end, single, options) !== null
  );
}

/** The clock a field reads at an event: the moment, and the zone its wall clock is read in. */
export interface DateClock {
  now: Date;
  /** The zone of a floating value's wall clock; a zoned field reads its own `timeZone`. */
  zone: string;
}

/**
 * The current date, or the current date and time to the granularity, as a value's text: zoned in
 * the field's `timeZone`, else the wall clock of `clock.zone` as a floating value.
 */
export function currentDateValue(
  mode: 'date' | 'date-time',
  options: DateValueOptions & DateClock,
): string {
  const moment = fromDate(options.now, options.timeZone ?? options.zone);
  if (mode === 'date') return toCalendarDate(moment).toString();
  return formatIsoDate(options.timeZone ? moment : toCalendarDateTime(moment), options.granularity);
}

/**
 * A single value's text as the field writes it: zoned in `timeZone`, without parts finer than the
 * granularity. A text the mode cannot read is kept as it is, for the field's check to refuse.
 */
function normalizeText(text: string, mode: SingleDateMode, options: DateValueOptions): string {
  const value =
    mode === 'date'
      ? parseIsoDate(text)
      : mode === 'time'
        ? parseIsoTime(text)
        : parseIsoDateTime(text, options.timeZone, options.localZone);
  return value ? formatIsoDate(value, options.granularity) : text;
}

/**
 * A value as the field writes it, each end of a range included, so a preset commits what a pick in
 * the editor would: `2026-04-20T03:42:33Z` in a Tokyo field at the hour granularity becomes
 * `2026-04-20T12:00:00+09:00[Asia/Tokyo]`.
 */
export function normalizeDateValue(
  value: DateFieldValue,
  mode: DateTimeFieldMode,
  options: DateValueOptions,
): DateFieldValue {
  if (!value) return value;
  const single = toSingleMode(mode);
  if (typeof value === 'string') return normalizeText(value, single, options);
  return {
    start: normalizeText(value.start, single, options),
    end: normalizeText(value.end, single, options),
  };
}

/** Which bound a value breaks, with that bound's value; a range's end may not precede its start. */
export function findBoundIssue(
  value: DateFieldValue,
  mode: DateTimeFieldMode,
  { minValue, maxValue, ...options }: DateBounds & DateValueOptions,
): BoundIssue | null {
  if (!value) return null;
  const single = toSingleMode(mode);
  // Texts the mode cannot read compare as equal, so they break no bound.
  const compare = (left: string, right: string) => {
    const before = toMoment(left, single, options);
    const after = toMoment(right, single, options);
    return before === null || after === null ? 0 : before - after;
  };
  return findOrderedBoundIssue(value, compare, { minValue, maxValue });
}

/** The `YYYY-MM-DD` date a date or date-and-time text falls on, or `null`. */
function toCalendarDay(
  text: string,
  mode: 'date' | 'date-time',
  options: DateValueOptions = {},
): string | null {
  if (mode === 'date') return parseIsoDate(text)?.toString() ?? null;
  const value = parseIsoDateTime(text, options.timeZone, options.localZone);
  return value ? toCalendarDate(value).toString() : null;
}

/** Whether a value, or any calendar day in its inclusive range, falls on a date `isDateUnavailable` refuses. */
export function isUnavailableValue(
  value: DateFieldValue,
  mode: DateTimeFieldMode,
  options: DateValueOptions & { isDateUnavailable?: ((date: string) => boolean) | undefined },
): boolean {
  const { isDateUnavailable } = options;
  const single = toSingleMode(mode);
  if (!value || !isDateUnavailable || single === 'time') return false;
  const ends = typeof value === 'string' ? [value] : [value.start, value.end];
  const days = ends.map((end) => toCalendarDay(end, single, options));
  if (days.some((day) => day !== null && isDateUnavailable(day))) return true;
  const start = parseIsoDate(days[0]);
  const end = parseIsoDate(days[1]);
  if (!start || !end) return false;
  for (let day = start.add({ days: 1 }); day.compare(end) < 0; day = day.add({ days: 1 })) {
    if (isDateUnavailable(day.toString())) return true;
  }
  return false;
}

function toDate(text: string, mode: SingleDateMode, options: DateValueOptions): Date | null {
  const localZone = options.localZone ?? getLocalTimeZone();
  if (mode === 'date') return parseIsoDate(text)?.toDate(localZone) ?? null;
  if (mode === 'date-time') {
    const value = parseIsoDateTime(text, options.timeZone, localZone);
    if (!value) return null;
    return 'timeZone' in value ? value.toDate() : value.toDate(localZone);
  }
  const time = parseIsoTime(text);
  return time ? new Date(2000, 0, 1, time.hour, time.minute, time.second) : null;
}

/** How `formatDateValue` writes a value: the editor's locale, precision and hour cycle. */
interface FormatDateOptions extends DateValueOptions {
  locale: string;
  /** Writes times on a 12- or 24-hour clock instead of the locale's. */
  hourCycle?: 12 | 24 | undefined;
}

function formatOptions(
  mode: SingleDateMode,
  options: FormatDateOptions,
): Intl.DateTimeFormatOptions {
  if (mode === 'date') return { dateStyle: 'medium', timeZone: options.localZone };
  const timeStyle = options.granularity === 'second' ? 'medium' : 'short';
  const clock = options.hourCycle === undefined ? {} : { hour12: options.hourCycle === 12 };
  if (mode === 'time') return { timeStyle, ...clock };
  const timeZone = options.timeZone ?? options.localZone;
  return { dateStyle: 'medium', timeStyle, timeZone, ...clock };
}

/**
 * A value as localized text: a date, a time, both, or a range, at the editor's granularity and
 * hour cycle. Unreadable text is kept.
 */
export function formatDateValue(
  value: Exclude<DateFieldValue, null>,
  mode: DateTimeFieldMode,
  options: FormatDateOptions,
): string {
  const single = toSingleMode(mode);
  const formatter = getDateFormatter(options.locale, formatOptions(single, options));
  if (typeof value !== 'string') {
    const start = toDate(value.start, single, options);
    const end = toDate(value.end, single, options);
    if (!start || !end) return `${value.start} – ${value.end}`;
    return normalizeIntlSpaces(formatter.formatRange(start, end));
  }
  const date = toDate(value, single, options);
  return date ? normalizeIntlSpaces(formatter.format(date)) : value;
}
