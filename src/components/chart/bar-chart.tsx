'use client';

import type { ReactNode, Ref } from 'react';
import { useLocale, useNumberFormatter } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, Orientation } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
import {
  createBarValueScale,
  resolveBarGeometry,
  type BarChartLayout,
  type BarGeometry,
  type BarGeometryInput,
} from './bar-geometry.js';
import { Chart, type ChartSeries, type ChartTable, type ChartViewProps } from './chart.js';
import { resolvePlotBox } from './chart-layout.js';
import { ChartAxis } from './chart-axis.js';
import { barChartHooks, chartHooks } from './chart-hooks.js';
import { ChartLegend, useHiddenKeys, type ChartHiddenKeysProps } from './chart-legend.js';
import { ChartPlot, useChartPoints } from './chart-points.js';
import { useValueSummary } from './chart-summary.js';
import { useChartFrame, useLabelMargin } from './use-chart-box.js';

export type { BarChartLayout } from './bar-geometry.js';

/** A series of a bar chart: one value per category, in the order of the categories. */
export interface BarChartSeries extends ChartSeries {
  /** Values that are not finite numbers draw no bar. */
  values: readonly number[];
}

export interface BarChartProps
  extends BaseProps, AriaLabellingProps, ChartViewProps, ChartHiddenKeysProps {
  /** Visible title that names the chart. Without one, name it with `aria-label` or `aria-labelledby`. */
  label?: ReactNode;
  /** The categories along the category axis, each named once. */
  categories: readonly string[];
  /** The series, in the order of their colour slots. */
  series: readonly BarChartSeries[];
  /** `grouped` bars side by side or `stacked` into one bar per category. Defaults to `grouped`. */
  layout?: BarChartLayout | undefined;
  /** `vertical` bars rise from the bottom; `horizontal` bars grow from the left. Defaults to `vertical`. */
  orientation?: Orientation | undefined;
  /** Drawing height, in pixels. Defaults to 240; the width follows the container. */
  height?: number | undefined;
  /** How values are formatted on the axis, in names, the tooltip and the table. */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /** Heads the table's column of categories. Defaults to the provider's `chartCategory` string. */
  categoryLabel?: string | undefined;
  /** Replaces the generated summary of the values. */
  summary?: string | undefined;
  /** Show the summary under the title. Defaults to `false`. */
  showSummary?: boolean | undefined;
  /** Show the legend. Defaults to `true` when there is more than one series. */
  showLegend?: boolean | undefined;
  /** The root element. */
  ref?: Ref<HTMLDivElement> | undefined;
}

interface BarPlotProps {
  geometry: BarGeometry;
  width: number;
  height: number;
  categories: readonly string[];
  series: readonly BarChartSeries[];
  orientation: Orientation;
  format: Intl.NumberFormat;
}

/** The axes and the bars, each bar a focusable value with a tooltip. */
function BarPlot({
  geometry,
  width,
  height,
  categories,
  series,
  orientation,
  format,
}: BarPlotProps) {
  const strings = useUiStrings();
  const isVertical = orientation === 'vertical';
  const points = useChartPoints(geometry.bars, !isVertical);
  const { plot, bars, values, bands } = geometry;
  const active = bars.find((bar) => bar.key === points.activeKey);
  const valueAxis = isVertical
    ? { position: 'left' as const, offset: plot.left, range: [plot.bottom, plot.top] as const }
    : { position: 'bottom' as const, offset: plot.bottom, range: [plot.left, plot.right] as const };
  const categoryAxis = isVertical
    ? { position: 'bottom' as const, offset: plot.bottom, range: [plot.left, plot.right] as const }
    : { position: 'left' as const, offset: plot.left, range: [plot.top, plot.bottom] as const };
  return (
    <ChartPlot
      width={width}
      height={height}
      points={points}
      tooltip={{
        title: active ? requireDefined(categories[active.index]) : '',
        label: active ? requireDefined(series[active.series]).label : '',
        series: active?.series ?? 0,
        tone: active ? requireDefined(series[active.series]).tone : undefined,
        value: active ? format.format(active.value) : '',
      }}
    >
      <ChartAxis
        {...valueAxis}
        ticks={values.ticks()}
        gridLength={isVertical ? plot.right - plot.left : plot.bottom - plot.top}
      />
      <ChartAxis {...categoryAxis} ticks={bands.ticks()} />
      {bars.map((bar) => {
        const entry = requireDefined(series[bar.series]);
        return (
          <rect
            key={bar.key}
            {...barChartHooks.slot('bar', {
              series: bar.series,
              tone: entry.tone,
              active: bar.key === points.activeKey,
            })}
            {...points.getPointProps(bar)}
            role="img"
            aria-label={strings.chartValue(
              entry.label,
              requireDefined(categories[bar.index]),
              format.format(bar.value),
            )}
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={bar.height}
          />
        );
      })}
    </ChartPlot>
  );
}

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

function toBarTable(
  {
    categories,
    series,
    categoryLabel,
  }: Pick<BarChartProps, 'categories' | 'series'> & {
    categoryLabel: string;
  },
  format: Intl.NumberFormat,
): ChartTable {
  return {
    columns: [categoryLabel, ...series.map((entry) => entry.label)],
    rows: categories.map((category, index) => [
      category,
      ...series.map((entry) => {
        const value = entry.values[index];
        return value !== undefined && Number.isFinite(value) ? format.format(value) : '';
      }),
    ]),
  };
}

/**
 * A bar chart of one or more series over categories, grouped or stacked, vertical or horizontal,
 * on a value axis that starts at zero. Each bar is a named, focusable value with a tooltip; the
 * legend shows and hides series, and the values can be shown as a table.
 */
export function BarChart({
  label,
  categories,
  series,
  layout = 'grouped',
  orientation = 'vertical',
  height = 240,
  formatOptions,
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
}: BarChartProps) {
  const strings = useUiStrings();
  const { width, element, frameRef } = useChartFrame(ref);
  const format = useNumberFormatter(formatOptions);
  const [hidden, setHidden] = useHiddenKeys({ hiddenKeys, defaultHiddenKeys, onHiddenKeysChange });
  const drawn = series
    .map((entry, index) => ({ series: index, values: entry.values, id: entry.id }))
    .filter((entry) => !hidden.has(entry.id));
  const geometry = useBarGeometry(element, {
    categories,
    series: drawn,
    layout,
    orientation,
    width,
    height,
    formatOptions,
  });
  const generated = useValueSummary({
    values: geometry.bars.map((bar) => bar.value),
    series: drawn.length,
    format,
  });
  const isEmpty = geometry.bars.length === 0;
  return (
    <Chart
      {...rest}
      ref={frameRef}
      data-layout={layout}
      data-orientation={orientation}
      isEmpty={isEmpty}
      className={mergeClassNames(barChartHooks.className, className)}
      label={label}
      summary={summary ?? generated}
      showSummary={showSummary}
      table={toBarTable(
        { categories, series, categoryLabel: categoryLabel ?? strings.chartCategory },
        format,
      )}
      legend={
        showLegend ? (
          <ChartLegend items={series} hiddenKeys={hidden} onHiddenKeysChange={setHidden} />
        ) : null
      }
    >
      {isEmpty ? (
        <p {...chartHooks.slot('empty')}>{strings.noData}</p>
      ) : (
        <BarPlot
          geometry={geometry}
          width={width}
          height={height}
          categories={categories}
          series={series}
          orientation={orientation}
          format={format}
        />
      )}
    </Chart>
  );
}
