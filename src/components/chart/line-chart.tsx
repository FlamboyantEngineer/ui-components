'use client';

import type { ReactNode } from 'react';
import { useLocale, useNumberFormatter } from '../../primitives/index.js';
import { useTimeZone } from '../../core/clock.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Chart, type ChartSeries, type ChartViewProps } from './chart.js';
import { ChartAxis } from './chart-axis.js';
import { chartHooks, lineChartHooks } from './chart-hooks.js';
import { ChartLegend, useHiddenKeys, type ChartHiddenKeysProps } from './chart-legend.js';
import { ChartPlot, useChartPoints } from './chart-points.js';
import { useValueSummary } from './chart-summary.js';
import {
  createLineValueScale,
  resolveLineGeometry,
  type LineChartPoint,
  type LineGeometry,
  type LineGeometryInput,
} from './line-geometry.js';
import { resolvePlotBox } from './chart-layout.js';
import { toLineTable } from './line-table.js';
import { useChartFrame, useLabelMargin } from './use-chart-box.js';

export type { LineChartPoint } from './line-geometry.js';
export type { LineChartX } from './line-x-axis.js';

/** `line` draws each series as a line; `area` also fills the space under it. */
export type LineChartVariant = 'line' | 'area';

/** A series of a line chart: its values, in any order of x. */
export interface LineChartSeries extends ChartSeries {
  points: readonly LineChartPoint[];
}

export interface LineChartProps
  extends
    BaseProps,
    AriaLabellingProps,
    ChartViewProps,
    ChartHiddenKeysProps,
    RefProps<HTMLDivElement> {
  /** Visible title that names the chart. Without one, name it with `aria-label` or `aria-labelledby`. */
  label?: ReactNode;
  /** The series, in the order of their colour slots. Dates make a time axis; numbers a linear one. */
  series: readonly LineChartSeries[];
  /** Lines, or lines over filled areas. Defaults to `line`. */
  variant?: LineChartVariant | undefined;
  /** Drawing height, in pixels. Defaults to 240; the width follows the container. */
  height?: number | undefined;
  /** The value at the bottom edge. Defaults to a nice value at or below zero and the lowest value. */
  minValue?: number | undefined;
  /** The value at the top edge. Defaults to a nice value at or above zero and the highest value. */
  maxValue?: number | undefined;
  /** How values are formatted on the axis, in names, the tooltip and the table. */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /**
   * The IANA time zone that reads dates and places date ticks. Defaults to the provider's, else the
   * browser's once hydrated (UTC on a server and while hydrating).
   */
  timeZone?: string | undefined;
  /** Heads the table's column of x values. Defaults to the provider's `chartCategory` string. */
  categoryLabel?: string | undefined;
  /** Replaces the generated summary of the values. */
  summary?: string | undefined;
  /** Show the summary under the title. Defaults to `false`. */
  showSummary?: boolean | undefined;
  /** Show the legend. Defaults to `true` when there is more than one series. */
  showLegend?: boolean | undefined;
}

interface LinePlotProps {
  geometry: LineGeometry;
  width: number;
  height: number;
  series: readonly LineChartSeries[];
  variant: LineChartVariant;
  format: Intl.NumberFormat;
}

/** The hook data that ties a line, area or point to its series. */
function toSeriesData(series: readonly LineChartSeries[], index: number) {
  return { series: index, tone: requireDefined(series[index]).tone };
}

