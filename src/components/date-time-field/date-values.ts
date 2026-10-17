// A date-time field's value model: canonical text values, the React Aria values they edit as, the
// field's bounds and the text it shows for a value.

import type { CalendarDateTime, Time } from '@internationalized/date';
import {
  DateFormatter,
  getLocalTimeZone,
  now,
  parseAbsoluteToLocal,
  parseDate,
  parseTime,
  toCalendarDateTime,
  today,
  type CalendarDate,
} from '@internationalized/date';

/** `date` (`YYYY-MM-DD`), `time` (`HH:mm`), `date-time` (a UTC ISO instant) or `date-range`. */
export type DateTimeFieldMode = 'date' | 'time' | 'date-time' | 'date-range';

/** A complete range of `YYYY-MM-DD` dates. */
export interface DateRangeValue {
  start: string;
  end: string;
}

/** A date-time field's value with its mode erased. */
export type DateFieldValue = string | DateRangeValue | null;

/** A single value's mode. */
export type SingleDateMode = Exclude<DateTimeFieldMode, 'date-range'>;

function attempt<T>(parse: () => T): T | null {
  try {
    return parse();
  } catch {
    return null;
  }
}

const pad = (part: number) => String(part).padStart(2, '0');

/** A `YYYY-MM-DD` text as a calendar date, or `null` when it is not one. */
export function toCalendarDateValue(text: string | null | undefined): CalendarDate | null {
  return text ? attempt(() => parseDate(text)) : null;
}

/** An `HH:mm` text as a time of day, or `null` when it is not one. */
export function toTimeValue(text: string | null | undefined): Time | null {
  return text ? attempt(() => parseTime(text)) : null;
}

/** A UTC ISO instant as the local wall time it edits as, or `null` when it is not one. */
export function toDateTimeValue(text: string | null | undefined): CalendarDateTime | null {
  return text ? attempt(() => toCalendarDateTime(parseAbsoluteToLocal(text))) : null;
}

/** A range value as calendar dates, or `null` unless both ends are dates. */
export function toRangeValue(
  value: DateRangeValue | null | undefined,
): { start: CalendarDate; end: CalendarDate } | null {
  const start = toCalendarDateValue(value?.start);
  const end = toCalendarDateValue(value?.end);
  return start && end ? { start, end } : null;
}

export function fromTimeValue(time: Time): string {
  return `${pad(time.hour)}:${pad(time.minute)}`;
}

/** A local wall time as the UTC ISO instant it stands for. */
export function fromDateTimeValue(value: CalendarDateTime): string {
  return value.toDate(getLocalTimeZone()).toISOString();
}

/** The current date, or the current date and time to the minute, as a canonical value. */
export function currentDateValue(mode: 'date' | 'date-time'): string {
  if (mode === 'date') return today(getLocalTimeZone()).toString();
  return now(getLocalTimeZone()).set({ second: 0, millisecond: 0 }).toDate().toISOString();
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
  const singleMode: SingleDateMode = mode === 'date-range' ? 'date' : mode;
  const [first, last] = typeof value === 'string' ? [value, value] : [value.start, value.end];
  if (minValue && compareSingle(first, minValue, singleMode) < 0) {
    return { bound: 'min', limit: minValue };
  }
  if (maxValue && compareSingle(last, maxValue, singleMode) > 0) {
    return { bound: 'max', limit: maxValue };
  }
  return compareSingle(last, first, singleMode) < 0 ? { bound: 'min', limit: first } : null;
}

function toDate(text: string, mode: SingleDateMode): Date | null {
  if (mode === 'date-time') return attempt(() => parseAbsoluteToLocal(text).toDate());
  if (mode === 'date') return toCalendarDateValue(text)?.toDate(getLocalTimeZone()) ?? null;
  const time = toTimeValue(text);
  return time ? new Date(2000, 0, 1, time.hour, time.minute) : null;
}

const formats: Record<SingleDateMode, Intl.DateTimeFormatOptions> = {
  date: { dateStyle: 'medium' },
  time: { timeStyle: 'short' },
  'date-time': { dateStyle: 'medium', timeStyle: 'short' },
};

/** A value as localized text: a date, a time, both, or a date range. Unreadable text is kept. */
export function formatDateValue(
  value: Exclude<DateFieldValue, null>,
  mode: DateTimeFieldMode,
  locale: string,
): string {
  if (typeof value !== 'string') {
    const formatter = new DateFormatter(locale, formats.date);
    const start = toDate(value.start, 'date');
    const end = toDate(value.end, 'date');
    return start && end ? formatter.formatRange(start, end) : `${value.start} – ${value.end}`;
  }
  const singleMode: SingleDateMode = mode === 'date-range' ? 'date' : mode;
  const date = toDate(value, singleMode);
  return date ? new DateFormatter(locale, formats[singleMode]).format(date) : value;
}
