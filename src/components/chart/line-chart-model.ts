'use client';

// What a line chart draws and says: its geometry, references, table axis and summary.

import { useMemo } from 'react';
import type { Key } from '../../core/props.js';
import { useLocale } from '../../primitives/index.js';
import { toDatumFormatter } from './chart-format.js';
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
import { toLineTable } from './line-table.js';
import { createLineXAxis } from './line-x-axis.js';
import { useLabelMargin } from './use-chart-box.js';

const lineMargin = { top: 8, right: 24, bottom: 24 };

/**
 * The lines laid out with room on the left for the widest value label. The value scale and the
 * layout are kept while their inputs are unchanged, so a render for anything else reuses them.
 */
function useLineGeometry(
  element: Element | null,
  input: Omit<LineGeometryInput, 'margin' | 'locale'>,
): LineGeometry {
  const { locale } = useLocale();
  const { series, width, height, minValue, maxValue, timeZone } = input;
  const { formatOptions, formatAxisValue, connectsMissing, downsample } = input;
  const values = useMemo(() => {
    const margin = { ...lineMargin, left: 0 };
    const unmeasured = { series, width, height, margin, minValue, maxValue, timeZone, locale };
    return createLineValueScale(
      { ...unmeasured, formatOptions, formatAxisValue },
      resolvePlotBox(width, height, margin),
    );
  }, [series, width, height, minValue, maxValue, timeZone, locale, formatOptions, formatAxisValue]);
  const labels = useMemo(() => values.ticks().map((tick) => tick.label), [values]);
  const left = useLabelMargin(element, labels);
  return useMemo(() => {
    const margin = { ...lineMargin, left };
    const measured = { series, width, height, margin, minValue, maxValue, timeZone, locale };
    return resolveLineGeometry(
      { ...measured, formatOptions, formatAxisValue, connectsMissing, downsample },
      values,
    );
  }, [
    values,
    left,
    series,
    width,
    height,
    minValue,
    maxValue,
    timeZone,
    locale,
    formatOptions,
    formatAxisValue,
    connectsMissing,
    downsample,
  ]);
}

/**
 * The table's x axis. The table lists every series, hidden ones included, so it reads coordinates
 * from all of them, apart from the drawn axis, which an all-hidden chart leaves empty.
 */
function createTableAxis(series: readonly LineChartSeries[], timeZone: string, locale: string) {
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
  options: LineChartOptions;
  categoryLabel: string;
}

/** The props that shape what a line chart draws and writes, apart from its frame. */
type LineChartOptions = Pick<LineChartProps, (typeof optionKeys)[number]>;

const optionKeys = [
  'minValue',
  'maxValue',
  'formatOptions',
  'connectsMissing',
  'downsample',
  'references',
  'xReferences',
  'formatValue',
  'formatAxisValue',
  'renderTooltip',
] as const;

/** A line chart's props split into its drawing options and the rest. */
export function splitLineChartOptions(
  props: LineChartProps,
): [LineChartOptions, Omit<LineChartProps, (typeof optionKeys)[number]>] {
  const rest: Record<string, unknown> = { ...props };
  const options: Record<string, unknown> = {};
  for (const key of optionKeys) {
    options[key] = props[key];
    delete rest[key];
  }
  return [options as LineChartOptions, rest as Omit<LineChartProps, (typeof optionKeys)[number]>];
}

/** The shown series laid out, their values, the references placed and described, and the summary. */
export function useLineChartModel(input: LineChartModelInput) {
  const { element, series, hidden, box, timeZone, format, options } = input;
  const writeValue = useMemo(
    () => toDatumFormatter(options.formatValue, format),
    [options.formatValue, format],
  );
  const { locale } = useLocale();
  const drawn = useMemo(
    () =>
      series
        .map((entry, index) => ({ series: index, points: entry.points, id: entry.id }))
        .filter((entry) => !hidden.has(entry.id)),
    [series, hidden],
  );
  const geometry = useLineGeometry(element, {
    series: drawn,
    ...box,
    minValue: options.minValue,
    maxValue: options.maxValue,
    timeZone,
    formatOptions: options.formatOptions,
    formatAxisValue: options.formatAxisValue,
    connectsMissing: options.connectsMissing,
    downsample: options.downsample,
  });
  const values = geometry.lines.flatMap((line) => line.values);
  const { references, xReferences } = options;
  const groups = useMemo(
    () => [
      toReferenceGroup(references, toValueReferenceAxis(geometry.values, format, 'y')),
      toReferenceGroup(xReferences, { ...geometry.xAxis, direction: 'x' }),
    ],
    [references, xReferences, geometry, format],
  );
  const marks = useChartReferences(groups, geometry.plot);
  const generated = useValueSummary({
    values,
    series: drawn.length,
    format,
    references: marks.described,
  });
  // Built only when the table view shows.
  const table = () =>
    toLineTable(series, {
      xAxis: createTableAxis(series, timeZone, locale),
      writeValue,
      categoryLabel: input.categoryLabel,
    });
  return { geometry, values, table, marks, generated, writeValue };
}
