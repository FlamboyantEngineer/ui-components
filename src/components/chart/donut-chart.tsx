'use client';

import type { ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useNumberFormatter } from '../../primitives/index.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Chart, type ChartSeries, type ChartViewProps } from './chart.js';
import { chartHooks, donutChartHooks } from './chart-hooks.js';
import { type ChartHiddenKeysProps, ChartLegend, useHiddenKeys } from './chart-legend.js';
import { ChartPlot, useChartPoints } from './chart-points.js';
import { type DonutGeometry, resolveDonutGeometry } from './donut-geometry.js';
import { type DonutFormats, toDonutTable } from './donut-table.js';

/** One part of a donut chart's whole. */
export interface DonutChartSegment extends ChartSeries {
  /** The segment's amount; values that are not finite, positive numbers draw no slice. */
  value: number;
}

export interface DonutChartProps
  extends
    BaseProps,
    AriaLabellingProps,
    ChartViewProps,
    ChartHiddenKeysProps,
    RefProps<HTMLDivElement> {
  /** Visible title that names the chart. Without one, name it with `aria-label` or `aria-labelledby`. */
  label?: ReactNode;
  /** The segments, clockwise from the top, in the order of their colour slots. */
  segments: readonly DonutChartSegment[];
  /** The ring's diameter, in pixels. Defaults to 160. */
  diameter?: number | undefined;
  /** How values and the total are formatted. */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /** Heads the table's column of segments. Defaults to the provider's `chartCategory` string. */
  categoryLabel?: string | undefined;
  /** Replaces the generated summary of the total and the largest segment. */
  summary?: string | undefined;
  /** Show the summary under the title. Defaults to `false`. */
  showSummary?: boolean | undefined;
  /** Show the legend. Defaults to `true`. */
  showLegend?: boolean | undefined;
}

const shareFormat: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 1 };

/** The slices around the total, each slice a focusable value with a tooltip. */
function DonutPlot({
  geometry,
  diameter,
  segments,
  formats,
}: {
  geometry: DonutGeometry;
  diameter: number;
  segments: readonly DonutChartSegment[];
  formats: DonutFormats;
}) {
  const strings = useUiStrings();
  const { slices, total } = geometry;
  const points = useChartPoints(slices.map(({ key, index }) => ({ key, index, series: 0 })));
  const active = slices.find((slice) => slice.key === points.activeKey);
  const centre = diameter / 2;
  return (
    <ChartPlot
      width={diameter}
      height={diameter}
      points={points}
      tooltip={{
        label: active ? requireDefined(segments[active.series]).label : '',
        series: active?.series ?? 0,
        tone: active ? requireDefined(segments[active.series]).tone : undefined,
        value: active
          ? strings.donutValue(
              formats.value.format(active.value),
              formats.share.format(active.share),
            )
          : '',
      }}
    >
      {slices.map((slice) => {
        const segment = requireDefined(segments[slice.series]);
        return (
          <path
            key={slice.key}
            {...donutChartHooks.slot('slice', {
              series: slice.series,
              tone: segment.tone,
              active: slice.key === points.activeKey,
            })}
            {...points.getPointProps({ key: slice.key, index: slice.index, series: 0 })}
            role="img"
            aria-label={strings.donutSegment(
              segment.label,
              formats.value.format(slice.value),
              formats.share.format(slice.share),
            )}
            d={slice.path}
          />
        );
      })}
      <text
        {...donutChartHooks.slot('total')}
        x={centre}
        y={centre}
        textAnchor="middle"
        dominantBaseline="middle"
        aria-hidden="true"
      >
        {strings.totalCount(formats.value.format(total))}
      </text>
    </ChartPlot>
  );
}

/**
 * A donut chart of the parts of a whole, with the total in the middle. Each slice is a named,
 * focusable value with a tooltip; the legend shows and hides segments, and the values can be shown
 * as a table.
 */
export function DonutChart({
  label,
  segments,
  diameter = 160,
  formatOptions,
  categoryLabel,
  summary,
  showSummary,
  showLegend = true,
  hiddenKeys,
  defaultHiddenKeys,
  onHiddenKeysChange,
  className,
  ...rest
}: DonutChartProps) {
  const strings = useUiStrings();
  const formats = {
    value: useNumberFormatter(formatOptions),
    share: useNumberFormatter(shareFormat),
  };
  const [hidden, setHidden] = useHiddenKeys({ hiddenKeys, defaultHiddenKeys, onHiddenKeysChange });
  const geometry = resolveDonutGeometry({
    values: segments
      .map(({ value, id }, series) => ({ series, value, id }))
      .filter(({ id }) => !hidden.has(id)),
    diameter,
  });
  const largest = geometry.slices.reduce<DonutGeometry['slices'][number] | undefined>(
    (best, slice) => (!best || slice.value > best.value ? slice : best),
    undefined,
  );
  const generated = largest
    ? strings.donutSummary(
        formats.value.format(geometry.total),
        requireDefined(segments[largest.series]).label,
        formats.share.format(largest.share),
      )
    : strings.noData;
  return (
    <Chart
      {...rest}
      isEmpty={!largest}
      className={mergeClassNames(donutChartHooks.className, className)}
      label={label}
      summary={summary ?? generated}
      showSummary={showSummary}
      table={toDonutTable(segments, {
        formats,
        headings: [categoryLabel ?? strings.chartCategory, strings.chartAmount, strings.chartShare],
      })}
      legend={
        showLegend ? (
          <ChartLegend items={segments} hiddenKeys={hidden} onHiddenKeysChange={setHidden} />
        ) : null
      }
    >
      {largest ? (
        <DonutPlot geometry={geometry} diameter={diameter} segments={segments} formats={formats} />
      ) : (
        <p {...chartHooks.slot('empty')}>{strings.noData}</p>
      )}
    </Chart>
  );
}
