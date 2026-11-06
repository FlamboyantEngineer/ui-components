'use client';

import type { ReactNode } from 'react';
import { useTimeZone } from '../../core/clock.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useNumberFormatter } from '../../primitives/index.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Chart, type ChartSeries, type ChartViewProps } from './chart.js';
import { ChartAxis } from './chart-axis.js';
import { type ChartDatum, type ChartFormatProps, toDatum, toTooltipText } from './chart-format.js';
import { chartHooks, lineChartHooks } from './chart-hooks.js';
import {
  type ChartHiddenKeysProps,
  ChartLegend,
  hasLegendByDefault,
  useHiddenKeys,
} from './chart-legend.js';
import { ChartPlot, useChartPoints } from './chart-points.js';
import { type ChartReference, ChartReferences, type PlacedReference } from './chart-references.js';
import { splitLineChartOptions, useLineChartModel } from './line-chart-model.js';
import type { LineChartPoint, LineGeometry } from './line-geometry.js';
import type { LineChartX } from './line-x-axis.js';
import { useChartFrame } from './use-chart-box.js';

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
    ChartFormatProps<LineChartX>,
    RefProps<HTMLDivElement> {
  /** Visible title that names the chart. Without one, name it with `aria-label` or `aria-labelledby`. */
  label?: ReactNode;
  /** The series, in the order of their colour slots. Dates make a time axis; numbers a linear one. */
  series: readonly LineChartSeries[];
  /** Lines, or lines over filled areas. Defaults to `line`. */
  variant?: LineChartVariant | undefined;
  /**
   * Draws lines and areas straight across missing values (`null` or not a finite number) instead
   * of breaking them there. Missing values still draw no point and count as no value.
   */
  connectsMissing?: boolean | undefined;
  /** Lines and bands at values of the value axis; they do not stretch it, and the plot cuts them. */
  references?: readonly ChartReference[] | undefined;
  /** Lines and bands at x values, read as the x axis reads its points. */
  xReferences?: readonly ChartReference<LineChartX>[] | undefined;
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
  /** Writes each value, given its datum. */
  writeValue: (datum: ChartDatum<LineChartX>) => string;
  renderTooltip: ChartFormatProps<LineChartX>['renderTooltip'];
  references: readonly PlacedReference[];
}

/** The hook data that ties a line, area or point to its series. */
function toSeriesData(series: readonly LineChartSeries[], index: number) {
  return { series: index, tone: requireDefined(series[index]).tone };
}

/** The axes, areas, lines and points, each point a focusable value with a tooltip. */
function LinePlot(props: LinePlotProps) {
  const { geometry, width, height, series, variant, writeValue, references } = props;
  const strings = useUiStrings();
  const { plot, lines, xAxis, yTicks } = geometry;
  const all = lines.flatMap((line) => line.points);
  const points = useChartPoints(all);
  const active = all.find((point) => point.key === points.activeKey);
  const write = (point: (typeof all)[number]) => writeValue(toDatum(series, point));
  return (
    <ChartPlot
      width={width}
      height={height}
      points={points}
      tooltip={toTooltipText({
        active,
        series,
        writeAt: xAxis.format,
        writeValue,
        renderTooltip: props.renderTooltip,
      })}
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
      <ChartReferences placed={references} />
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
            write(point),
          )}
          cx={point.x}
          cy={point.y}
          r={3}
        />
      ))}
    </ChartPlot>
  );
}

/**
 * A line chart of one or more series over dates (a time axis) or numbers (a linear axis), drawn as
 * lines or filled areas. Each point is a named, focusable value with a tooltip; the legend shows
 * and hides series, and the values can be shown as a table.
 */
export function LineChart(props: LineChartProps) {
  const [options, chartProps] = splitLineChartOptions(props);
  const {
    label,
    series,
    variant = 'line',
    height = 240,
    timeZone: timeZoneProp,
    categoryLabel,
    summary,
    showSummary,
    showLegend: showLegendProp,
    hiddenKeys,
    defaultHiddenKeys,
    onHiddenKeysChange,
    className,
    ref,
    ...rest
  } = chartProps;
  const strings = useUiStrings();
  const timeZone = useTimeZone(timeZoneProp);
  const { width, element, frameRef } = useChartFrame(ref);
  const format = useNumberFormatter(options.formatOptions);
  const [hidden, setHidden] = useHiddenKeys({ hiddenKeys, defaultHiddenKeys, onHiddenKeysChange });
  const showLegend = showLegendProp ?? hasLegendByDefault(series, hidden);
  const model = useLineChartModel({
    element,
    series,
    hidden,
    box: { width, height },
    timeZone,
    format,
    options,
    categoryLabel: categoryLabel ?? strings.chartCategory,
  });
  const isEmpty = model.values.length === 0;
  return (
    <Chart
      {...rest}
      ref={frameRef}
      data-variant={variant}
      isEmpty={isEmpty}
      className={mergeClassNames(lineChartHooks.className, className)}
      label={label}
      summary={summary ?? model.generated}
      showSummary={showSummary}
      table={model.table}
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
          geometry={model.geometry}
          width={width}
          height={height}
          series={series}
          variant={variant}
          writeValue={model.writeValue}
          renderTooltip={options.renderTooltip}
          references={model.marks.placed}
        />
      )}
    </Chart>
  );
}
