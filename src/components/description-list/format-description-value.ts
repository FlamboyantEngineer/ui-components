// Locale-aware text for the values a description row formats itself.

import { getDefaultStrings } from '../../core/strings.js';
import { getDateTimeFormat, getListFormat, getNumberFormat } from '../../utils/intl-format.js';
import { readTimeInstant } from '../../utils/read-time-instant.js';

/** Both ends of a range of numbers or dates. */
export interface DescriptionRange<T extends number | string> {
  start: T;
  end: T;
}

/**
 * A value a row formats for the locale: a number, an ISO 8601 date or date and time text
 * (`2026-05-14`, `2026-05-14T09:30`), a list of texts, or a range of numbers or ISO 8601 texts.
 */
export type DescriptionValue =
  number | string | readonly string[] | DescriptionRange<number> | DescriptionRange<string>;

/** `Intl` options for the value's kind: number, date or list formatting. */
export type DescriptionFormatOptions =
  Intl.NumberFormatOptions | Intl.DateTimeFormatOptions | Intl.ListFormatOptions;

export interface DescriptionFormatInput {
  /** A BCP 47 locale, such as `fr-FR`. */
  locale: string;
  /**
   * The IANA time zone an instant reads in when `formatOptions` names none: the reader's, from
   * `useTimeZone`, so a server render and its hydration agree.
   */
  timeZone: string;
  formatOptions?: DescriptionFormatOptions | undefined;
  /**
   * Joins the ends of a date range no localized range format reads, such as unreadable text.
   * Defaults to the default language's `valueRange` message.
   */
  joinRange?: ((start: string, end: string) => string) | undefined;
}

const defaultDateOptions: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };

type DateValue = string | DescriptionRange<string>;

function isRange(
  value: DescriptionValue,
): value is DescriptionRange<number> | DescriptionRange<string> {
  return typeof value === 'object' && 'start' in value;
}

/**
 * Dates with `Intl.DateTimeFormat`. An ISO 8601 text is read in the formatter's time zone, so a
 * calendar date stays that date; a text that is not a date shows as written.
 */
function formatDate(
  value: DateValue,
  { locale, timeZone, formatOptions, joinRange }: DescriptionFormatInput,
) {
  const options = (formatOptions as Intl.DateTimeFormatOptions | undefined) ?? defaultDateOptions;
  const format = getDateTimeFormat(locale, { ...options, timeZone: options.timeZone ?? timeZone });
  const zone = format.resolvedOptions().timeZone;
  const read = (date: string) => readTimeInstant(date, zone);
  if (typeof value === 'string') {
    const date = read(value);
    return Number.isNaN(date) ? value : format.format(date);
  }
  const [start, end] = [read(value.start), read(value.end)];
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return (joinRange ?? getDefaultStrings().valueRange)(value.start, value.end);
  }
  return format.formatRange(start, end);
}

function formatNumber(
  value: number | DescriptionRange<number>,
  { locale, formatOptions, joinRange }: DescriptionFormatInput,
) {
  const format = getNumberFormat(locale, formatOptions as Intl.NumberFormatOptions | undefined);
  if (typeof value === 'number') return format.format(value);
  const { start, end } = value;
  // `formatRange` throws for an end that is not finite; the ends are then joined as written.
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return (joinRange ?? getDefaultStrings().valueRange)(format.format(start), format.format(end));
  }
  return format.formatRange(start, end);
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
  if (typeof value === 'string') return formatDate(value, input);
  if (isRange(value)) {
    return typeof value.start === 'number'
      ? formatNumber(value as DescriptionRange<number>, input)
      : formatDate(value as DescriptionRange<string>, input);
  }
  const options = input.formatOptions as Intl.ListFormatOptions | undefined;
  return getListFormat(input.locale, options ?? { type: 'conjunction' }).format(value);
}
