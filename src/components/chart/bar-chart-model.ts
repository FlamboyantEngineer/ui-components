'use client';

// What a bar chart draws and says: its geometry, references and summary.

import type { Key } from '../../core/props.js';
import { useLocale } from '../../primitives/index.js';
import type { BarChartProps, BarChartSeries } from './bar-chart.js';
import {
  type BarGeometry,
  type BarGeometryInput,
  createBarValueScale,
  resolveBarGeometry,
} from './bar-geometry.js';
import { resolvePlotBox } from './chart-layout.js';
import { toReferenceGroup, toValueReferenceAxis, useChartReferences } from './chart-references.js';
import { useValueSummary } from './chart-summary.js';
import { useLabelMargin } from './use-chart-box.js';

/** The bars laid out with room on the left for the widest left-axis label. */
function useBarGeometry(
  element: Element | null,
  input: Omit<BarGeometryInput, 'margin' | 'locale'>,
): BarGeometry {
  const { locale } = useLocale();
  const margin = { top: 8, right: 16, bottom: 24 };
  const plot = resolvePlotBox(input.width, input.height, { ...margin, left: 0 });
  const values =
    input.orientation === 'vertical'
      ? createBarValueScale({ ...input, locale, margin: { ...margin, left: 0 } }, plot)
      : undefined;
  const left = useLabelMargin(
    element,
    values ? values.ticks().map((tick) => tick.label) : input.categories,
  );
  return resolveBarGeometry({ ...input, locale, margin: { ...margin, left } }, values);
}

interface BarChartModelInput {
  element: Element | null;
  series: readonly BarChartSeries[];
  hidden: ReadonlySet<Key>;
  format: Intl.NumberFormat;
  layout: Omit<BarGeometryInput, 'series' | 'margin' | 'locale'>;
  references: BarChartProps['references'];
}

/** The shown series laid out, the references placed and described, and the summary. */
export function useBarChartModel(input: BarChartModelInput) {
  const { element, series, hidden, format, layout, references } = input;
  const drawn = series
    .map((entry, index) => ({ series: index, values: entry.values, id: entry.id }))
    .filter((entry) => !hidden.has(entry.id));
  const geometry = useBarGeometry(element, { ...layout, series: drawn });
  const direction = layout.orientation === 'vertical' ? 'y' : 'x';
  const axis = toValueReferenceAxis(geometry.values, format, direction);
  const marks = useChartReferences([toReferenceGroup(references, axis)], geometry.plot);
  const generated = useValueSummary({
    values: geometry.bars.map((bar) => bar.value),
    series: drawn.length,
    format,
    references: marks.described,
  });
  return { geometry, marks, generated };
}
