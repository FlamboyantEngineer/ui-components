// A date-time field's value model: canonical text values, the React Aria values they edit as, the
// field's bounds and the text it shows for a value.

import {
  CalendarDateTime,
  DateFormatter,
  getLocalTimeZone,
  now,
  parseAbsolute,
  parseAbsoluteToLocal,
  parseDate,
  parseTime,
  toCalendarDateTime,
  today,
  type CalendarDate,
  type DateValue,
  type Time,
  type ZonedDateTime,
} from '@internationalized/date';

/**
 * `date` (`YYYY-MM-DD`), `time` (`HH:mm`), `date-time` (a UTC ISO instant), or a `{ start, end }`
 * range of dates (`date-range`) or of instants (`date-time-range`).
 */
export type DateTimeFieldMode = 'date' | 'time' | 'date-time' | 'date-range' | 'date-time-range';

/** The smallest part of a time the segments edit. */
export type DateTimeFieldGranularity = 'hour' | 'minute' | 'second';

/** A complete range of `YYYY-MM-DD` dates, or of UTC ISO instants in `date-time-range` mode. */
export interface DateRangeValue {
  start: string;
  end: string;
}

/** A date-time field's value with its mode erased. */
export type DateFieldValue = string | DateRangeValue | null;

/** A single value's mode. */
export type SingleDateMode = 'date' | 'time' | 'date-time';

/** The settings that decide how a canonical value reads as a React Aria value. */
export interface DateValueOptions {
  /** Edits instants in this IANA time zone instead of the local one. */
  timeZone?: string | undefined;
  granularity?: DateTimeFieldGranularity | undefined;
}

/** A date or a date and time, as a calendar shows it. */
export type CalendarValue = CalendarDate | CalendarDateTime | ZonedDateTime;

function attempt<T>(parse: () => T): T | null {
  try {
    return parse();
  } catch {
    return null;
  }
}

const pad = (part: number) => String(part).padStart(2, '0');

/** The mode of each end of a range, or of a single value. */
export function toSingleMode(mode: DateTimeFieldMode): SingleDateMode {
  if (mode === 'date-range') return 'date';
  return mode === 'date-time-range' ? 'date-time' : mode;
}

export function isRangeMode(mode: DateTimeFieldMode): boolean {
  return mode === 'date-range' || mode === 'date-time-range';
}

/** A `YYYY-MM-DD` text as a calendar date, or `null` when it is not one. */
export function toCalendarDateValue(text: string | null | undefined): CalendarDate | null {
  return text ? attempt(() => parseDate(text)) : null;
}

/** An `HH:mm` (or `HH:mm:ss`) text as a time of day, or `null` when it is not one. */
export function toTimeValue(text: string | null | undefined): Time | null {
  return text ? attempt(() => parseTime(text)) : null;
}

/**
 * A UTC ISO instant as the wall time it edits as: local, or in `timeZone` (with its zone) when given.
 * `null` when it is not an instant.
 */
export function toDateTimeValue(
  text: string | null | undefined,
  timeZone?: string,
): CalendarDateTime | ZonedDateTime | null {
  if (!text) return null;
  if (timeZone) return attempt(() => parseAbsolute(text, timeZone));
  return attempt(() => toCalendarDateTime(parseAbsoluteToLocal(text)));
}

/** A single value's text as the React Aria value its mode edits. */
export function toPickerValue(
  text: string | null | undefined,
  mode: SingleDateMode,
  options: DateValueOptions = {},
): CalendarValue | Time | null {
  if (mode === 'time') return toTimeValue(text);
  return mode === 'date' ? toCalendarDateValue(text) : toDateTimeValue(text, options.timeZone);
}

/** A range value as calendar values, or `null` unless both ends read in the range's mode. */
export function toRangeValue(
  value: DateRangeValue | null | undefined,
  mode: DateTimeFieldMode = 'date-range',
  options: DateValueOptions = {},
): { start: CalendarValue; end: CalendarValue } | null {
  const single = toSingleMode(mode);
  const start = toPickerValue(value?.start, single, options) as CalendarValue | null;
  const end = toPickerValue(value?.end, single, options) as CalendarValue | null;
  return start && end ? { start, end } : null;
}

export function fromTimeValue(
  time: Time,
  granularity: DateTimeFieldGranularity = 'minute',
): string {
  const text = `${pad(time.hour)}:${pad(time.minute)}`;
  return granularity === 'second' ? `${text}:${pad(time.second)}` : text;
}

