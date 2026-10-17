// Locale-aware text for the values a description row formats itself.

/** Both ends of a range of numbers or dates. */
export interface DescriptionRange<T extends number | Date> {
  start: T;
  end: T;
}

/** A value a row formats for the locale: a number, a date, a list of texts, or a range. */
export type DescriptionValue =
  | number
  | Date
  | readonly string[]
  | DescriptionRange<number>
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

function isRange(
  value: DescriptionValue,
): value is DescriptionRange<number> | DescriptionRange<Date> {
  return typeof value === 'object' && 'start' in value;
}

function formatDate(
  value: Date | DescriptionRange<Date>,
  { locale, formatOptions }: DescriptionFormatInput,
) {
  const format = new Intl.DateTimeFormat(
    locale,
    (formatOptions as Intl.DateTimeFormatOptions | undefined) ?? defaultDateOptions,
  );
  return value instanceof Date ? format.format(value) : format.formatRange(value.start, value.end);
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
 * A value as text for `locale`: numbers and number ranges with `Intl.NumberFormat`, dates and date
 * ranges with `Intl.DateTimeFormat` (a medium date by default), and lists of texts joined with
 * `Intl.ListFormat` (`Apples, pears, and plums` in English by default).
 */
export function formatDescriptionValue(
  value: DescriptionValue,
  input: DescriptionFormatInput,
): string {
  if (typeof value === 'number') return formatNumber(value, input);
  if (value instanceof Date) return formatDate(value, input);
  if (isRange(value)) {
    return typeof value.start === 'number'
      ? formatNumber(value as DescriptionRange<number>, input)
      : formatDate(value as DescriptionRange<Date>, input);
  }
  const options = input.formatOptions as Intl.ListFormatOptions | undefined;
  return new Intl.ListFormat(input.locale, options ?? { type: 'conjunction' }).format(value);
}
