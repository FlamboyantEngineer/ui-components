'use client';

// What a bar chart draws and says: its geometry, references and summary.

import { useMemo } from 'react';
import type { Key } from '../../core/props.js';
import { useLocale } from '../../primitives/index.js';
import type { BarChartProps, BarChartSeries } from './bar-chart.js';
import {
  type BarGeometry,
  type BarGeometryInput,
  createBarValueScale,
  resolveBarGeometry,
} from './bar-geometry.js';
import type { ChartTable } from './chart.js';
import { type ChartDatum, toDatum, toDatumFormatter } from './chart-format.js';
import { resolvePlotBox } from './chart-layout.js';
import { toReferenceGroup, toValueReferenceAxis, useChartReferences } from './chart-references.js';
import { useValueSummary } from './chart-summary.js';
import { useLabelMargin } from './use-chart-box.js';

const barMargin = { top: 8, right: 16, bottom: 24 };

/**
 * The bars laid out with room on the left for the widest left-axis label. The value scale and the
 * layout are kept while their inputs are unchanged, so a render for anything else reuses them.
 */
function useBarGeometry(
  element: Element | null,
  input: Omit<BarGeometryInput, 'margin' | 'locale'>,
): BarGeometry {
  const { locale } = useLocale();
  const { categories, series, layout, orientation, width, height } = input;
  const { formatOptions, formatAxisValue } = input;
  const values = useMemo(() => {
    if (orientation !== 'vertical') return undefined;
    const margin = { ...barMargin, left: 0 };
    const unmeasured = { categories, series, layout, orientation, width, height, margin, locale };
    return createBarValueScale(
      { ...unmeasured, formatOptions, formatAxisValue },
      resolvePlotBox(width, height, margin),
    );
  }, [
    categories,
    series,
    layout,
    orientation,
    width,
    height,
    locale,
    formatOptions,
    formatAxisValue,
  ]);
  const labels = useMemo(
    () => (values ? values.ticks().map((tick) => tick.label) : categories),
    [values, categories],
  );
  const left = useLabelMargin(element, labels);
  return useMemo(() => {
    const margin = { ...barMargin, left };
    const measured = { categories, series, layout, orientation, width, height, margin, locale };
    return resolveBarGeometry({ ...measured, formatOptions, formatAxisValue }, values);
  }, [
    values,
    left,
    categories,
    series,
    layout,
    orientation,
    width,
    height,
    locale,
    formatOptions,
    formatAxisValue,
  ]);
}

interface BarChartModelInput {
  element: Element | null;
  series: readonly BarChartSeries[];
  hidden: ReadonlySet<Key>;
  format: Intl.NumberFormat;
  layout: Omit<BarGeometryInput, 'series' | 'margin' | 'locale'>;
  references: BarChartProps['references'];
  formatValue: BarChartProps['formatValue'];
  categoryLabel: string;
}

/** Every series' values by category, each written by `writeValue`. */
function toBarTable(
  {
    categories,
    series,
    categoryLabel,
  }: Pick<BarChartProps, 'categories' | 'series'> & {
    categoryLabel: string;
  },
  writeValue: (datum: ChartDatum) => string,
): ChartTable {
  return {
    columns: [categoryLabel, ...series.map((entry) => entry.label)],
    rows: categories.map((category, index) => [
      category,
      ...series.map((entry, position) => {
        const value = entry.values[index];
        if (value === undefined || !Number.isFinite(value)) return '';
        return writeValue(toDatum(series, { series: position, at: category, value }));
      }),
    ]),
  };
}

/** The shown series laid out, the references placed and described, and the summary. */
export function useBarChartModel(input: BarChartModelInput) {
  const { element, series, hidden, format, layout, references } = input;
  const writeValue = useMemo(
    () => toDatumFormatter(input.formatValue, format),
    [input.formatValue, format],
  );
  const drawn = useMemo(
    () =>
      series
        .map((entry, index) => ({ series: index, values: entry.values, id: entry.id }))
        .filter((entry) => !hidden.has(entry.id)),
    [series, hidden],
  );
  const geometry = useBarGeometry(element, { ...layout, series: drawn });
  const direction = layout.orientation === 'vertical' ? 'y' : 'x';
  const groups = useMemo(
    () => [toReferenceGroup(references, toValueReferenceAxis(geometry.values, format, direction))],
    [references, geometry, format, direction],
  );
  const marks = useChartReferences(groups, geometry.plot);
  const generated = useValueSummary({
    values: geometry.bars.map((bar) => bar.value),
    series: drawn.length,
    format,
    references: marks.described,
  });
  // Built only when the table view shows.
  const table = () =>
    toBarTable(
      { categories: layout.categories, series, categoryLabel: input.categoryLabel },
      writeValue,
    );
  return { geometry, marks, generated, table, writeValue };
}
