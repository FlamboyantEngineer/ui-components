'use client';

import { memo, type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { getNumberFormat } from '../../utils/intl-format.js';
import {
  type HeatmapDayFormats,
  type HeatmapLegendItem,
  useHeatmapModel,
} from './calendar-heatmap-model.js';
import { Chart, type ChartViewProps } from './chart.js';
import { calendarHeatmapHooks as hooks, chartHooks } from './chart-hooks.js';
import { ChartPlot, useChartPoints } from './chart-points.js';
import type {
  CalendarHeatmapDay,
  HeatmapCell,
  HeatmapGeometry,
  HeatmapWeekday,
} from './heatmap-geometry.js';
import { useChartFrame } from './use-chart-box.js';

export type { CalendarHeatmapDay, HeatmapWeekday } from './heatmap-geometry.js';

export interface CalendarHeatmapProps
  extends BaseProps, AriaLabellingProps, ChartViewProps, RefProps<HTMLDivElement> {
  /** Visible title that names the chart. Without one, name it with `aria-label` or `aria-labelledby`. */
  label?: ReactNode;
  /** The days' values, in any order; a repeated date keeps its first entry. */
  days: readonly CalendarHeatmapDay[];
  /** The first day drawn, `YYYY-MM-DD`. Defaults to the first given day. */
  start?: string | undefined;
  /** The last day drawn, `YYYY-MM-DD`. Defaults to the last given day. */
  end?: string | undefined;
  /** The first day of each week's column. Defaults to the locale's. */
  firstDayOfWeek?: HeatmapWeekday | undefined;
  /** The values at or below it are level 0. Defaults to zero, or the lowest value below it. */
  minValue?: number | undefined;
  /** The value that reaches the top level; higher values are outliers there. Defaults to the highest. */
  maxValue?: number | undefined;
  /** How many levels hold values above `minValue`. Defaults to 4. */
  levels?: number | undefined;
  /** The widest a day's square is, in pixels. Defaults to 14; squares shrink to fit, down to 8. */
  cellSize?: number | undefined;
  /** How values are formatted in names, the tooltip, the legend and the table. */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /** Replaces the generated summary of the values. */
  summary?: string | undefined;
  /** Show the summary under the title. Defaults to `false`. */
  showSummary?: boolean | undefined;
  /** Show the legend of levels. Defaults to `true`. */
  showLegend?: boolean | undefined;
}

/** The legend of levels: a list, each entry a swatch beside the values it stands for. */
function HeatmapLegend({ items }: { items: readonly HeatmapLegendItem[] }) {
  const strings = useUiStrings();
  return (
    <ul {...hooks.slot('legend')} aria-label={strings.heatmapLegend}>
      {items.map((item) => (
        <li key={item.key} {...hooks.slot('legend-item')}>
          <span
            {...hooks.slot('legend-swatch', { level: item.level, state: item.state ?? 'value' })}
            aria-hidden="true"
          />
          <span {...hooks.slot('legend-label')}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

interface HeatmapPlotProps {
  geometry: HeatmapGeometry;
  formats: HeatmapDayFormats;
  format: Intl.NumberFormat;
  isRtl: boolean;
}

/** A day's value as text: the number, or what stands for its absence. */
function useValueText(format: Intl.NumberFormat) {
  const strings = useUiStrings();
  return (cell: HeatmapCell) =>
    cell.value !== null
      ? format.format(cell.value)
      : cell.state === 'missing'
        ? strings.heatmapMissing
        : strings.noData;
}

/** The month and weekday names around the days, hidden from assistive technology. */
function HeatmapLabels({ geometry, formats, isRtl }: Omit<HeatmapPlotProps, 'format'>) {
  const { months, weekdays, cell, width } = geometry;
  return (
    <g aria-hidden="true">
      {months.map((month) => (
        <text
          key={month.date}
          {...hooks.slot('month')}
          x={isRtl ? month.x + cell : month.x}
          y={12}
          textAnchor="start"
        >
          {formats.month(month.date)}
        </text>
      ))}
      {weekdays.map((day, row) =>
        row % 2 === 1 ? (
          <text
            key={day.date}
            {...hooks.slot('weekday')}
            x={isRtl ? width - 4 : 4}
            y={day.y}
            dominantBaseline="central"
            textAnchor="start"
          >
            {formats.weekday(day.date)}
          </text>
        ) : null,
      )}
    </g>
  );
}

/** The days, each a focusable square named by its date and value. It skips unchanged renders. */
const HeatmapPlot = memo(function HeatmapPlot(props: HeatmapPlotProps) {
  const { geometry, formats, format } = props;
  const { cells, cell: size, width, height } = geometry;
  const points = useChartPoints(cells);
  const strings = useUiStrings();
  const valueText = useValueText(format);
  const active = cells.find((cell) => cell.key === points.activeKey);
  const title = active ? formats.day(active.key) : '';
  const value = active ? valueText(active) : '';
  return (
    <ChartPlot
      width={width}
      height={height}
      points={points}
      tooltip={{
        label: '',
        series: 0,
        tone: undefined,
        value,
        content: active ? (
          <>
            <span {...chartHooks.slot('tooltip-title')}>{title}</span>{' '}
            <span {...chartHooks.slot('tooltip-value')}>{value}</span>
          </>
        ) : null,
      }}
    >
      <HeatmapLabels {...props} />
      {cells.map((cell) => (
        <rect
          key={cell.key}
          {...hooks.slot('cell', {
            level: cell.level,
            state: cell.state,
            outlier: cell.outlier,
            active: cell.key === points.activeKey,
          })}
          {...points.getPointProps(cell)}
          role="img"
          aria-label={strings.chartPointValue(formats.day(cell.key), valueText(cell))}
          x={cell.x}
          y={cell.y}
          width={size}
          height={size}
        />
      ))}
    </ChartPlot>
  );
});

/**
 * A day-by-day view of a daily measurement over weeks or months: a week per column, a weekday
 * per row, each day's square at an intensity level. Each day is a focusable square named by its
 * date and its value, with a tooltip; the legend names each level's values, so no meaning rests
 * on colour alone, and the days can be shown as a table.
 */
export function CalendarHeatmap({
  label,
  days,
  start,
  end,
  firstDayOfWeek,
  minValue,
  maxValue,
  levels = 4,
  cellSize = 14,
  formatOptions,
  summary,
  showSummary,
  showLegend = true,
  className,
  ref,
  ...rest
}: CalendarHeatmapProps) {
  const strings = useUiStrings();
  const { width, element, frameRef } = useChartFrame(ref);
  const { locale, direction } = useLocale();
  const format = getNumberFormat(locale, formatOptions);
  const model = useHeatmapModel({
    element,
    format,
    days,
    start,
    end,
    firstDayOfWeek,
    minValue,
    maxValue,
    levels,
    cellSize,
    width,
  });
  return (
    <Chart
      {...rest}
      ref={frameRef}
      isEmpty={model.isEmpty}
      className={mergeClassNames(hooks.className, className)}
      label={label}
      summary={summary ?? model.generated}
      showSummary={showSummary}
      table={model.table}
      legend={showLegend && !model.isEmpty ? <HeatmapLegend items={model.legend} /> : null}
    >
      {model.isEmpty || !model.geometry ? (
        <p {...chartHooks.slot('empty')}>{strings.noData}</p>
      ) : (
        <HeatmapPlot
          geometry={model.geometry}
          formats={model.formats}
          format={format}
          isRtl={direction === 'rtl'}
        />
      )}
    </Chart>
  );
}
