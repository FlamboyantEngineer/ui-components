'use client';

import { type ReactNode, useMemo } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Chart, type ChartProps } from './chart.js';
import { ChartAxis } from './chart-axis.js';
import { eventChartHooks as hooks } from './chart-hooks.js';
import { ChartPlot, useChartPoints } from './chart-points.js';
import { type NumericViewport, useChartViewport, ViewportSurface } from './chart-viewport.js';
import { type ChartViewportProps, findAxisExtent, isAxisValue } from './numeric-axis.js';
import { useChartFrame } from './use-chart-box.js';

export interface EventChartItem {
  /** Stable identity, including when several events have identical coordinates. */
  id: Key;
  label: string;
  start: number;
  /** An interval ends here, inclusively. Omit for a point. */
  end?: number | undefined;
}

export interface EventChartProps
  extends
    Omit<ChartProps, 'table' | 'children' | 'summary' | 'legend' | 'isEmpty'>,
    ChartViewportProps {
  events: readonly EventChartItem[];
  /** Replaces the generated accessible summary. */
  summary?: string | undefined;
  /** Tooltip content from the original event. Its accessible name still includes the exact coordinates. */
  renderDetails?: ((event: EventChartItem) => ReactNode) | undefined;
}

function formatEventValue(value: number, format: ((value: number) => string) | undefined) {
  const raw = String(value);
  const label = format?.(value) ?? raw;
  return label === raw ? raw : label + ' (' + raw + ')';
}

interface EventPlotProps {
  events: readonly EventChartItem[];
  view: NumericViewport;
  width: number;
  label: string;
  formatX: EventChartProps['formatX'];
  renderDetails: EventChartProps['renderDetails'];
}

function EventPlot({ events, view, width, label, formatX, renderDetails }: EventPlotProps) {
  const { axis } = view;
  const [left, right] = axis.range;
  const points = events
    .filter((e) => e.start <= axis.domain[1] && (e.end ?? e.start) >= axis.domain[0])
    .map((event, index) => ({
      event,
      key: toKeyIdentity(event.id),
      index,
      series: 0,
      position: event.start,
    }));
  const focus = useChartPoints(points);
  const active = points.find((p) => p.key === focus.activeKey)?.event;
  const detail = (e: EventChartItem) =>
    [
      formatEventValue(e.start, formatX),
      ...(e.end === undefined ? [] : [formatEventValue(e.end, formatX)]),
    ].join(' – ');
  return (
    <ViewportSurface view={view} label={label}>
      <ChartPlot
        width={width}
        height={80}
        points={focus}
        tooltip={{
          label: active?.label ?? '',
          value: active ? detail(active) : '',
          series: 0,
          tone: undefined,
          content: active ? renderDetails?.(active) : undefined,
        }}
      >
        <ChartAxis position="bottom" ticks={axis.ticks()} offset={46} range={axis.range} />
        {points.map((point) => {
          const { event } = point;
          const pos = Math.max(left, axis.map(event.start));
          const props = {
            ...hooks.slot('event', { active: point.key === focus.activeKey }),
            ...focus.getPointProps(point),
            role: 'img',
            'aria-label': event.label + ', ' + detail(event),
          };
          return event.end === undefined || event.end === event.start ? (
            <circle key={point.key} {...props} cx={pos} cy={25} r={5} />
          ) : (
            <rect
              key={point.key}
              {...props}
              x={pos}
              y={20}
              height={10}
              width={Math.max(1, Math.min(right, axis.map(event.end)) - pos)}
            />
          );
        })}
      </ChartPlot>
    </ViewportSurface>
  );
}

function orderEvents(events: readonly EventChartItem[]) {
  return events
    .filter(
      (e) =>
        Number.isFinite(e.start) &&
        (e.end === undefined || (Number.isFinite(e.end) && e.end >= e.start)),
    )
    .sort((a, b) => a.start - b.start);
}

export function EventChart({
  events,
  renderDetails,
  xScale = 'linear',
  visibleRange,
  defaultVisibleRange,
  onVisibleRangeChange,
  formatX,
  xLabel,
  summary,
  ref,
  className,
  ...rest
}: EventChartProps) {
  const strings = useUiStrings();
  const { width, frameRef } = useChartFrame(ref);
  const valid = useMemo(() => orderEvents(events), [events]);
  const drawable = useMemo(
    () => valid.filter((e) => isAxisValue(e.start, xScale)),
    [valid, xScale],
  );
  const extent = useMemo(
    () =>
      findAxisExtent(
        drawable.flatMap((e) => [e.start, e.end ?? e.start]),
        xScale,
      ),
    [drawable, xScale],
  );
  const label = xLabel ?? strings.chartXAxis;
  const view = useChartViewport(
    { xScale, visibleRange, defaultVisibleRange, onVisibleRangeChange, formatX },
    extent,
    [24, Math.max(25, width - 36)],
  );
  const table = () => ({
    columns: [strings.chartPoint, strings.timelineStartColumn, strings.timelineEndColumn],
    rows: valid.map((e) => [
      e.label,
      formatEventValue(e.start, formatX),
      e.end === undefined ? '' : formatEventValue(e.end, formatX),
    ]),
  });
  return (
    <Chart
      {...rest}
      {...hooks.root({ className, data: { 'x-scale': xScale } })}
      ref={frameRef}
      isEmpty={!drawable.length}
      table={table}
      summary={summary ?? strings.timelineItemCount(valid.length)}
    >
      {drawable.length ? (
        <>
          <EventPlot
            events={drawable}
            view={view}
            width={width}
            label={label}
            formatX={formatX}
            renderDetails={renderDetails}
          />
          <span>{label}</span>
        </>
      ) : (
        strings.noData
      )}
    </Chart>
  );
}