/** A wall time, local or zoned, as the UTC ISO instant it stands for. */
export function fromDateTimeValue(value: CalendarDateTime | ZonedDateTime): string {
  if (value instanceof CalendarDateTime) return value.toDate(getLocalTimeZone()).toISOString();
  return value.toDate().toISOString();
}

/** A React Aria value as the canonical text of its mode. */
export function fromPickerValue(
  value: DateValue | Time,
  mode: SingleDateMode,
  options: DateValueOptions = {},
): string {
  if (mode === 'time') return fromTimeValue(value as Time, options.granularity);
  if (mode === 'date') return (value as CalendarDate).toString();
  return fromDateTimeValue(value as CalendarDateTime | ZonedDateTime);
}

/** The current date, or the current date and time to the granularity, as a canonical value. */
export function currentDateValue(
  mode: 'date' | 'date-time',
  options: DateValueOptions = {},
): string {
  const zone = options.timeZone ?? getLocalTimeZone();
  if (mode === 'date') return today(zone).toString();
  const moment = now(zone).set({ millisecond: 0 });
  return moment
    .set(options.granularity === 'second' ? {} : { second: 0 })
    .toDate()
    .toISOString();
}

function compareSingle(left: string, right: string, mode: SingleDateMode): number {
  if (mode === 'date-time') return Date.parse(left) - Date.parse(right);
  return left < right ? -1 : Number(left > right);
}

export interface DateBounds {
  minValue?: string | undefined;
  maxValue?: string | undefined;
}

/** Which bound a value breaks, with that bound's value; a range's end may not precede its start. */
export function findBoundIssue(
  value: DateFieldValue,
  mode: DateTimeFieldMode,
  { minValue, maxValue }: DateBounds,
): { bound: 'min' | 'max'; limit: string } | null {
  if (!value) return null;
  const singleMode = toSingleMode(mode);
  const [first, last] = typeof value === 'string' ? [value, value] : [value.start, value.end];
  if (minValue && compareSingle(first, minValue, singleMode) < 0) {
    return { bound: 'min', limit: minValue };
  }
  if (maxValue && compareSingle(last, maxValue, singleMode) > 0) {
    return { bound: 'max', limit: maxValue };
  }
  return compareSingle(last, first, singleMode) < 0 ? { bound: 'min', limit: first } : null;
}

/** Whether a value, or either end of a range, falls on a date `isDateUnavailable` refuses. */
export function isUnavailableValue(
  value: DateFieldValue,
  mode: DateTimeFieldMode,
  options: DateValueOptions & { isDateUnavailable?: ((date: DateValue) => boolean) | undefined },
): boolean {
  const { isDateUnavailable } = options;
  const singleMode = toSingleMode(mode);
  if (!value || !isDateUnavailable || singleMode === 'time') return false;
  const ends = typeof value === 'string' ? [value] : [value.start, value.end];
  return ends.some((end) => {
    const date = toPickerValue(end, singleMode, options) as CalendarValue | null;
    return date !== null && isDateUnavailable(date);
  });
}

function toDate(text: string, mode: SingleDateMode): Date | null {
  if (mode === 'date-time') return attempt(() => parseAbsoluteToLocal(text).toDate());
  if (mode === 'date') return toCalendarDateValue(text)?.toDate(getLocalTimeZone()) ?? null;
  const time = toTimeValue(text);
  return time ? new Date(2000, 0, 1, time.hour, time.minute, time.second) : null;
}

function formatOptions(
  mode: SingleDateMode,
  options: DateValueOptions,
): Intl.DateTimeFormatOptions {
  const timeStyle = options.granularity === 'second' ? 'medium' : 'short';
  if (mode === 'date') return { dateStyle: 'medium' };
  if (mode === 'time') return { timeStyle };
  return { dateStyle: 'medium', timeStyle, timeZone: options.timeZone };
}

/** A value as localized text: a date, a time, both, or a range. Unreadable text is kept. */
export function formatDateValue(
  value: Exclude<DateFieldValue, null>,
  mode: DateTimeFieldMode,
  options: DateValueOptions & { locale: string },
): string {
  const singleMode = toSingleMode(mode);
  const formatter = new DateFormatter(options.locale, formatOptions(singleMode, options));
  if (typeof value !== 'string') {
    const start = toDate(value.start, singleMode);
    const end = toDate(value.end, singleMode);
    return start && end ? formatter.formatRange(start, end) : `${value.start} – ${value.end}`;
  }
  const date = toDate(value, singleMode);
  return date ? formatter.format(date) : value;
}
