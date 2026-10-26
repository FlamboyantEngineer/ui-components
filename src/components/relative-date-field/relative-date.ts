// Relative date text (`Tomorrow`, `In 3 days`, `5 minutes ago`) and preset values, formatted through
// Intl for the reader's locale.

import {
  DateFormatter,
  formatIsoDate,
  fromDate,
  getLocalTimeZone,
  parseIsoDate,
  parseIsoDateTime,
  toCalendarDate,
  toCalendarDateTime,
  type CalendarDate,
} from '../../primitives/index.js';
import {
  capitalizeText,
  describeRelativeTime,
  type RelativeTimeRelation,
} from '../../utils/relative-time.js';

/**
 * `date` values are `YYYY-MM-DD` texts, `date-time` values local `YYYY-MM-DDTHH:mm` texts and
 * `date-range` values `{ start, end }` ranges of dates.
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

type RelativeDateRelation = RelativeTimeRelation;

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

/** The local calendar day of a moment. */
function toDay(moment: Date): CalendarDate {
  return toCalendarDate(fromDate(moment, getLocalTimeZone()));
}

/** A range is past once it ends before today, future while it starts after, present around it. */
function rangeRelation(range: RelativeDateRange, today: string): RelativeDateRelation {
  if (range.end < today) return 'past';
  return range.start > today ? 'future' : 'present';
}

/** The local calendar day of a moment, as `YYYY-MM-DD`. */
export function toLocalDay(now: Date): string {
  return toDay(now).toString();
}

/**
 * Describes a value relative to `now` through the shared relative time formatter, with the relative
 * text capitalized as a label. `null` when the value is not a date.
 */
export function describeRelativeDate(
  value: string,
  options: { now: Date; locale: string; fallbackAfterDays: number },
): RelativeDateText | null {
  const text = describeRelativeTime(value, options);
  if (!text) return null;
  const relative = capitalizeText(text.relative, options.locale);
  return { relative, absolute: text.absolute, relation: text.relation };
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
  const startDate = parseIsoDate(range.start);
  const endDate = parseIsoDate(range.end);
  if (!start || !end || !startDate || !endDate) return null;
  const zone = getLocalTimeZone();
  const today = toLocalDay(options.now);
  const absolute = new DateFormatter(options.locale, { dateStyle: 'medium' }).formatRange(
    startDate.toDate(zone),
    endDate.toDate(zone),
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
  return capitalizeText(formatter.format(preset.amount, preset.unit), locale);
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

/** The value a preset stands for, counted from `now`, as a date or a local date and time. */
export function resolveRelativePreset(
  preset: RelativeDatePreset,
  options: { now: Date; kind: 'date' | 'date-time' },
): string {
  const duration = { [`${preset.unit}s`]: preset.amount };
  const moment = fromDate(options.now, getLocalTimeZone()).add(duration);
  return options.kind === 'date'
    ? toCalendarDate(moment).toString()
    : formatIsoDate(toCalendarDateTime(moment));
}

/** The range a preset stands for: from the point it names to today, or from today to it. */
export function resolveRelativeRange(preset: RelativeDatePreset, now: Date): RelativeDateRange {
  const today = toDay(now);
  const other = today.add({ [`${preset.unit}s`]: preset.amount }).toString();
  return preset.amount < 0
    ? { start: other, end: today.toString() }
    : { start: today.toString(), end: other };
}

/** A picked `YYYY-MM-DD` day as a value: the date, or that day at the current time of day. */
export function resolvePickedDate(
  date: string,
  options: { now: Date; kind: 'date' | 'date-time' },
): string {
  const day = parseIsoDate(date);
  if (options.kind === 'date' || !day) return date;
  const moment = toCalendarDateTime(fromDate(options.now, getLocalTimeZone()));
  return formatIsoDate(moment.set({ year: day.year, month: day.month, day: day.day }));
}

/** The `YYYY-MM-DD` date a value falls on, for a date or a date and time. */
export function toValueDate(value: string): string | null {
  const date = parseIsoDate(value);
  if (date) return date.toString();
  const dateTime = parseIsoDateTime(value);
  return dateTime ? toCalendarDate(dateTime).toString() : null;
}

/** Which bound a value, or either end of a range, breaks, with that bound's date. */
export function findRelativeBoundIssue(
  value: RelativeDateValue | null,
  { minValue, maxValue }: RelativeDateBounds,
): { bound: 'min' | 'max'; limit: string } | null {
  if (!value) return null;
  const [first, last] = typeof value === 'string' ? [value, value] : [value.start, value.end];
  const firstDate = toValueDate(first);
  const lastDate = toValueDate(last);
  if (minValue && firstDate && firstDate < minValue) return { bound: 'min', limit: minValue };
  if (maxValue && lastDate && lastDate > maxValue) return { bound: 'max', limit: maxValue };
  return null;
}
