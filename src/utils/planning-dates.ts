// The days the planning views (CalendarView, Timeline) support, a year inside each end of the ISO
// 8601 calendar, so every week, month, quarter or year around a supported day is a real date.

import { parseIsoDate } from '../primitives/index.js';

/** The first and last supported planning days, included. */
export const planningDateRange = { start: '0002-01-01', end: '9998-12-31' } as const;

/** Whether a text is a real `YYYY-MM-DD` date inside the supported planning range. */
export function isPlanningDate(text: string | null | undefined): text is string {
  return (
    typeof text === 'string' &&
    parseIsoDate(text)?.toString() === text &&
    text >= planningDateRange.start &&
    text <= planningDateRange.end
  );
}

/** A real `YYYY-MM-DD` date moved into the supported planning range; `null` for any other text. */
export function toPlanningDate(text: string | null | undefined): string | null {
  const day = parseIsoDate(text)?.toString();
  if (day === undefined) return null;
  if (day < planningDateRange.start) return planningDateRange.start;
  return day > planningDateRange.end ? planningDateRange.end : day;
}
