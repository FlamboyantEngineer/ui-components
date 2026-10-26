import { summarizeNumbers } from '../../utils/summarize-numbers.js';
import { useUiStrings } from '../../core/provider.js';

interface ValueSummaryOptions {
  /** The drawn values; those that are not finite numbers are left out. */
  values: readonly number[];
  /** How many series are drawn. */
  series: number;
  format: Intl.NumberFormat;
}

/** The text that describes drawn values: how many series and values, and the lowest and highest. */
export function useValueSummary({ values, series, format }: ValueSummaryOptions): string {
  const strings = useUiStrings();
  const summary = summarizeNumbers(values);
  if (summary.count === 0) return strings.noData;
  return strings.chartSummary({
    series,
    values: summary.count,
    low: format.format(summary.min),
    high: format.format(summary.max),
  });
}
