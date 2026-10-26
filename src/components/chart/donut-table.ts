import type { ChartTable } from './chart.js';
import type { DonutChartSegment } from './donut-chart.js';
import { resolveAmountShares } from '../../utils/resolve-amount-shares.js';

export interface DonutFormats {
  value: Intl.NumberFormat;
  share: Intl.NumberFormat;
}

/** Every segment's value and share of the whole, hidden ones included, in linear passes. */
export function toDonutTable(
  segments: readonly DonutChartSegment[],
  { formats, headings }: { formats: DonutFormats; headings: readonly string[] },
): ChartTable {
  const { amounts } = resolveAmountShares(segments, ({ value }) => value);
  return {
    columns: headings,
    rows: amounts.map(({ item, value, share }) => [
      item.label,
      formats.value.format(value),
      formats.share.format(share),
    ]),
  };
}