/** The axes, areas, lines and points, each point a focusable value with a tooltip. */
function LinePlot({ geometry, width, height, series, variant, format }: LinePlotProps) {
  const strings = useUiStrings();
  const { plot, lines, xAxis, yTicks } = geometry;
  const all = lines.flatMap((line) => line.points);
  const points = useChartPoints(all);
  const active = all.find((point) => point.key === points.activeKey);
  const activeSeries = active ? requireDefined(series[active.series]) : undefined;
  return (
    <ChartPlot
      width={width}
      height={height}
      points={points}
      tooltip={{
        title: active ? xAxis.format(active.at) : '',
        label: activeSeries?.label ?? '',
        series: active?.series ?? 0,
        tone: activeSeries?.tone,
        value: active ? format.format(active.value) : '',
      }}
    >
      <ChartAxis
        position="left"
        offset={plot.left}
        range={[plot.bottom, plot.top]}
        ticks={yTicks}
        gridLength={plot.right - plot.left}
      />
      <ChartAxis
        position="bottom"
        offset={plot.bottom}
        range={[plot.left, plot.right]}
        ticks={xAxis.ticks}
      />
      {variant === 'area'
        ? lines.map((line) => (
            <path
              key={`area:${line.key}`}
              {...lineChartHooks.slot('area', toSeriesData(series, line.series))}
              d={line.area}
            />
          ))
        : null}
      {lines.map((line) => (
        <path
          key={`line:${line.key}`}
          {...lineChartHooks.slot('line', toSeriesData(series, line.series))}
          d={line.line}
          fill="none"
        />
      ))}
      {all.map((point) => (
        <circle
          key={point.key}
          {...lineChartHooks.slot('point', {
            ...toSeriesData(series, point.series),
            active: point.key === points.activeKey,
          })}
          {...points.getPointProps(point)}
          role="img"
          aria-label={strings.chartValue(
            requireDefined(series[point.series]).label,
            xAxis.format(point.at),
            format.format(point.value),
          )}
          cx={point.x}
          cy={point.y}
          r={3}
        />
      ))}
    </ChartPlot>
  );
}

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
 * A line chart of one or more series over dates (a time axis) or numbers (a linear axis), drawn as
 * lines or filled areas. Each point is a named, focusable value with a tooltip; the legend shows
 * and hides series, and the values can be shown as a table.
 */
export function LineChart({
  label,
  series,
  variant = 'line',
  height = 240,
  minValue,
  maxValue,
  formatOptions,
  timeZone: timeZoneProp,
  categoryLabel,
  summary,
  showSummary,
  showLegend = series.length > 1,
  hiddenKeys,
  defaultHiddenKeys,
  onHiddenKeysChange,
  className,
  ref,
  ...rest
}: LineChartProps) {
  const strings = useUiStrings();
  const timeZone = useTimeZone(timeZoneProp);
  const { width, element, frameRef } = useChartFrame(ref);
  const format = useNumberFormatter(formatOptions);
  const [hidden, setHidden] = useHiddenKeys({ hiddenKeys, defaultHiddenKeys, onHiddenKeysChange });
  const drawn = series
    .map((entry, index) => ({ series: index, points: entry.points, id: entry.id }))
    .filter((entry) => !hidden.has(entry.id));
  const geometry = useLineGeometry(element, {
    series: drawn,
    width,
    height,
    minValue,
    maxValue,
    timeZone,
    formatOptions,
  });
  const values = geometry.lines.flatMap((line) => line.points.map((point) => point.value));
  const generated = useValueSummary({ values, series: drawn.length, format });
  const isEmpty = values.length === 0;
  return (
    <Chart
      {...rest}
      ref={frameRef}
      data-variant={variant}
      isEmpty={isEmpty}
      className={mergeClassNames(lineChartHooks.className, className)}
      label={label}
      summary={summary ?? generated}
      showSummary={showSummary}
      table={toLineTable(series, {
        xAxis: geometry.xAxis,
        format,
        categoryLabel: categoryLabel ?? strings.chartCategory,
      })}
      legend={
        showLegend ? (
          <ChartLegend items={series} hiddenKeys={hidden} onHiddenKeysChange={setHidden} />
        ) : null
      }
    >
      {isEmpty ? (
        <p {...chartHooks.slot('empty')}>{strings.noData}</p>
      ) : (
        <LinePlot
          geometry={geometry}
          width={width}
          height={height}
          series={series}
          variant={variant}
          format={format}
        />
      )}
    </Chart>
  );
}
