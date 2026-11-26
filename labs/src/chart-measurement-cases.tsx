import { useMemo, useState } from 'react';
import {
  type ChartReferenceLine,
  EventChart,
  type EventChartItem,
  type LinkedChartChannel,
  LinkedLineChart,
} from '../../src/components/chart/index.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { LabSection } from './chrome/index.js';

const count = 16384;
const samples = Array.from({ length: count }, (_, i) => {
  const reference = Math.sin(i / 1000) * 2;
  const y =
    i === 8100
      ? 5
      : i === 8101
        ? -5
        : i >= 10000 && i < 10200
          ? null
          : reference + 0.08 * Math.cos(i / 14);
  return { x: i * 4e-11, y, lower: reference - 0.25, upper: reference + 0.25 };
});
const voltage: LinkedChartChannel = {
  id: 'v',
  label: 'Voltage',
  unit: 'V',
  yRange: [-6, 6],
  samples,
  reference: samples
    .filter((_, i) => i % 32 === 0)
    .map((p) => ({ x: p.x, y: Math.sin(p.x / 4e-8) * 2 })),
};
const current: LinkedChartChannel = {
  id: 'i',
  label: 'Current',
  unit: 'mA',
  threshold: 20,
  yRange: [0, 60],
  samples: samples
    .filter((_, i) => i % 3 === 0)
    .map((p) => ({ x: p.x, y: p.y === null ? null : 22 + p.y * 4 })),
};
const frequencies: LinkedChartChannel[] = [
  {
    id: 'response',
    label: 'Response',
    unit: 'V',
    yScale: 'log',
    samples: [1, 10, 100, 1000, 10000, 100000].map((x) => ({ x, y: 1 / Math.sqrt(x) })),
  },
];
const events: EventChartItem[] = Array.from({ length: 36 }, (_, i) => ({
  id: i,
  label: 'Observation ' + (i + 1),
  start: Math.floor(i / 2) * 1e-6,
  ...(i % 3 === 0 ? { end: (Math.floor(i / 2) + 0.25) * 1e-6 } : {}),
}));
const ns = (x: number) => (x * 1e9).toFixed(2) + ' ns';
const fixed = [{ id: 'origin', label: 'Trigger', value: 160e-9 }];

function CaptureExample() {
  const [threshold, setThreshold] = useState<number | null>(1);
  const [cursors, setCursors] = useState<readonly [number, number]>([160e-9, 320e-9]);
  const [range, setRange] = useState<readonly [number, number]>([0, samples.at(-1)?.x ?? 0]);
  const [markers, setMarkers] = useState<readonly ChartReferenceLine[]>([]);
  const channels = useMemo(
    () => [{ ...voltage, threshold: threshold ?? undefined }, current],
    [threshold],
  );
  return (
    <>
      <NumberField
        label="Voltage threshold (V)"
        value={threshold}
        onChange={setThreshold}
        commitBehavior="validate"
      />
      <LinkedLineChart
        label="Captured signals"
        xLabel="Time (ns)"
        formatX={ns}
        channels={channels}
        xReferences={fixed}
        visibleRange={range}
        onVisibleRangeChange={setRange}
        cursors={cursors}
        onCursorsChange={setCursors}
        markers={markers}
        onMarkersChange={setMarkers}
      />
    </>
  );
}

export function ChartMeasurementCases() {
  return (
    <>
      <LabSection
        title="Linked measurements"
        description="Shift-drag to select a range or Ctrl+wheel to zoom, then drag the plot to pan. Drag a cursor to measure. Its line thickens while held. Enter its coordinate in seconds for exact placement. Right-click a channel for placement and Reset view."
      >
        <CaptureExample />
      </LabSection>
      <LabSection
        title="Logarithmic axes"
        description="Frequency and amplitude use positive logarithmic scales. Ctrl+wheel zooms around the pointer. Right-click the plot to reset the view."
      >
        <LinkedLineChart
          label="Frequency response"
          xLabel="Frequency (Hz)"
          channels={frequencies}
          xScale="log"
          defaultCursors={[10, 1000]}
        />
      </LabSection>
      <LabSection
        title="Elapsed events"
        description="Arrow through observations at each coordinate. Shift-drag to inspect a time interval and choose Reset view in the plot menu to see the full sequence. The table includes the original numeric endpoints in seconds."
      >
        <EventChart
          label="Observation sequence"
          events={events}
          xLabel="Elapsed time"
          formatX={(x) => (x * 1e6).toFixed(2) + ' µs'}
        />
      </LabSection>
    </>
  );
}
