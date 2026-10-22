import { parseIsoDate, parseIsoDateTime, toZoned } from '../primitives/index.js';

/** Epoch milliseconds of an ISO date or date-time in `timeZone`, or NaN for unreadable text. */
export function readTimeInstant(text: string, timeZone: string): number {
  const date = parseIsoDate(text);
  if (date) return toZoned(date, timeZone).toDate().getTime();
  const dateTime = parseIsoDateTime(text, timeZone);
  return dateTime && 'timeZone' in dateTime ? dateTime.toDate().getTime() : Number.NaN;
}
