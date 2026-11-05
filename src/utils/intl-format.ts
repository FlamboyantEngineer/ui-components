// Shared Intl formatters. Building one costs far more than formatting with it, and lists, tables and
// transcripts format a value per row on every render, so each locale and option set builds one
// formatter while it remains among the recently used configurations.

import { DateFormatter } from '../primitives/index.js';
import { createLruCache } from './lru-cache.js';

/** Returns the formatter for a locale and options, building it on the first call. */
function createFormatCache<L extends string | undefined, O extends object, F>(
  create: (locale: L, options: O | undefined) => F,
) {
  const formats = createLruCache<string, F>(128);
  return (locale: L, options?: O): F => {
    const key = `${locale ?? ''}\u0000${options ? JSON.stringify(options) : ''}`;
    let format = formats.get(key);
    if (format === undefined) {
      format = create(locale, options);
      formats.set(key, format);
    }
    return format;
  };
}

/** Formats dates and date ranges, every space written as a plain space (`normalizeIntlSpaces`). */
interface DateFormat<D> {
  format: (date: D) => string;
  formatRange: (start: D, end: D) => string;
}

/** A date formatter whose texts agree across runtimes, so a server render hydrates unchanged. */
function withPlainSpaces<D>(formatter: DateFormat<D>): DateFormat<D> {
  return {
    format: (date) => normalizeIntlSpaces(formatter.format(date)),
    formatRange: (start, end) => normalizeIntlSpaces(formatter.formatRange(start, end)),
  };
}

/**
 * A shared React Aria `DateFormatter`, which corrects the hour cycle of some locales. Its texts write
 * every space as a plain space.
 */
export const getDateFormatter = createFormatCache<
  string,
  Intl.DateTimeFormatOptions,
  DateFormat<Date>
>((locale, options) => withPlainSpaces(new DateFormatter(locale, options)));

/** A shared `Intl.DateTimeFormat`. Its texts write every space as a plain space. */
export const getDateTimeFormat = createFormatCache<
  string | undefined,
  Intl.DateTimeFormatOptions,
  DateFormat<Date | number> & Pick<Intl.DateTimeFormat, 'resolvedOptions'>
>((locale, options) => {
  const format = new Intl.DateTimeFormat(locale, options);
  return {
    ...withPlainSpaces<Date | number>(format),
    resolvedOptions: () => format.resolvedOptions(),
  };
});

/** A shared `Intl.NumberFormat`. */
export const getNumberFormat = createFormatCache<
  string | undefined,
  Intl.NumberFormatOptions,
  Intl.NumberFormat
>((locale, options) => new Intl.NumberFormat(locale, options));

/** A shared `Intl.ListFormat`. */
export const getListFormat = createFormatCache<
  string | undefined,
  Intl.ListFormatOptions,
  Intl.ListFormat
>((locale, options) => new Intl.ListFormat(locale, options));

/** A shared `Intl.RelativeTimeFormat`. */
export const getRelativeTimeFormat = createFormatCache<
  string | undefined,
  Intl.RelativeTimeFormatOptions,
  Intl.RelativeTimeFormat
>((locale, options) => new Intl.RelativeTimeFormat(locale, options));

/** A shared `Intl.Collator`. */
export const getCollator = createFormatCache<
  string | undefined,
  Intl.CollatorOptions,
  Intl.Collator
>((locale, options) => new Intl.Collator(locale, options));

/** A shared `Intl.Segmenter`. */
export const getSegmenter = createFormatCache<
  string | undefined,
  Intl.SegmenterOptions,
  Intl.Segmenter
>((locale, options) => new Intl.Segmenter(locale, options));

const intlSpaces = /[ \u00a0\u2009\u202f]/g;

/**
 * A formatted date or time with each space written as `space`. Runtimes write the spaces in dates and
 * times differently (Node and some browsers a narrow no-break space before AM and PM, others a plain
 * space), so a server's text and a browser's agree only once normalized. A no-break space keeps a
 * space that stands alone in an element from collapsing.
 */
export function normalizeIntlSpaces(text: string, space: ' ' | ' ' = ' '): string {
  return text.replace(intlSpaces, space);
}
