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
import { useChannelVisibility } from './linked-legend.js';
import { type LinkedChartMeasurements, measurementRows } from './linked-measurements.js';
import { drawChannel, getCaptureDomain, prepareChannel, readCursors } from './linked-model.js';
import { LinkedReadings } from './linked-readings.js';
import type { ChartViewportProps } from './numeric-axis.js';
import { useChartFrame, useLabelMargin } from './use-chart-box.js';
import { type ChartCursorProps, useChartCursors } from './use-chart-cursors.js';
import { useReadingSelection } from './use-reading-selection.js';

export interface LinkedLineChartProps
  extends
    Omit<ChartProps, 'children' | 'summary' | 'table' | 'legend' | 'isEmpty'>,
    ChartViewportProps,
    ChartCursorProps {
  /** Accepted entry suffixes and their multipliers in source x units. */
  xUnits?: Readonly<Record<string, number>> | undefined;
  /** Additional readout rows, supplied directly or calculated from the current capture and cursors. */
  measurements?: LinkedChartMeasurements | undefined;
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
  const selection = useReadingSelection();
  const cursorState = useChartCursors(props, model, (name) => selection.select('cursor:' + name));
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
    selection,
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

function chartSummary(
  { channels, summary, formatX = String, xReferences = noMarkers }: LinkedLineChartProps,
  strings: ReturnType<typeof useUiStrings>,
) {
  const parts = [
    summary ?? channels.map((channel) => channel.label).join(', '),
    ...xReferences.map((reference) =>
      strings.chartReferenceLine(reference.label, formatX(reference.value)),
    ),
  ];
  return parts.filter(Boolean).join('. ') || strings.noData;
}

function CaptureView({
  props,
  model,
  placement,
  visibility,
}: {
  props: LinkedLineChartProps;
  model: ReturnType<typeof useLinkedModel>;
  placement: ChartPlacement;
  visibility: ReturnType<typeof useChannelVisibility>;
}) {
  const { view, width, height, lanes, extent } = model;
  const strings = useUiStrings();
  const { xLabel = strings.chartXAxis, formatX = String, xReferences = noMarkers } = props;
  const xTicks = useMemo(() => view.axis.ticks(), [view.axis]);
  const readout = readCursors(lanes, placement.cursors);
  const extra = measurementRows(props.measurements, lanes, {
    pair: placement.hasPair ? readout : null,
    cursors: placement.cursorList,
    markers: placement.markers,
    xReferences,
    visibleRange: view.axis.domain,
  });
  const highlights = extra.find((row) => row.key === placement.selection.current)?.highlights ?? [];
  return (
    <>
      {lanes.map((lane) => (
        <LinkedLane
          key={toKeyIdentity(lane.channel.id)}
          lane={lane}
          visibility={visibility(lane.channel)}
          width={width}
          height={height}
          view={view}
          placement={placement}
          references={xReferences}
          legendPlacement={props.legendPlacement ?? 'top-end'}
          xTicks={xTicks}
          xLabel={xLabel}
          highlights={highlights}
        />
      ))}
      <LinkedReadings
        lanes={lanes}
        placement={placement}
        references={xReferences}
        formatX={formatX}
        xLabel={xLabel}
        extent={extent}
        xUnits={props.xUnits}
        extra={extra}
        readout={readout}
      />
    </>
  );
}

export function LinkedLineChart(props: LinkedLineChartProps) {
  const {
    channels,
    channelHeight,
    legendPlacement,
    xReferences,
    xUnits,
    measurements,
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
    formatX,
    xLabel,
    summary,
    ...frame
  } = props;
  const strings = useUiStrings();
  const model = useLinkedModel(props);
  const { frameRef, hasData } = model;
  const placement = usePlacement(props, model);
  const visibility = useChannelVisibility();
  const axisLabel = xLabel ?? strings.chartXAxis;
  const table = () => toCaptureTable(channels, axisLabel, strings);
  return (
    <Chart
      {...frame}
      {...hooks.root({ className: props.className, data: { 'x-scale': xScale ?? 'linear' } })}
      ref={frameRef}
      isEmpty={!hasData}
      table={table}
      summary={chartSummary(props, strings)}
    >
      {hasData ? (
        <CaptureView props={props} model={model} placement={placement} visibility={visibility} />
      ) : (
        strings.noData
      )}
    </Chart>
  );
}
