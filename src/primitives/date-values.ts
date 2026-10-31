// Reads the library's ISO 8601 date and time texts as the date objects the date building blocks
// edit, and writes those objects back as texts (specs/PRIMITIVES.md, UIC-PRIMITIVES-1.2). A
// replacement library provides the same functions for its own date objects. The module is
// server-safe, so it also re-exports the date functions that server-safe utilities call.

import {
  getLocalTimeZone,
  parseAbsolute,
  parseDate,
  parseDateTime,
  parseTime,
  parseZonedDateTime,
  toCalendarDate,
  toCalendarDateTime,
  toTimeZone,
  toZoned,
  type CalendarDate,
  type CalendarDateTime,
  type Time,
  type ZonedDateTime,
} from '@internationalized/date';

export {
  DateFormatter,
  fromDate,
  getLocalTimeZone,
  now,
  resetLocalTimeZone,
  setLocalTimeZone,
  startOfWeek,
  toCalendarDate,
  toCalendarDateTime,
  toZoned,
  today,
} from '@internationalized/date';
export type { CalendarDate, DateValue } from '@internationalized/date';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const zonePattern = /\[[^\]]+\]$/;
const offsetPattern = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;

function attempt<T>(parse: () => T): T | null {
  try {
    return parse();
  } catch {
    return null;
  }
}

const pad = (part: number) => String(part).padStart(2, '0');

/** A `YYYY-MM-DD` text as a calendar date, or `null` when it is not a real date. */
export function parseIsoDate(text: string | null | undefined): CalendarDate | null {
  return text && isoDatePattern.test(text) ? attempt(() => parseDate(text)) : null;
}

/** An `HH:mm` or `HH:mm:ss` text (fractions of a second ignored) as a time of day, or `null`. */
export function parseIsoTime(text: string | null | undefined): Time | null {
  return text ? attempt(() => parseTime(text)) : null;
}

/**
 * A date and time text as the wall time it edits as. Without `timeZone` the result is a floating
 * local date and time: a floating text reads as written, and a text with an offset or a zone reads
 * as the local wall time of its instant. With `timeZone` the result is zoned there: a zoned or
 * offset text converts to the zone, and a floating text reads as wall time in it. `null` when the
 * text is not a date and time.
 */
export function parseIsoDateTime(
  text: string | null | undefined,
  timeZone?: string,
): CalendarDateTime | ZonedDateTime | null {
  if (!text || isoDatePattern.test(text)) return null;
  const zone = timeZone ?? getLocalTimeZone();
  const zoned = attempt(() => {
    if (zonePattern.test(text)) return toTimeZone(parseZonedDateTime(text), zone);
    if (offsetPattern.test(text)) return parseAbsolute(text, zone);
    return null;
  });
  if (zoned) return timeZone ? zoned : toCalendarDateTime(zoned);
  const floating = attempt(() => parseDateTime(text));
  if (!floating) return null;
  return timeZone ? attempt(() => toZoned(floating, timeZone)) : floating;
}

/**
 * A zoned date and time with its finer parts reset, in the same occurrence of a repeated hour: at
 * the end of daylight saving time, 01:30 in the second 01:00 hour truncates to 01:00 of that second
 * hour, not the first. A wall time the zone skips resolves forward, as `set` does by default.
 */
function truncateZoned(
  value: ZonedDateTime,
  parts: { minute: number; second: number; millisecond: number },
): ZonedDateTime {
  const occurrences = [value.set(parts, 'earlier'), value.set(parts, 'later')];
  return occurrences.find((candidate) => candidate.offset === value.offset) ?? value.set(parts);
}

/**
 * A date object as its ISO 8601 text: `YYYY-MM-DD` for a date, `HH:mm` (`HH:mm:ss` at the `second`
 * granularity) for a time, `YYYY-MM-DDTHH:mm` (or with seconds) for a floating date and time, and
 * `YYYY-MM-DDTHH:mm:ss±HH:MM[Zone]` for a zoned one. Finer parts than the granularity are dropped.
 */
export function formatIsoDate(
  value: CalendarDate | CalendarDateTime | ZonedDateTime | Time,
  granularity: 'hour' | 'minute' | 'second' = 'minute',
): string {
  if (!('hour' in value)) return value.toString();
  const minute = granularity === 'hour' ? 0 : value.minute;
  const second = granularity === 'second' ? value.second : 0;
  const time = `${pad(value.hour)}:${pad(minute)}`;
  const clock = granularity === 'second' ? `${time}:${pad(second)}` : time;
  if (!('day' in value)) return clock;
  if ('timeZone' in value)
    return truncateZoned(value, { minute, second, millisecond: 0 }).toString();
  return `${toCalendarDate(value).toString()}T${clock}`;
}
