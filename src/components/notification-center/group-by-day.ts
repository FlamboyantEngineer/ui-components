// Groups dated entries under the local calendar day they fall on, labelled `Today`, `Yesterday` or
// the date, for lists read newest first.

import {
  DateFormatter,
  fromDate,
  getLocalTimeZone,
  parseIsoDate,
  parseIsoDateTime,
  toCalendarDate,
  type CalendarDate,
} from '../../primitives/index.js';
import { capitalizeText } from '../../utils/relative-time.js';

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

/** The calendar day of an ISO 8601 date, or of a date and time read as local wall time. */
function toDay(value: string): CalendarDate | null {
  const date = parseIsoDate(value);
  if (date) return date;
  const dateTime = parseIsoDateTime(value);
  return dateTime ? toCalendarDate(dateTime) : null;
}

function labelDay(day: CalendarDate, options: Pick<GroupByDayOptions<unknown>, 'now' | 'locale'>) {
  const today = toCalendarDate(fromDate(options.now, getLocalTimeZone()));
  const offset = day.compare(today);
  if (offset === 0 || offset === -1) {
    const words = new Intl.RelativeTimeFormat(options.locale, { numeric: 'auto' }).format(
      offset,
      'day',
    );
    return capitalizeText(words, options.locale);
  }
  const formatter = new DateFormatter(options.locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: day.year === today.year ? undefined : 'numeric',
  });
  return formatter.format(day.toDate(getLocalTimeZone()));
}

/**
 * Groups entries by the local calendar day of their date, keeping the groups in the order their
 * first entry appears and the entries in their given order. Entries without a readable date share
 * one group labelled `unknownLabel`.
 */
export function groupByDay<T>(items: readonly T[], options: GroupByDayOptions<T>): DayGroup<T>[] {
  const groups = new Map<string, DayGroup<T>>();
  for (const item of items) {
    const day = toDay(options.getDate(item));
    const key = day ? day.toString() : '';
    let group = groups.get(key);
    if (!group) {
      group = { day: key, label: day ? labelDay(day, options) : options.unknownLabel, items: [] };
      groups.set(key, group);
    }
    group.items.push(item);
  }
  return [...groups.values()];
}
