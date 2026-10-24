// Locale-aware text for the values a description row formats itself.

import { readTimeInstant } from '../../utils/read-time-instant.js';

/** Both ends of a range of numbers or dates. */
export interface DescriptionRange<T extends number | string | Date> {
  start: T;
  end: T;
}

/**
 * A value a row formats for the locale: a number, an ISO 8601 date or date and time text
 * (`2026-05-14`, `2026-05-14T09:30`), a list of texts, or a range of numbers or dates. A `Date`
 * object still formats but is deprecated: it holds an instant, so a calendar date can shift a day
 * with the reader's time zone. Use an ISO 8601 text.
 */
export type DescriptionValue =
  | number
  | string
  | Date
  | readonly string[]
  | DescriptionRange<number>
  | DescriptionRange<string>
  | DescriptionRange<Date>;

/** `Intl` options for the value's kind: number, date or list formatting. */
export type DescriptionFormatOptions =
  | Intl.NumberFormatOptions
  | Intl.DateTimeFormatOptions
  | Intl.ListFormatOptions;

export interface DescriptionFormatInput {
  /** A BCP 47 locale, such as `fr-FR`. */
  locale: string;
  formatOptions?: DescriptionFormatOptions | undefined;
}

const defaultDateOptions: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };

type DateValue = string | Date | DescriptionRange<string> | DescriptionRange<Date>;

function isRange(
  value: DescriptionValue,
): value is DescriptionRange<number> | DescriptionRange<string> | DescriptionRange<Date> {
  return typeof value === 'object' && 'start' in value;
}

/**
 * Dates with `Intl.DateTimeFormat`. An ISO 8601 text is read in the formatter's time zone, so a
 * calendar date stays that date; a text that is not a date shows as written.
 */
function formatDate(value: DateValue, { locale, formatOptions }: DescriptionFormatInput) {
  const format = new Intl.DateTimeFormat(
    locale,
    (formatOptions as Intl.DateTimeFormatOptions | undefined) ?? defaultDateOptions,
  );
  const zone = format.resolvedOptions().timeZone;
  const read = (date: string | Date) =>
    typeof date === 'string' ? readTimeInstant(date, zone) : date;
  if (typeof value === 'string' || value instanceof Date) {
    const date = read(value);
    return typeof date === 'number' && Number.isNaN(date) ? String(value) : format.format(date);
  }
  const [start, end] = [read(value.start), read(value.end)];
  if (Number.isNaN(Number(start)) || Number.isNaN(Number(end))) {
    return `${String(value.start)} – ${String(value.end)}`;
  }
  return format.formatRange(start, end);
}

function formatNumber(
  value: number | DescriptionRange<number>,
  { locale, formatOptions }: DescriptionFormatInput,
) {
  const format = new Intl.NumberFormat(
    locale,
    formatOptions as Intl.NumberFormatOptions | undefined,
  );
  return typeof value === 'number'
    ? format.format(value)
    : format.formatRange(value.start, value.end);
}

/**
 * A value as text for `locale`: numbers and number ranges with `Intl.NumberFormat`, ISO 8601 dates
 * and date ranges with `Intl.DateTimeFormat` (a medium date by default), and lists of texts joined
 * with `Intl.ListFormat` (`Apples, pears, and plums` in English by default).
 */
export function formatDescriptionValue(
  value: DescriptionValue,
  input: DescriptionFormatInput,
): string {
  if (typeof value === 'number') return formatNumber(value, input);
  if (typeof value === 'string' || value instanceof Date) return formatDate(value, input);
  if (isRange(value)) {
    return typeof value.start === 'number'
      ? formatNumber(value as DescriptionRange<number>, input)
      : formatDate(value as DescriptionRange<string> | DescriptionRange<Date>, input);
  }
  const options = input.formatOptions as Intl.ListFormatOptions | undefined;
  return new Intl.ListFormat(input.locale, options ?? { type: 'conjunction' }).format(value);
}
