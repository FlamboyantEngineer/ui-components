// Relative date text (`Tomorrow`, `In 3 days`, `5 minutes ago`) and preset values, formatted through
// Intl for the reader's locale.

import { getDefaultStrings } from '../../core/strings.js';
import {
  type CalendarDate,
  formatIsoDate,
  fromDate,
  getLocalTimeZone,
  parseIsoDate,
  parseIsoDateTime,
  toCalendarDate,
  toCalendarDateTime,
} from '../../primitives/index.js';
import { type BoundIssue, findOrderedBoundIssue } from '../../utils/date-bounds.js';
import {
  getDateFormatter,
  getNumberFormat,
  getRelativeTimeFormat,
} from '../../utils/intl-format.js';
import {
  capitalizeText,
  describeRelativeTime,
  type RelativeTimeRelation,
  untilMidnight,
} from '../../utils/relative-time.js';
import type { DateRangeValue, DateTimeFieldMode } from '../date-time-field/date-time-field.js';

/**
 * The modes a relative date field shares with `DateTimeField`: `date` values are `YYYY-MM-DD` texts,
 * `date-time` values local `YYYY-MM-DDTHH:mm` texts and `date-range` values `{ start, end }` ranges
 * of dates.
 */
export type RelativeDateFieldMode = Extract<DateTimeFieldMode, 'date' | 'date-time' | 'date-range'>;

export type RelativeDateUnit = 'day' | 'week' | 'month' | 'year';

/** A relative date field's value with its kind erased. */
export type RelativeDateValue = string | DateRangeValue;

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
  /** Where the value lies against now; unknown before the clock may be read. */
  relation: RelativeDateRelation | undefined;
  /** Milliseconds until the text or relation may read differently, or `null` when it never will. */
  nextChange: number | null;
}

/** Now, and the IANA time zone days are read in (the device's without one). */
interface ZonedNow {
  now: Date;
  timeZone?: string | undefined;
}

interface RelativeDateOptions extends ZonedNow {
  locale: string;
  fallbackAfterDays: number;
}

/** The earliest and latest `YYYY-MM-DD` dates a value may fall on. */
export interface RelativeDateBounds {
  minValue?: string | undefined;
  maxValue?: string | undefined;
  /** The zone whose day a value with an offset or a zone falls on, the device's without one. */
  timeZone?: string | undefined;
}

/** The calendar day of a moment in `timeZone`, the device's zone without one. */
function toDay(moment: Date, timeZone: string | undefined): CalendarDate {
  return toCalendarDate(fromDate(moment, timeZone ?? getLocalTimeZone()));
}

/** A range is past once it ends before today, future while it starts after, present around it. */
function rangeRelation(range: DateRangeValue, today: string): RelativeDateRelation {
  if (range.end < today) return 'past';
  return range.start > today ? 'future' : 'present';
}

/** The calendar day of a moment in `timeZone` (the device's without one), as `YYYY-MM-DD`. */
export function toZonedDay(now: Date, timeZone?: string | undefined): string {
  return toDay(now, timeZone).toString();
}

/**
 * Describes a value relative to `now` through the shared relative time formatter, with the relative
 * text capitalized as a label. `null` when the value is not a date.
 */
export function describeRelativeDate(
  value: string,
  options: RelativeDateOptions,
): RelativeDateText | null {
  const text = describeRelativeTime(value, {
    ...options,
    timeZone: options.timeZone ?? getLocalTimeZone(),
  });
  if (!text) return null;
  const relative = capitalizeText(text.relative, options.locale);
  return {
    relative,
    absolute: text.absolute,
    relation: text.relation,
    nextChange: text.nextChange,
  };
}

/**
 * Describes a range relative to `now`: each end in relative words joined by `joinRange`
 * (`7 days ago – Today`), the localized range, and whether it lies before, around or after today. `null` unless both ends are
 * dates.
 */
export function describeRelativeRange(
  range: DateRangeValue,
  options: RelativeDateOptions & {
    joinRange?: ((start: string, end: string) => string) | undefined;
  },
): RelativeDateText | null {
  const start = describeRelativeDate(range.start, options);
  const end = describeRelativeDate(range.end, options);
  const absolute = formatDayRange(range, options.locale);
  if (!start || !end || absolute === null) return null;
  return {
    relative: (options.joinRange ?? getDefaultStrings().valueRange)(start.relative, end.relative),
    absolute,
    relation: rangeRelation(range, toZonedDay(options.now, options.timeZone)),
    // The relation moves on at midnight, with the ends' day counts.
    nextChange: Math.min(
      start.nextChange ?? Infinity,
      end.nextChange ?? Infinity,
      untilMidnight(options.now, options.timeZone ?? getLocalTimeZone()),
    ),
  };
}

