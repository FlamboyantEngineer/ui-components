import { useLocale } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';

export interface ValueSummaryOptions {
  /** The drawn values; those that are not finite numbers are left out. */
  values: readonly number[];
  /** How many series are drawn. */
  series: number;
  format: Intl.NumberFormat;
}

/** A number format for the provider's locale. */
export function useNumberFormat(formatOptions: Intl.NumberFormatOptions | undefined) {
  const { locale } = useLocale();
  return new Intl.NumberFormat(locale, formatOptions);
}

/** The text that describes drawn values: how many series and values, and the lowest and highest. */
export function useValueSummary({ values, series, format }: ValueSummaryOptions): string {
  const strings = useUiStrings();
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return strings.noData;
  return strings.chartSummary({
    series,
    values: finite.length,
    low: format.format(Math.min(...finite)),
    high: format.format(Math.max(...finite)),
  });
}
