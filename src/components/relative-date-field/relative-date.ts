// Relative date text (`Tomorrow`, `In 3 days`, `5 minutes ago`) and preset values, formatted through
// Intl for the reader's locale.

import {
  DateFormatter,
  fromDate,
  getLocalTimeZone,
  parseAbsoluteToLocal,
  parseDate,
  toCalendarDate,
  type CalendarDate,
  type ZonedDateTime,
} from '@internationalized/date';

/** `date` values are `YYYY-MM-DD` texts; `date-time` values are UTC ISO instants. */
export type RelativeDateKind = 'date' | 'date-time';

export type RelativeDateUnit = 'day' | 'week' | 'month' | 'year';

/** A value relative to now: `{ amount: 1, unit: 'day' }` is tomorrow, a negative amount is past. */
export interface RelativeDatePreset {
  amount: number;
  unit: RelativeDateUnit;
}

export type RelativeDateRelation = 'past' | 'present' | 'future';

export interface RelativeDateText {
  /** The value relative to now, such as `Tomorrow` or `3 days ago`. */
  relative: string;
  /** The value as a localized date, or date and time. */
  absolute: string;
  relation: RelativeDateRelation;
}

interface ParsedValue {
  kind: RelativeDateKind;
  date: CalendarDate;
  instant: ZonedDateTime | null;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function parseValue(value: string): ParsedValue | null {
  try {
    if (DATE_ONLY.test(value)) return { kind: 'date', date: parseDate(value), instant: null };
    const instant = parseAbsoluteToLocal(value);
    return { kind: 'date-time', date: toCalendarDate(instant), instant };
  } catch {
    return null;
  }
}

/** Upper-cases the first letter, for text that starts a label. */
function capitalize(text: string, locale: string): string {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/** The largest unit under a day that fits an instant's distance from now, with its count. */
function timeDistance(milliseconds: number): [number, Intl.RelativeTimeFormatUnit] {
  if (Math.abs(milliseconds) < MINUTE) return [Math.round(milliseconds / 1000), 'second'];
  if (Math.abs(milliseconds) < HOUR) return [Math.round(milliseconds / MINUTE), 'minute'];
  return [Math.round(milliseconds / HOUR), 'hour'];
}

function relationOf(distance: number): RelativeDateRelation {
  if (distance === 0) return 'present';
  return distance > 0 ? 'future' : 'past';
}

/**
 * Describes a value relative to `now`: seconds, minutes or hours for an instant within a day,
 * calendar days within `fallbackAfterDays`, and the absolute date beyond. `null` when the value is
 * not a date.
 */
export function describeRelativeDate(
  value: string,
  options: { now: Date; locale: string; fallbackAfterDays: number },
): RelativeDateText | null {
  const parsed = parseValue(value);
  if (!parsed) return null;
  const { locale, now } = options;
  const zone = getLocalTimeZone();
  const days = parsed.date.compare(toCalendarDate(fromDate(now, zone)));
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const absolute = new DateFormatter(locale, {
    dateStyle: 'medium',
    timeStyle: parsed.instant ? 'short' : undefined,
  }).format(parsed.instant ? parsed.instant.toDate() : parsed.date.toDate(zone));
  const offset = parsed.instant ? parsed.instant.toDate().getTime() - now.getTime() : 0;
  if (parsed.instant && Math.abs(offset) < DAY) {
    const [count, unit] = timeDistance(offset);
    const relative = capitalize(formatter.format(count, unit), locale);
    return { relative, absolute, relation: relationOf(count) };
  }
  if (Math.abs(days) >= options.fallbackAfterDays) {
    return { relative: absolute, absolute, relation: relationOf(days) };
  }
  return {
    relative: capitalize(formatter.format(days, 'day'), locale),
    absolute,
    relation: relationOf(days),
  };
}

/** A preset's label, such as `Today`, `Next week` or `In 3 days`. */
export function formatRelativePreset(preset: RelativeDatePreset, locale: string): string {
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  return capitalize(formatter.format(preset.amount, preset.unit), locale);
}

/** The value a preset stands for, counted from `now`, as a date or a UTC ISO instant. */
export function resolveRelativePreset(
  preset: RelativeDatePreset,
  options: { now: Date; kind: RelativeDateKind },
): string {
  const duration = { [`${preset.unit}s`]: preset.amount };
  const moment = fromDate(options.now, getLocalTimeZone()).add(duration);
  return options.kind === 'date'
    ? toCalendarDate(moment).toString()
    : moment.toDate().toISOString();
}
