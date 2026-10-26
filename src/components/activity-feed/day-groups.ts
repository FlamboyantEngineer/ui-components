// Groups timed entries by the local calendar day they happened on, with a heading per day.

import { DateFormatter } from '../../primitives/index.js';
import {
  createCalendarDayReader,
  formatRelativeDay,
  type CalendarDay,
} from '../../utils/calendar-day.js';

/** A run of entries from one calendar day. */
interface DayGroup<T> {
  /** The day as `YYYY-MM-DD`, or an empty string for entries whose time cannot be read. */
  day: string;
  /** The day's heading: `Today`, `Yesterday`, `Tomorrow`, or the date. */
  label: string;
  items: T[];
}

interface DayGroupOptions {
  /** The moment `Today` is read against. */
  now: Date;
  locale: string;
  /** The heading of entries whose time cannot be read. */
  unknownLabel: string;
}

/** `Today`, `Yesterday` and `Tomorrow` as Intl words them; the full date further away. */
function formatDayLabel(day: CalendarDay, locale: string): string {
  if (Math.abs(day.offset) <= 1) return formatRelativeDay(day.offset, locale);
  return new DateFormatter(locale, { dateStyle: 'full' }).format(day.start);
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
  const readDay = createCalendarDayReader(options.now);
  for (const item of items) {
    const day = readDay(item.time);
    const key = day ? day.key : '';
    const last = groups.at(-1);
    if (last && last.day === key) {
      last.items.push(item);
      continue;
    }
    const label = day ? formatDayLabel(day, options.locale) : options.unknownLabel;
    groups.push({ day: key, label, items: [item] });
  }
  return groups;
}
