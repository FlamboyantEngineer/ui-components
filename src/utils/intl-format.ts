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

/** Formats dates and date ranges. */
interface DateFormat {
  format: (date: Date) => string;
  formatRange: (start: Date, end: Date) => string;
}

/** A shared React Aria `DateFormatter`, which corrects the hour cycle of some locales. */
export const getDateFormatter = createFormatCache<string, Intl.DateTimeFormatOptions, DateFormat>(
  (locale, options) => new DateFormatter(locale, options),
);

/** A shared `Intl.DateTimeFormat`. */
export const getDateTimeFormat = createFormatCache<
  string | undefined,
  Intl.DateTimeFormatOptions,
  Intl.DateTimeFormat
>((locale, options) => new Intl.DateTimeFormat(locale, options));

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
