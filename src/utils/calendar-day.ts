// The local calendar day of ISO 8601 values read against today, and the words for the days next to
// today. The activity feed and the notification list head their day groups with them.

import {
  fromDate,
  getLocalTimeZone,
  parseIsoDate,
  parseIsoDateTime,
  toCalendarDate,
} from '../primitives/index.js';
import { getRelativeTimeFormat } from './intl-format.js';
import { capitalizeText } from './relative-time.js';

/** The local calendar day a value falls on, read against today. */
export interface CalendarDay {
  /** The day as an ISO 8601 date (`YYYY-MM-DD`). */
  key: string;
  /** Whole days from today: 0 today, -1 yesterday, 1 tomorrow. */
  offset: number;
  /** The day's local midnight, for formatting it. */
  start: Date;
  /** The day falls in the current year. */
  isThisYear: boolean;
}

/**
 * Returns a reader of the calendar day of an ISO 8601 date, or of a date and time read as local
 * wall time, against the local day of `now`; it gives `null` for a value that is neither.
 */
export function createCalendarDayReader(now: Date): (value: string) => CalendarDay | null {
  const zone = getLocalTimeZone();
  const today = toCalendarDate(fromDate(now, zone));
  return (value) => {
    const date = parseIsoDate(value);
    const dateTime = date ? null : parseIsoDateTime(value);
    const day = date ?? (dateTime ? toCalendarDate(dateTime) : null);
    if (!day) return null;
    return {
      key: day.toString(),
      offset: day.compare(today),
      start: day.toDate(zone),
      isThisYear: day.year === today.year,
    };
  };
}

/** A day `offset` days from today as Intl words it with `numeric: 'auto'`, capitalized: `Today`. */
export function formatRelativeDay(offset: number, locale: string): string {
  const words = getRelativeTimeFormat(locale, { numeric: 'auto' }).format(offset, 'day');
  return capitalizeText(words, locale);
}
