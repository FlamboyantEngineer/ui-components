// The calendar day of ISO 8601 values read against today in a time zone, and the words for the days
// next to today. The activity feed and the notification list head their day groups with them.

import {
  fromDate,
  getLocalTimeZone,
  parseIsoDate,
  parseIsoDateTime,
  toCalendarDate,
} from '../primitives/index.js';
import { getRelativeTimeFormat } from './intl-format.js';
import { capitalizeText } from './relative-time.js';

/** The calendar day a value falls on, read against today. */
export interface CalendarDay {
  /** The day as an ISO 8601 date (`YYYY-MM-DD`). */
  key: string;
  /** Whole days from today: 0 today, -1 yesterday, 1 tomorrow; `null` while today is unknown. */
  offset: number | null;
  /** The day's midnight in UTC, for formatting it with a UTC formatter, the same in every zone. */
  start: Date;
  /** The day falls in the current year; `null` while today is unknown. */
  isThisYear: boolean | null;
}

/** Today, as now in a time zone; `now` is `null` while the clock may not be read. */
export interface CalendarDayClock {
  now: Date | null;
  /** The IANA time zone today is read in. Defaults to the device's. */
  timeZone?: string | undefined;
}

/**
 * Returns a reader of the calendar day of an ISO 8601 date, or of a date and time read as its wall
 * time, against the day of `now` in the time zone; it gives `null` for a value that is neither.
 */
export function createCalendarDayReader({
  now,
  timeZone,
}: CalendarDayClock): (value: string) => CalendarDay | null {
  const today = now ? toCalendarDate(fromDate(now, timeZone ?? getLocalTimeZone())) : null;
  return (value) => {
    const date = parseIsoDate(value);
    const dateTime = date ? null : parseIsoDateTime(value);
    const day = date ?? (dateTime ? toCalendarDate(dateTime) : null);
    if (!day) return null;
    return {
      key: day.toString(),
      offset: today ? day.compare(today) : null,
      start: day.toDate('UTC'),
      isThisYear: today ? day.year === today.year : null,
    };
  };
}

/** A day `offset` days from today as Intl words it with `numeric: 'auto'`, capitalized: `Today`. */
export function formatRelativeDay(offset: number, locale: string): string {
  const words = getRelativeTimeFormat(locale, { numeric: 'auto' }).format(offset, 'day');
  return capitalizeText(words, locale);
}
