// Groups timed entries by the local calendar day they happened on, with a heading per day.

import { DateFormatter, getLocalTimeZone, type CalendarDate } from '../../primitives/index.js';
import { formatRelativeDay, parseCalendarDay, toLocalDay } from '../../utils/calendar-day.js';

/** A run of entries from one calendar day. */
export interface DayGroup<T> {
  /** The day as `YYYY-MM-DD`, or an empty string for entries whose time cannot be read. */
  day: string;
  /** The day's heading: `Today`, `Yesterday`, `Tomorrow`, or the date. */
  label: string;
  items: T[];
}

export interface DayGroupOptions {
  /** The moment `Today` is read against. */
  now: Date;
  locale: string;
  /** The heading of entries whose time cannot be read. */
  unknownLabel: string;
}

/** `Today`, `Yesterday` and `Tomorrow` as Intl words them; the full date further away. */
function formatDayLabel(day: CalendarDate, { now, locale }: DayGroupOptions): string {
  const offset = day.compare(toLocalDay(now));
  if (Math.abs(offset) <= 1) return formatRelativeDay(offset, locale);
  return new DateFormatter(locale, { dateStyle: 'full' }).format(day.toDate(getLocalTimeZone()));
}

/**
 * Splits entries, in the order given, into runs of consecutive entries from the same local calendar
 * day, each with its heading. Entries whose time cannot be read form runs of their own.
 */
export function groupByDay<T extends { time: string }>(
  items: readonly T[],
  options: DayGroupOptions,
): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  for (const item of items) {
    const day = parseCalendarDay(item.time);
    const key = day ? day.toString() : '';
    const last = groups.at(-1);
    if (last && last.day === key) {
      last.items.push(item);
      continue;
    }
    const label = day ? formatDayLabel(day, options) : options.unknownLabel;
    groups.push({ day: key, label, items: [item] });
  }
  return groups;
}
