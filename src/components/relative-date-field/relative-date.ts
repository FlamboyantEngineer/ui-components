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
} from '../../primitives/index.js';

/**
 * `date` values are `YYYY-MM-DD` texts, `date-time` values UTC ISO instants and `date-range` values
 * `{ start, end }` ranges of dates.
 */
export type RelativeDateKind = 'date' | 'date-time' | 'date-range';

export type RelativeDateUnit = 'day' | 'week' | 'month' | 'year';

/** A range of `YYYY-MM-DD` dates. */
export interface RelativeDateRange {
  start: string;
  end: string;
}

/** A relative date field's value with its kind erased. */
export type RelativeDateValue = string | RelativeDateRange;

/**
 * A value relative to now: `{ amount: 1, unit: 'day' }` is tomorrow, a negative amount is past. For a
 * range it runs from now to that point (`{ amount: -7, unit: 'day' }` is the last 7 days).
 */
export interface RelativeDatePreset {
  amount: number;
  unit: RelativeDateUnit;
  /** Names the preset instead of the text generated from its amount and unit. */
  label?: string | undefined;
}

/** A named preset whose value the caller computes from now, such as the end of the quarter. */
export interface RelativeDateComputedPreset<V> {
  label: string;
  getValue: (now: Date) => V;
}

export type RelativeDateRelation = 'past' | 'present' | 'future';

export interface RelativeDateText {
  /** The value relative to now, such as `Tomorrow` or `3 days ago`. */
  relative: string;
  /** The value as a localized date, or date and time. */
  absolute: string;
  relation: RelativeDateRelation;
}

/** The earliest and latest `YYYY-MM-DD` dates a value may fall on. */
export interface RelativeDateBounds {
  minValue?: string | undefined;
  maxValue?: string | undefined;
}

interface ParsedValue {
  kind: 'date' | 'date-time';
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

/** A range is past once it ends before today, future while it starts after, present around it. */
function rangeRelation(range: RelativeDateRange, today: CalendarDate): RelativeDateRelation {
  if (parseDate(range.end).compare(today) < 0) return 'past';
  return parseDate(range.start).compare(today) > 0 ? 'future' : 'present';
}

/** The local calendar day of a moment. */
export function toLocalDay(now: Date): CalendarDate {
  return toCalendarDate(fromDate(now, getLocalTimeZone()));
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
  const days = parsed.date.compare(toLocalDay(now));
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const absolute = new DateFormatter(locale, {
    dateStyle: 'medium',
    timeStyle: parsed.instant ? 'short' : undefined,
  }).format(parsed.instant ? parsed.instant.toDate() : parsed.date.toDate(getLocalTimeZone()));
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

/**
 * Describes a range relative to `now`: each end in relative words (`7 days ago – Today`), the
 * localized range, and whether it lies before, around or after today. `null` unless both ends are
 * dates.
 */
export function describeRelativeRange(
  range: RelativeDateRange,
  options: { now: Date; locale: string; fallbackAfterDays: number },
): RelativeDateText | null {
  const start = describeRelativeDate(range.start, options);
  const end = describeRelativeDate(range.end, options);
  if (!start || !end) return null;
  const zone = getLocalTimeZone();
  const today = toLocalDay(options.now);
  const absolute = new DateFormatter(options.locale, { dateStyle: 'medium' }).formatRange(
    parseDate(range.start).toDate(zone),
    parseDate(range.end).toDate(zone),
  );
  return {
    relative: `${start.relative} – ${end.relative}`,
    absolute,
    relation: rangeRelation(range, today),
  };
}

/** A preset's label: its own, or one such as `Today`, `Next week` or `In 3 days`. */
export function formatRelativePreset(preset: RelativeDatePreset, locale: string): string {
  if (preset.label) return preset.label;
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  return capitalize(formatter.format(preset.amount, preset.unit), locale);
}

/** A range preset's count of units, such as `7 days`, for the `Last …` and `Next …` labels. */
export function formatRelativePeriod(preset: RelativeDatePreset, locale: string): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: preset.unit,
    unitDisplay: 'long',
  });
  return formatter.format(Math.abs(preset.amount));
}

/** The value a preset stands for, counted from `now`, as a date or a UTC ISO instant. */
export function resolveRelativePreset(
  preset: RelativeDatePreset,
  options: { now: Date; kind: 'date' | 'date-time' },
): string {
  const duration = { [`${preset.unit}s`]: preset.amount };
  const moment = fromDate(options.now, getLocalTimeZone()).add(duration);
  return options.kind === 'date'
    ? toCalendarDate(moment).toString()
    : moment.toDate().toISOString();
}

/** The range a preset stands for: from the point it names to today, or from today to it. */
export function resolveRelativeRange(preset: RelativeDatePreset, now: Date): RelativeDateRange {
  const today = toLocalDay(now);
  const other = today.add({ [`${preset.unit}s`]: preset.amount }).toString();
  return preset.amount < 0
    ? { start: other, end: today.toString() }
    : { start: today.toString(), end: other };
}

/** A picked calendar day as a value: the date, or that day at the current time of day. */
export function resolvePickedDate(
  date: CalendarDate,
  options: { now: Date; kind: 'date' | 'date-time' },
): string {
  if (options.kind === 'date') return date.toString();
  const moment = fromDate(options.now, getLocalTimeZone());
  return moment.set({ year: date.year, month: date.month, day: date.day }).toDate().toISOString();
}

/** The calendar date a value falls on, for a date or an instant. */
export function toValueDate(value: string): CalendarDate | null {
  return parseValue(value)?.date ?? null;
}

/** Which bound a value, or either end of a range, breaks, with that bound's date. */
export function findRelativeBoundIssue(
  value: RelativeDateValue | null,
  { minValue, maxValue }: RelativeDateBounds,
): { bound: 'min' | 'max'; limit: string } | null {
  if (!value) return null;
  const [first, last] = typeof value === 'string' ? [value, value] : [value.start, value.end];
  const firstDate = toValueDate(first)?.toString();
  const lastDate = toValueDate(last)?.toString();
  if (minValue && firstDate && firstDate < minValue) return { bound: 'min', limit: minValue };
  if (maxValue && lastDate && lastDate > maxValue) return { bound: 'max', limit: maxValue };
  return null;
}
