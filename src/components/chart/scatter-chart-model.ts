'use client';

// What a scatter chart draws and says: its geometry, table and summary.

import { useMemo } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import type { ChartTable } from './chart.js';
import { resolvePlotBox } from './chart-layout.js';
import { useValueSummary } from './chart-summary.js';
import type { ScatterChartProps, ScatterChartSeries } from './scatter-chart.js';
import {
  createScatterYScale,
  isDrawnPoint,
  resolveScatterGeometry,
  type ScatterGeometry,
  type ScatterGeometryInput,
} from './scatter-geometry.js';
import { useLabelMargin } from './use-chart-box.js';

const scatterMargin = { top: 8, right: 24, bottom: 24 };

type Bounds = Pick<ScatterChartProps, 'minX' | 'maxX' | 'minY' | 'maxY'>;

/** The observations laid out with room on the left for the widest y label, kept while unchanged. */
function useScatterGeometry(
  element: Element | null,
  input: Omit<ScatterGeometryInput, 'margin' | 'locale'>,
): ScatterGeometry {
  const { locale } = useLocale();
  const { series, width, height, minX, maxX, minY, maxY, formatOptions } = input;
  const yScale = useMemo(() => {
    const margin = { ...scatterMargin, left: 0 };
    const unmeasured = { series, width, height, margin, minY, maxY, locale, formatOptions };
    return createScatterYScale(unmeasured, resolvePlotBox(width, height, margin));
  }, [series, width, height, minY, maxY, locale, formatOptions]);
  const labels = useMemo(() => yScale.ticks().map((tick) => tick.label), [yScale]);
  const left = useLabelMargin(element, labels);
  return useMemo(() => {
    const margin = { ...scatterMargin, left };
    const bounds = { minX, maxX, minY, maxY };
    return resolveScatterGeometry(
      { series, width, height, margin, ...bounds, locale, formatOptions },
      yScale,
    );
  }, [yScale, left, series, width, height, minX, maxX, minY, maxY, locale, formatOptions]);
}

/** Every observation of every series, hidden ones included, one row each in the given order. */
function toScatterTable(
  series: readonly ScatterChartSeries[],
  text: { point: string; series: string; x: string; y: string },
  format: Intl.NumberFormat,
): ChartTable {
  const write = (value: number | null) =>
    value !== null && Number.isFinite(value) ? format.format(value) : '';
  return {
    columns: [text.point, text.series, text.x, text.y],
    rows: series.flatMap((entry) =>
      entry.points.map((point) => [
        point.label ?? String(point.id),
        entry.label,
        write(point.x),
        write(point.y),
      ]),
    ),
  };
}

interface ScatterChartModelInput {
  element: Element | null;
  series: readonly ScatterChartSeries[];
  hidden: ReadonlySet<Key>;
  box: { width: number; height: number };
  bounds: Bounds;
  format: Intl.NumberFormat;
  formatOptions: Intl.NumberFormatOptions | undefined;
  axisNames: { x: string; y: string };
}

/** The shown series laid out, the summary of their y values, and the table, built when shown. */
export function useScatterChartModel(input: ScatterChartModelInput) {
  const { element, series, hidden, box, bounds, format, formatOptions, axisNames } = input;
  const strings = useUiStrings();
  const drawn = useMemo(
    () =>
      series
        .map((entry, index) => ({ series: index, points: entry.points, id: entry.id }))
        .filter((entry) => !hidden.has(entry.id)),
    [series, hidden],
  );
  const geometry = useScatterGeometry(element, {
    series: drawn,
    ...box,
    ...bounds,
    formatOptions,
  });
  const generated = useValueSummary({
    values: geometry.marks.map((mark) => mark.value),
    series: drawn.length,
    format,
  });
  const table = () =>
    toScatterTable(
      series,
      { point: strings.chartPoint, series: strings.chartSeries, ...axisNames },
      format,
    );
  const hasDrawn = drawn.some((entry) => entry.points.some(isDrawnPoint));
  return { geometry, generated, table, isEmpty: !hasDrawn };
}
