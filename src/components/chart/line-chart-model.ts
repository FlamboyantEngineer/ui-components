'use client';

// What a line chart draws and says: its geometry, references, table axis and summary.

import type { Key } from '../../core/props.js';
import { useLocale } from '../../primitives/index.js';
import { resolvePlotBox } from './chart-layout.js';
import { toReferenceGroup, toValueReferenceAxis, useChartReferences } from './chart-references.js';
import { useValueSummary } from './chart-summary.js';
import type { LineChartProps, LineChartSeries } from './line-chart.js';
import {
  createLineValueScale,
  type LineGeometry,
  type LineGeometryInput,
  resolveLineGeometry,
} from './line-geometry.js';
import { createLineXAxis } from './line-x-axis.js';
import { useLabelMargin } from './use-chart-box.js';

/** The lines laid out with room on the left for the widest value label. */
function useLineGeometry(
  element: Element | null,
  input: Omit<LineGeometryInput, 'margin' | 'locale'>,
): LineGeometry {
  const { locale } = useLocale();
  const margin = { top: 8, right: 24, bottom: 24 };
  const plot = resolvePlotBox(input.width, input.height, { ...margin, left: 0 });
  const values = createLineValueScale({ ...input, locale, margin: { ...margin, left: 0 } }, plot);
  const left = useLabelMargin(
    element,
    values.ticks().map((tick) => tick.label),
  );
  return resolveLineGeometry({ ...input, locale, margin: { ...margin, left } }, values);
}

/**
 * The table's x axis. The table lists every series, hidden ones included, so it reads coordinates
 * from all of them, apart from the drawn axis, which an all-hidden chart leaves empty.
 */
function useTableAxis(series: readonly LineChartSeries[], timeZone: string) {
  const { locale } = useLocale();
  return createLineXAxis({
    values: series.flatMap((entry) => entry.points.map((point) => point.x)),
    range: [0, 1],
    tickCount: 0,
    timeZone,
    locale,
  });
}

interface LineChartModelInput {
  element: Element | null;
  series: readonly LineChartSeries[];
  hidden: ReadonlySet<Key>;
  box: { width: number; height: number };
  timeZone: string;
  format: Intl.NumberFormat;
  options: Pick<
    LineChartProps,
    'minValue' | 'maxValue' | 'formatOptions' | 'connectsMissing' | 'references' | 'xReferences'
  >;
}

/** The shown series laid out, their values, the references placed and described, and the summary. */
export function useLineChartModel(input: LineChartModelInput) {
  const { element, series, hidden, box, timeZone, format, options } = input;
  const drawn = series
    .map((entry, index) => ({ series: index, points: entry.points, id: entry.id }))
    .filter((entry) => !hidden.has(entry.id));
  const geometry = useLineGeometry(element, {
    series: drawn,
    ...box,
    minValue: options.minValue,
    maxValue: options.maxValue,
    timeZone,
    formatOptions: options.formatOptions,
    connectsMissing: options.connectsMissing,
  });
  const values = geometry.lines.flatMap((line) => line.points.map((point) => point.value));
  const tableAxis = useTableAxis(series, timeZone);
  const marks = useChartReferences(
    [
      toReferenceGroup(options.references, toValueReferenceAxis(geometry.values, format, 'y')),
      toReferenceGroup(options.xReferences, { ...geometry.xAxis, direction: 'x' }),
    ],
    geometry.plot,
  );
  const generated = useValueSummary({
    values,
    series: drawn.length,
    format,
    references: marks.described,
  });
  return { geometry, values, tableAxis, marks, generated };
}
