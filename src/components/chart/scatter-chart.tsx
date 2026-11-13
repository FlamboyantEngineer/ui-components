'use client';

import { memo, type ReactNode, useMemo } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { getNumberFormat } from '../../utils/intl-format.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Chart, type ChartSeries, type ChartViewProps } from './chart.js';
import { ChartAxis } from './chart-axis.js';
import { chartHooks, scatterChartHooks } from './chart-hooks.js';
import {
  type ChartHiddenKeysProps,
  ChartLegend,
  hasLegendByDefault,
  useHiddenKeys,
} from './chart-legend.js';
import { ChartPlot, useChartPoints } from './chart-points.js';
import { useScatterChartModel } from './scatter-chart-model.js';
import type { ScatterChartPoint, ScatterGeometry, ScatterMark } from './scatter-geometry.js';
import { useChartFrame } from './use-chart-box.js';

export type { ScatterChartPoint } from './scatter-geometry.js';

/** A series of a scatter chart: its observations, each with its own id. */
export interface ScatterChartSeries extends ChartSeries {
  points: readonly ScatterChartPoint[];
}

export interface ScatterChartProps
  extends
    BaseProps,
    AriaLabellingProps,
    ChartViewProps,
    ChartHiddenKeysProps,
    RefProps<HTMLDivElement> {
  /** Visible title that names the chart. Without one, name it with `aria-label` or `aria-labelledby`. */
  label?: ReactNode;
  /** The series, in the order of their colour slots. */
  series: readonly ScatterChartSeries[];
  /** Names the x axis in each observation's name, its tooltip and the table. Defaults to `x`. */
  xLabel?: string | undefined;
  /** Names the y axis in each observation's name, its tooltip and the table. Defaults to `y`. */
  yLabel?: string | undefined;
  /** Drawing height, in pixels. Defaults to 240; the width follows the container. */
  height?: number | undefined;
  /** The x value at the left edge. Defaults to a nice value at or below the lowest x. */
  minX?: number | undefined;
  /** The x value at the right edge. Defaults to a nice value at or above the highest x. */
  maxX?: number | undefined;
  /** The y value at the bottom edge. Defaults to a nice value at or below the lowest y. */
  minY?: number | undefined;
  /** The y value at the top edge. Defaults to a nice value at or above the highest y. */
  maxY?: number | undefined;
  /** How values are formatted on the axes, in names, the tooltip and the table. */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /** Replaces the generated summary of the y values. */
  summary?: string | undefined;
  /** Show the summary under the title. Defaults to `false`. */
  showSummary?: boolean | undefined;
  /** Show the legend. Defaults to `true` when there is more than one series. */
  showLegend?: boolean | undefined;
}

interface ScatterPlotProps {
  geometry: ScatterGeometry;
  width: number;
  height: number;
  series: readonly ScatterChartSeries[];
  format: Intl.NumberFormat;
  axisNames: { x: string; y: string };
}

/** An observation's name, and its coordinates for the tooltip. */
function useMarkText(series: readonly ScatterChartSeries[], props: ScatterPlotProps) {
  const strings = useUiStrings();
  const { format, axisNames } = props;
  const coordinates = (mark: ScatterMark) =>
    strings.chartCoordinates({
      xLabel: axisNames.x,
      x: format.format(mark.at),
      yLabel: axisNames.y,
      y: format.format(mark.value),
    });
  const name = (mark: ScatterMark) => {
    const seriesLabel = requireDefined(series[mark.series]).label;
    const { label } = mark.point;
    return label
      ? strings.chartValue(seriesLabel, label, coordinates(mark))
      : strings.chartPointValue(seriesLabel, coordinates(mark));
  };
  return { coordinates, name };
}

/**
 * The axes and the observations, each a focusable point named by its series and coordinates. It
 * skips a render while its inputs are unchanged.
 */
const ScatterPlot = memo(function ScatterPlot(props: ScatterPlotProps) {
  const { geometry, width, height, series } = props;
  const { plot, marks, xScale, yScale } = geometry;
  const points = useChartPoints(marks);
  const text = useMarkText(series, props);
  const active = marks.find((mark) => mark.key === points.activeKey);
  const activeSeries = active ? requireDefined(series[active.series]) : undefined;
  return (
    <ChartPlot
      width={width}
      height={height}
      points={points}
      tooltip={{
        title: active?.point.label ?? '',
        label: activeSeries?.label ?? '',
        series: active?.series ?? 0,
        tone: activeSeries?.tone,
        value: active ? text.coordinates(active) : '',
      }}
    >
      <ChartAxis
        position="left"
        offset={plot.left}
        range={[plot.bottom, plot.top]}
        ticks={yScale.ticks()}
        gridLength={plot.right - plot.left}
      />
      <ChartAxis
        position="bottom"
        offset={plot.bottom}
        range={[plot.left, plot.right]}
        ticks={xScale.ticks()}
        gridLength={plot.bottom - plot.top}
      />
      {marks.map((mark) => (
        <circle
          key={mark.key}
          {...scatterChartHooks.slot('point', {
            series: mark.series,
            tone: requireDefined(series[mark.series]).tone,
            active: mark.key === points.activeKey,
          })}
          {...points.getPointProps(mark)}
          role="img"
          aria-label={text.name(mark)}
          cx={mark.x}
          cy={mark.y}
          r={4}
        />
      ))}
    </ChartPlot>
  );
});

/**
 * A scatter chart of independent observations of one or more series on two numeric axes. Each
 * observation is a focusable point named by its series, its label and its coordinates, with a
 * tooltip; the legend shows and hides series, and the observations can be shown as a table.
 */
export function ScatterChart({
  label,
  series,
  xLabel,
  yLabel,
  height = 240,
  minX,
  maxX,
  minY,
  maxY,
  formatOptions,
  summary,
  showSummary,
  showLegend: showLegendProp,
  hiddenKeys,
  defaultHiddenKeys,
  onHiddenKeysChange,
  className,
  ref,
  ...rest
}: ScatterChartProps) {
  const strings = useUiStrings();
  const { width, element, frameRef } = useChartFrame(ref);
  const format = getNumberFormat(useLocale().locale, formatOptions);
  const [hidden, setHidden] = useHiddenKeys({ hiddenKeys, defaultHiddenKeys, onHiddenKeysChange });
  const showLegend = showLegendProp ?? hasLegendByDefault(series, hidden);
  const xName = xLabel ?? strings.chartXAxis;
  const yName = yLabel ?? strings.chartYAxis;
  // One object while the names stay, so the memoized plot skips the renders that change nothing.
  const axisNames = useMemo(() => ({ x: xName, y: yName }), [xName, yName]);
  const model = useScatterChartModel({
    element,
    series,
    hidden,
    box: { width, height },
    bounds: { minX, maxX, minY, maxY },
    format,
    formatOptions,
    axisNames,
  });
  return (
    <Chart
      {...rest}
      ref={frameRef}
      isEmpty={model.isEmpty}
      className={mergeClassNames(scatterChartHooks.className, className)}
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
      {model.isEmpty ? (
        <p {...chartHooks.slot('empty')}>{strings.noData}</p>
      ) : (
        <ScatterPlot
          geometry={model.geometry}
          width={width}
          height={height}
          series={series}
          format={format}
          axisNames={axisNames}
        />
      )}
    </Chart>
  );
}