/** A `YYYY-MM-DD` date as a localized date, the same in every zone; `null` unless it is a date. */
export function formatDay(text: string, locale: string): string | null {
  const date = parseIsoDate(text);
  if (!date) return null;
  return getDateFormatter(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(
    date.toDate('UTC'),
  );
}

/**
 * A range of `YYYY-MM-DD` dates as a localized range, the same in every zone; `null` unless both
 * ends are dates.
 */
export function formatDayRange(range: DateRangeValue, locale: string): string | null {
  const start = parseIsoDate(range.start);
  const end = parseIsoDate(range.end);
  if (!start || !end) return null;
  return getDateFormatter(locale, { dateStyle: 'medium', timeZone: 'UTC' }).formatRange(
    start.toDate('UTC'),
    end.toDate('UTC'),
  );
}

/** A preset's label: its own, or one such as `Today`, `Next week` or `In 3 days`. */
export function formatRelativePreset(preset: RelativeDatePreset, locale: string): string {
  if (preset.label) return preset.label;
  return capitalizeText(
    getRelativeTimeFormat(locale, { numeric: 'auto' }).format(preset.amount, preset.unit),
    locale,
  );
}

/** A range preset's count of units, such as `7 days`, for the `Last …` and `Next …` labels. */
export function formatRelativePeriod(preset: RelativeDatePreset, locale: string): string {
  const formatter = getNumberFormat(locale, {
    style: 'unit',
    unit: preset.unit,
    unitDisplay: 'long',
  });
  return formatter.format(Math.abs(preset.amount));
}

/** The value a preset stands for, counted from `now`, as a date or a local date and time. */
export function resolveRelativePreset(
  preset: RelativeDatePreset,
  options: ZonedNow & { kind: 'date' | 'date-time' },
): string {
  const duration = { [`${preset.unit}s`]: preset.amount };
  const moment = fromDate(options.now, options.timeZone ?? getLocalTimeZone()).add(duration);
  return options.kind === 'date'
    ? toCalendarDate(moment).toString()
    : formatIsoDate(toCalendarDateTime(moment));
}

/** The range a preset stands for: from the point it names to today, or from today to it. */
export function resolveRelativeRange(
  preset: RelativeDatePreset,
  { now, timeZone }: ZonedNow,
): DateRangeValue {
  const today = toDay(now, timeZone);
  const other = today.add({ [`${preset.unit}s`]: preset.amount }).toString();
  return preset.amount < 0
    ? { start: other, end: today.toString() }
    : { start: today.toString(), end: other };
}

/** A picked `YYYY-MM-DD` day as a value: the date, or that day at the current time of day. */
export function resolvePickedDate(
  date: string,
  options: ZonedNow & { kind: 'date' | 'date-time' },
): string {
  const day = parseIsoDate(date);
  if (options.kind === 'date' || !day) return date;
  const zone = options.timeZone ?? getLocalTimeZone();
  const moment = toCalendarDateTime(fromDate(options.now, zone));
  return formatIsoDate(moment.set({ year: day.year, month: day.month, day: day.day }));
}

/**
 * The `YYYY-MM-DD` date a value falls on, for a date or a date and time: a text with an offset or a
 * zone falls on its day in `timeZone`, the device's zone without one.
 */
export function toValueDate(value: string, timeZone?: string): string | null {
  const date = parseIsoDate(value);
  if (date) return date.toString();
  const dateTime = parseIsoDateTime(value, timeZone);
  return dateTime ? toCalendarDate(dateTime).toString() : null;
}

/**
 * Whether the mode can read a value: a `YYYY-MM-DD` date for `date`, a date and time (floating, with
 * an offset or with a zone) for `date-time`, and a range of two dates for `date-range`.
 */
export function isReadableRelativeValue(
  value: RelativeDateValue,
  kind: RelativeDateFieldMode,
): boolean {
  if (kind === 'date-range') {
    return typeof value === 'object' && !!parseIsoDate(value.start) && !!parseIsoDate(value.end);
  }
  if (typeof value !== 'string') return false;
  return kind === 'date' ? !!parseIsoDate(value) : !!parseIsoDateTime(value);
}

/**
 * Which bound a value, or either end of a range, breaks, with that bound's date; a range whose end
 * precedes its start breaks a minimum of its start, as in `DateTimeField`.
 */
export function findRelativeBoundIssue(
  value: RelativeDateValue | null,
  { timeZone, ...bounds }: RelativeDateBounds,
): BoundIssue | null {
  if (!value) return null;
  // Texts that are no date compare as equal, so they break no bound.
  const compare = (left: string, right: string) => {
    const before = toValueDate(left, timeZone);
    const after = toValueDate(right, timeZone);
    return before === null || after === null ? 0 : before.localeCompare(after);
  };
  return findOrderedBoundIssue(value, compare, bounds);
}
