// The local calendar day of ISO 8601 values and moments, and the words for the days next to today.
// The activity feed and the notification list head their day groups with them.

import {
  fromDate,
  getLocalTimeZone,
  parseIsoDate,
  parseIsoDateTime,
  toCalendarDate,
  type CalendarDate,
} from '../primitives/index.js';
import { capitalizeText } from './relative-time.js';

/** The calendar day of an ISO 8601 date, or of a date and time read as local wall time; else `null`. */
export function parseCalendarDay(value: string): CalendarDate | null {
  const date = parseIsoDate(value);
  if (date) return date;
  const dateTime = parseIsoDateTime(value);
  return dateTime ? toCalendarDate(dateTime) : null;
}

/** The local calendar day of a moment. */
export function toLocalDay(moment: Date): CalendarDate {
  return toCalendarDate(fromDate(moment, getLocalTimeZone()));
}

/** A day `offset` days from today as Intl words it with `numeric: 'auto'`, capitalized: `Today`. */
export function formatRelativeDay(offset: number, locale: string): string {
  const words = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(offset, 'day');
  return capitalizeText(words, locale);
}
