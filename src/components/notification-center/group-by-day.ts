// Groups dated entries under the local calendar day they fall on, labelled `Today`, `Yesterday` or
// the date, for lists read newest first.

import { DateFormatter } from '../../primitives/index.js';
import {
  createCalendarDayReader,
  formatRelativeDay,
  type CalendarDay,
} from '../../utils/calendar-day.js';

/** Entries that fall on one day, in the order they were given. */
export interface DayGroup<T> {
  /** The day as an ISO 8601 date (`YYYY-MM-DD`), or empty text for entries without a readable date. */
  day: string;
  /** The day as a heading: `Today`, `Yesterday`, the date, or `unknownLabel`. */
  label: string;
  items: T[];
}

export interface GroupByDayOptions<T> {
  /** The entry's ISO 8601 date or date and time. */
  getDate: (item: T) => string;
  /** The moment `Today` is read against. */
  now: Date;
  locale: string;
  /** Labels the group of entries whose date cannot be read. */
  unknownLabel: string;
}

function labelDay(day: CalendarDay, locale: string) {
  if (day.offset === 0 || day.offset === -1) return formatRelativeDay(day.offset, locale);
  const formatter = new DateFormatter(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: day.isThisYear ? undefined : 'numeric',
  });
  return formatter.format(day.start);
}

/**
 * Groups entries by the local calendar day of their date, keeping the groups in the order their
 * first entry appears and the entries in their given order. Entries without a readable date share
 * one group labelled `unknownLabel`.
 */
export function groupByDay<T>(items: readonly T[], options: GroupByDayOptions<T>): DayGroup<T>[] {
  const groups = new Map<string, DayGroup<T>>();
  const readDay = createCalendarDayReader(options.now);
  for (const item of items) {
    const day = readDay(options.getDate(item));
    const key = day ? day.key : '';
    let group = groups.get(key);
    if (!group) {
      const label = day ? labelDay(day, options.locale) : options.unknownLabel;
      group = { day: key, label, items: [] };
      groups.set(key, group);
    }
    group.items.push(item);
  }
  return [...groups.values()];
}
