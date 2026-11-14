import { formatIsoDate, parseIsoDateTime, toCalendarDateTime } from '../../primitives/index.js';

/** Whether a date-time text names its offset or zone, rather than a wall clock. */
function isAnchored(text: string): boolean {
  return /T.*(?:Z|[+-]\d{2}(?::?\d{2})?|\])$/i.test(text);
}

/** A bracketed zone name ending a date-time text, as in `…-04:00[America/New_York]`. */
const zoneName = /\[[^\]]*\]$/;

/**
 * A date-time a gesture wrote, in the form of the event's start: with its offset and zone name
 * when the start names a zone, with its offset alone when the start gives an offset or `Z` (a text
 * `Date` reads), else as the wall clock in the calendar's zone, as the event gave it.
 */
export function toEventText(text: string, like: string, timeZone: string): string {
  if (zoneName.test(like)) return text;
  if (isAnchored(like)) return text.replace(zoneName, '');
  const value = parseIsoDateTime(text, timeZone);
  return value ? formatIsoDate(toCalendarDateTime(value)) : text;
}
