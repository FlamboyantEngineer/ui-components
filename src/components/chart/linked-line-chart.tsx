'use client';

import { useMemo } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import type { ScaleInterval } from '../../utils/linear-scale.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useIdFactory } from '../../utils/use-id-factory.js';
import { Chart, type ChartProps } from './chart.js';
import { linkedChartHooks as hooks } from './chart-hooks.js';
import type { ChartPlacement } from './chart-placement.js';
import type { ChartReferenceLine } from './chart-references.js';
import { useChartViewport } from './chart-viewport.js';
import type { LinkedChartChannel } from './linked-channel.js';
import { LinkedLane } from './linked-lane.js';
import { drawChannel, getCaptureDomain, prepareChannel } from './linked-model.js';
import { LinkedReadings } from './linked-readings.js';
import type { ChartViewportProps } from './numeric-axis.js';
import { useChartFrame, useLabelMargin } from './use-chart-box.js';
import { type ChartCursorProps, useChartCursors } from './use-chart-cursors.js';

export interface LinkedLineChartProps
  extends
    Omit<ChartProps, 'children' | 'summary' | 'table' | 'legend' | 'isEmpty'>,
    ChartViewportProps,
    ChartCursorProps {
  /** Accepted entry suffixes and their multipliers in source x units. */
  xUnits?: Readonly<Record<string, number>> | undefined;
  channels: readonly LinkedChartChannel[];
  /** Height in pixels of each channel including its axes. */
  channelHeight?: number | undefined;
  /** Named stationary x references common to every channel. */
  xReferences?: readonly ChartReferenceLine[] | undefined;
  /** Movable named x markers, controlled or initially supplied. */
  markers?: readonly ChartReferenceLine[] | undefined;
  defaultMarkers?: readonly ChartReferenceLine[] | undefined;
  onMarkersChange?: ((markers: readonly ChartReferenceLine[]) => void) | undefined;
  summary?: string | undefined;
}

const noMarkers: readonly ChartReferenceLine[] = [];

function usePlacement(
  props: LinkedLineChartProps,
  model: { extent: ScaleInterval; lanes: ReturnType<typeof drawChannel>[] },
) {
  const strings = useUiStrings();
  const makeId = useIdFactory();
  const [markers, setMarkers] = useControllableState(
    props.markers,
    props.defaultMarkers ?? noMarkers,
    props.onMarkersChange,
  );
  const cursorState = useChartCursors(props, model);
  const addMarker = (x: number) => {
    const id = makeId(markers.map((m) => String(m.id)))();
    let index = markers.length + 1;
    const labels = new Set(markers.map((m) => m.label));
    while (labels.has(strings.chartMarker(String(index)))) index++;
    setMarkers([...markers, { id, label: strings.chartMarker(String(index)), value: x }]);
  };
  const placement: ChartPlacement = {
    markers,
    ...cursorState,
    addMarker,
    setMarker: (key, x) => setMarkers(markers.map((m) => (m.id === key ? { ...m, value: x } : m))),
    removeMarker: (key) => setMarkers(markers.filter((m) => m.id !== key)),
  };
  return placement;
}

function useLinkedModel(props: LinkedLineChartProps) {
  const { channels, xScale = 'linear', channelHeight = 160 } = props;
  const height = Number.isFinite(channelHeight) ? Math.max(64, channelHeight) : 160;
  const { frameRef, width, element } = useChartFrame(props.ref);
  const prepared = useMemo(
    () => channels.map((c) => prepareChannel(c, height)),
    [channels, height],
  );
  const { extent, hasData } = useMemo(() => getCaptureDomain(channels, xScale), [channels, xScale]);
  const labels = useMemo(
    () => prepared.flatMap((c) => c.y.ticks().map((t) => t.label)),
    [prepared],
  );
  const margin = useLabelMargin(element, labels);
  const left = Math.min(width / 2, Math.max(24, margin));
  const view = useChartViewport(props, extent, [left, Math.max(left + 1, width - 32)]);
  const { axis } = view;
  const lanes = useMemo(() => prepared.map((c) => drawChannel(c, axis)), [prepared, axis]);
  return { frameRef, width, extent, lanes, view, height, hasData };
}

function toCaptureTable(
  channels: readonly LinkedChartChannel[],
  axisLabel: string,
  strings: ReturnType<typeof useUiStrings>,
) {
  return {
    columns: [
      strings.chartSeries,
      axisLabel,
      strings.chartAmount,
      strings.chartLower,
      strings.chartUpper,
    ],
    rows: channels.flatMap((c) => {
      const write = (n: number | null | undefined) =>
        n == null || !Number.isFinite(n) ? '' : String(n);
      const name = c.label + (c.unit ? ' (' + c.unit + ')' : '');
      const rows = c.samples.map((p) => [
        name,
        String(p.x),
        write(p.y),
        write(p.lower),
        write(p.upper),
      ]);
      for (const p of c.reference ?? [])
        rows.push([name + ' · ' + strings.chartComparison, String(p.x), write(p.y), '', '']);
      return rows;
    }),
  };
}

export function LinkedLineChart(props: LinkedLineChartProps) {
  const {
    channels,
    channelHeight,
    xReferences = noMarkers,
    xUnits,
    visibleRange,
    defaultVisibleRange,
    onVisibleRangeChange,
    cursors,
    defaultCursors,
    cursorList,
    defaultCursorList,
    onCursorListChange,
    onCursorsChange,
    markers,
    defaultMarkers,
    onMarkersChange,
    xScale,
    formatX = String,
    xLabel,
    summary,
    ...frame
  } = props;
  const strings = useUiStrings();
  const { frameRef, width, extent, lanes, view, height, hasData } = useLinkedModel(props);
  const placement = usePlacement(props, { extent, lanes });
  const axisLabel = xLabel ?? strings.chartXAxis;
  const table = () => toCaptureTable(channels, axisLabel, strings);
  const description = [
    summary ?? channels.map((c) => c.label).join(', '),
    ...xReferences.map((r) => strings.chartReferenceLine(r.label, formatX(r.value))),
  ]
    .filter(Boolean)
    .join('. ');
  return (
    <Chart
      {...frame}
      {...hooks.root({ className: props.className, data: { 'x-scale': xScale ?? 'linear' } })}
      ref={frameRef}
      isEmpty={!hasData}
      table={table}
      summary={description || strings.noData}
    >
      {hasData ? (
        <>
          {lanes.map((lane, i) => (
            <LinkedLane
              key={toKeyIdentity(lane.channel.id)}
              lane={lane}
              placement={placement}
              width={width}
              height={height}
              view={view}
              references={xReferences}
              showX={i === lanes.length - 1}
            />
          ))}
          <span>{axisLabel}</span>
          <LinkedReadings
            lanes={lanes}
            placement={placement}
            references={xReferences}
            formatX={formatX}
            xLabel={axisLabel}
            extent={extent}
            xUnits={xUnits}
          />
        </>
      ) : (
        strings.noData
      )}
    </Chart>
  );
}
