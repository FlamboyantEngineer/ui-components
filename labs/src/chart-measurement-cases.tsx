import { useMemo, useState } from 'react';
import {
  type ChartReferenceLine,
  EventChart,
  type EventChartItem,
  type LinkedChartChannel,
  type LinkedChartMeasurementContext,
  type LinkedChartSample,
  LinkedLineChart,
} from '../../src/components/chart/index.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { LabSection } from './chrome/index.js';

const count = 24576;
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
function withPeak(channel: LinkedChartChannel): LinkedChartChannel {
  let peak: { x: number; y: number } | undefined;
  for (const { x, y } of channel.samples) {
    if (y !== null && Number.isFinite(y) && (!peak || y > peak.y)) peak = { x, y };
  }
  return {
    ...channel,
    formatY: (value) => String(Number(value.toPrecision(4))),
    points: peak ? [{ id: 'peak', label: channel.label + ' peak', ...peak }] : [],
  };
}

const voltage = withPeak({
  id: 'v',
  label: 'Voltage',
  unit: 'V',
  yRange: [-6, 6],
  samples,
  reference: samples
    .filter((_, i) => i % 32 === 0)
    .map((p) => ({ x: p.x, y: Math.sin(p.x / 4e-8) * 2 })),
});
const current = withPeak({
  id: 'i',
  label: 'Current',
  unit: 'mA',
  threshold: 20,
  yRange: [0, 60],
  samples: samples
    .filter((_, i) => i % 3 === 0)
    .map((p) => ({ x: p.x, y: p.y === null ? null : 22 + p.y * 4 })),
});
// Unit-gain second-order Butterworth low-pass response, sampled uniformly in log frequency.
const timeUnits = { s: 1, ms: 1e-3, µs: 1e-6, μs: 1e-6, us: 1e-6, ns: 1e-9, ps: 1e-12 };
const frequencyUnits = { Hz: 1, kHz: 1e3, MHz: 1e6 };
const cutoff = 1000;
const response = Array.from({ length: 601 }, (_, i) => {
  const x = 10 ** (1 + (4 * i) / 600);
  const ratio = x / cutoff;
  const real = 1 - ratio * ratio;
  const imaginary = Math.SQRT2 * ratio;
  return {
    x,
    magnitude: -20 * Math.log10(Math.hypot(real, imaginary)),
    phase: (-Math.atan2(imaginary, real) * 180) / Math.PI,
  };
});
const frequencies: LinkedChartChannel[] = [
  {
    id: 'magnitude',
    label: 'Magnitude',
    unit: 'dB',
    yRange: [-90, 0],
    samples: response.map(({ x, magnitude }) => ({ x, y: magnitude })),
    formatY: (v) => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2),
  },
  {
    id: 'phase',
    label: 'Phase',
    unit: '°',
    yRange: [-180, 0],
    samples: response.map(({ x, phase }) => ({ x, y: phase })),
    formatY: (v) => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2),
  },
];
const frequencyReferences = [{ id: 'cutoff', label: 'Cutoff', value: cutoff }];
const events: EventChartItem[] = Array.from({ length: 36 }, (_, i) => ({
  id: i,
  label: 'Observation ' + (i + 1),
  start: Math.floor(i / 2) * 1e-6,
  ...(i % 3 === 0 ? { end: (Math.floor(i / 2) + 0.25) * 1e-6 } : {}),
}));
const ns = (x: number) => (x * 1e9).toFixed(2) + ' ns';
const fixed = [{ id: 'origin', label: 'Trigger', value: 160e-9 }];

function firstRisingCrossing(trace: readonly LinkedChartSample[], level: number) {
  for (let i = 1; i < trace.length; i++) {
    const a = trace[i - 1],
      b = trace[i];
    if (a?.y != null && b?.y != null && a.y < level && b.y >= level) {
      return a.x + ((level - a.y) / (b.y - a.y)) * (b.x - a.x);
    }
  }
  return undefined;
}

const lowCrossing = firstRisingCrossing(samples, 0.2);
const highCrossing = firstRisingCrossing(samples, 1.8);
const riseTime =
  lowCrossing !== undefined && highCrossing !== undefined ? ns(highCrossing - lowCrossing) : '—';

function captureMeasurements({ channels, cursors }: LinkedChartMeasurementContext) {
  const a = cursors.find((c) => c.name === 'A'),
    b = cursors.find((c) => c.name === 'B');
  const low = Math.min(a?.x ?? NaN, b?.x ?? NaN),
    high = Math.max(a?.x ?? NaN, b?.x ?? NaN);
  const peaks = new Map<LinkedChartChannel['id'], string>();
  const spans = new Map<LinkedChartChannel['id'], string>();
  for (const channel of channels) {
    let min = Infinity,
      max = -Infinity;
    for (const sample of channel.samples) {
      if (sample.x > high) break;
      if (sample.x >= low && sample.y != null) {
        min = Math.min(min, sample.y);
        max = Math.max(max, sample.y);
      }
    }
    const format = (value: number) =>
      Number.isFinite(value) ? (channel.formatY ?? String)(value) + ' ' + channel.unit : '—';
    peaks.set(channel.id, format(max));
    spans.set(channel.id, format(max - min));
  }
  return [
    { id: 'rise', label: 'Rise time (0.2–1.8 V)', value: riseTime },
    { id: 'peak', label: 'Peak between cursors', valuesByChannel: peaks },
    { id: 'span', label: 'Peak-to-peak between cursors', valuesByChannel: spans },
  ];
}

function CaptureExample() {
  const [threshold, setThreshold] = useState<number | null>(1);
  const [cursors, setCursors] = useState<readonly [number, number]>([80e-9, 240e-9]);
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
        xUnits={timeUnits}
        channels={channels}
        xReferences={fixed}
        measurements={captureMeasurements}
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
        description="Compare A, B, the fixed Trigger and each trace’s highest acquired sample in the readout. Both peaks occur at 324 ns. Click a cursor name to rename it, or click its time to enter a value such as 820 ns. The host computes rise time and the peak and peak-to-peak values between the two cursors from the original samples."
      >
        <CaptureExample />
      </LabSection>
      <LabSection
        title="Logarithmic axes"
        description="Magnitude in dB and phase in degrees share a logarithmic frequency axis. A second-order Butterworth low-pass filter reaches −3.01 dB and −90° at its 1 kHz cutoff. Right-click to insert another cursor."
      >
        <LinkedLineChart
          label="Frequency response"
          xLabel="Frequency (Hz)"
          channels={frequencies}
          xScale="log"
          xUnits={frequencyUnits}
          xReferences={frequencyReferences}
          defaultCursors={[100, 1000]}
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
