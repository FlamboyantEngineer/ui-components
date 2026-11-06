'use client';

import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { getListFormat } from '../../utils/intl-format.js';
import { summarizeNumbers } from '../../utils/summarize-numbers.js';

interface ValueSummaryOptions {
  /** The drawn values; those that are not finite numbers are left out. */
  values: readonly number[];
  /** How many series are drawn. */
  series: number;
  format: Intl.NumberFormat;
  /** The chart's references, each already described, listed after the values. */
  references?: readonly string[] | undefined;
}

/** The text that describes drawn values: how many series and values, and the lowest and highest. */
export function useValueSummary(options: ValueSummaryOptions): string {
  const { values, series, format, references = [] } = options;
  const strings = useUiStrings();
  const { locale } = useLocale();
  const summary = summarizeNumbers(values);
  if (summary.count === 0) return strings.noData;
  const text = strings.chartSummary({
    series,
    values: summary.count,
    low: format.format(summary.min),
    high: format.format(summary.max),
  });
  if (references.length === 0) return text;
  const list = getListFormat(locale, { type: 'unit' }).format(references);
  return strings.chartSummaryReferences(text, list);
}
