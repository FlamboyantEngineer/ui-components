'use client';

import { useMemo } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import type { ScaleInterval } from '../../utils/linear-scale.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useIdFactory } from '../../utils/use-id-factory.js';
import { Button } from '../button/button.js';
import { NumberField } from '../number-field/number-field.js';
import { Chart, type ChartProps } from './chart.js';
import { linkedChartHooks as hooks } from './chart-hooks.js';
import { type ChartPlacement, getChartMarks } from './chart-placement.js';
import type { ChartReferenceLine } from './chart-references.js';
import { useChartViewport } from './chart-viewport.js';
import type { LinkedChartChannel } from './linked-channel.js';
import { LinkedLane } from './linked-lane.js';
import {
  drawChannel,
  getCaptureDomain,
  type LinkedChartReadout,
  prepareChannel,
  readCursors,
} from './linked-model.js';
import type { ChartViewportProps } from './numeric-axis.js';
import { useChartFrame, useLabelMargin } from './use-chart-box.js';

export interface LinkedLineChartProps
  extends
    Omit<ChartProps, 'children' | 'summary' | 'table' | 'legend' | 'isEmpty'>,
    ChartViewportProps {
  channels: readonly LinkedChartChannel[];
  /** Height in pixels of each channel including its axes. */
  channelHeight?: number | undefined;
  /** Named stationary x references common to every channel. */
  xReferences?: readonly ChartReferenceLine[] | undefined;
  /** Movable named x markers, controlled or initially supplied. */
  markers?: readonly ChartReferenceLine[] | undefined;
  defaultMarkers?: readonly ChartReferenceLine[] | undefined;
  onMarkersChange?: ((markers: readonly ChartReferenceLine[]) => void) | undefined;
  /** Coordinates in A, B order. The two cursors may cross. */
  cursors?: ScaleInterval | undefined;
  defaultCursors?: ScaleInterval | undefined;
  /** Requested cursor coordinates and the matching samples in the current drawing. */
  onCursorsChange?: ((cursors: ScaleInterval, readout: LinkedChartReadout) => void) | undefined;
  summary?: string | undefined;
}

const noMarkers: readonly ChartReferenceLine[] = [];
const numberFormat = { maximumSignificantDigits: 17, useGrouping: false } as const;

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
  const [held, set] = useControllableState(props.cursors, props.defaultCursors);
  const cursors = held ?? model.extent;
  const setCursors = (next: ScaleInterval) => {
    if (!next.every(Number.isFinite) || (cursors[0] === next[0] && cursors[1] === next[1])) return;
    set(next);
    props.onCursorsChange?.(next, readCursors(model.lanes, next));
  };
  const addMarker = (x: number) => {
    const id = makeId(markers.map((m) => String(m.id)))();
    let index = markers.length + 1;
    const labels = new Set(markers.map((m) => m.label));
    while (labels.has(strings.chartMarker(String(index)))) index++;
    setMarkers([...markers, { id, label: strings.chartMarker(String(index)), value: x }]);
  };
  const placement: ChartPlacement = {
    markers,
    cursors,
    setCursors,
    addMarker,
    setMarker: (key, x) => setMarkers(markers.map((m) => (m.id === key ? { ...m, value: x } : m))),
    removeMarker: (key) => setMarkers(markers.filter((m) => m.id !== key)),
  };
  return placement;
}

function PositionInputs({
  placement,
  extent,
}: {
  placement: ChartPlacement;
  extent: ScaleInterval;
}) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('readout')}>
      {getChartMarks(placement).map((m) => (
        <div key={m.id}>
          <NumberField
            label={m.kind === 'cursor' ? strings.chartCursor(m.label) : m.label}
            value={m.x}
            minValue={extent[0]}
            maxValue={extent[1]}
            formatOptions={numberFormat}
            commitBehavior="validate"
            onChange={(value) => {
              if (value !== null && Number.isFinite(value) && value === clamp(value, ...extent))
                m.move(value);
            }}
          />
          {m.remove ? (
            <Button aria-label={strings.remove + ' ' + m.label} onPress={m.remove}>
              {strings.remove}
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function CursorReadings({
  readout,
  channels,
  formatX,
}: {
  readout: LinkedChartReadout;
  channels: readonly LinkedChartChannel[];
  formatX: (x: number) => string;
}) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('readout')}>
      <span>Δx = {formatX(readout.deltaX)}</span>
      {readout.channels.map((reading, index) => {
        const channel = channels[index];
        if (!channel) return null;
        const writeY = (y: number) =>
          (channel.formatY ?? String)(y) + (channel.unit ? ' ' + channel.unit : '');
        return (
          <div key={toKeyIdentity(channel.id)}>
            {channel.label}
            {' · '}
            {reading.samples.map((p, i) => (
              <span key={i}>
                {i === 0 ? 'A' : 'B'} ={' '}
                {p?.y != null ? formatX(p.x) + ', ' + writeY(p.y) : strings.noData}
                {' · '}
              </span>
            ))}
            Δy = {reading.deltaY === null ? strings.noData : writeY(reading.deltaY)}
            {' · '}
            {strings.chartPeakAmplitude} ={' '}
            {reading.peakToPeak === null ? strings.noData : writeY(reading.peakToPeak)}
          </div>
        );
      })}
    </div>
  );
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
    visibleRange,
    defaultVisibleRange,
    onVisibleRangeChange,
    cursors,
    defaultCursors,
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
  const readout = readCursors(lanes, placement.cursors);
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
          <PositionInputs placement={placement} extent={extent} />
          <CursorReadings channels={channels} readout={readout} formatX={formatX} />
        </>
      ) : (
        strings.noData
      )}
    </Chart>
  );
}
