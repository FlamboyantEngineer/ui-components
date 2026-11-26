import type { Key } from '../../core/props.js';
import type { LinearScale, ScaleInterval } from '../../utils/linear-scale.js';
import { roundCoordinate } from './chart-layout.js';
import type { ChartHiddenKeysProps } from './chart-legend.js';
import { sampleRun } from './line-sampling.js';
import { type ChartAxisScale, findAxisExtent, isAxisValue } from './numeric-axis.js';

export interface LinkedChartSample {
  /** Numeric x coordinate in host units. */
  x: number;
  /** Measured amplitude. Null or nonfinite values break the measured line. */
  y: number | null;
  /** Lower and upper bounds of a sampled error band at x. */
  lower?: number | undefined;
  upper?: number | undefined;
}

/** A host-placed, read-only annotation in the channel's source coordinates. */
export interface LinkedChartPoint {
  id: Key;
  label: string;
  x: number;
  y: number;
}

export type LinkedChartLayer = 'measured' | 'reference' | 'envelope' | 'threshold';

/** A channel's legend. Each named layer can be toggled independently of the other channels. */
export interface LinkedChartLegend extends ChartHiddenKeysProps {
  labels: Partial<Record<LinkedChartLayer, string>>;
}

export interface LinkedChartChannel {
  legend?: LinkedChartLegend | undefined;
  points?: readonly LinkedChartPoint[] | undefined;
  id: Key;
  label: string;
  unit?: string | undefined;
  samples: readonly LinkedChartSample[];
  /** Optional comparison trace, sampled on its own x grid. */
  reference?: readonly LinkedChartSample[] | undefined;
  yScale?: ChartAxisScale | undefined;
  yRange?: ScaleInterval | undefined;
  formatY?: ((value: number) => string) | undefined;
  /** Level in amplitude units used for rising and falling crossing placement. */
  threshold?: number | undefined;
}

export function orderSamples(samples: readonly LinkedChartSample[]) {
  return samples.filter((p) => Number.isFinite(p.x)).sort((a, b) => a.x - b.x);
}

export function findChannelExtent(channel: LinkedChartChannel): ScaleInterval {
  function* values() {
    for (const p of channel.samples) {
      yield p.y ?? NaN;
      yield p.lower ?? NaN;
      yield p.upper ?? NaN;
    }
    for (const p of channel.reference ?? []) yield p.y ?? NaN;
  }
  return findAxisExtent(values(), channel.yScale ?? 'linear');
}

function findStart(samples: readonly LinkedChartSample[], x: number) {
  let lo = 0;
  let hi = samples.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if ((samples[mid]?.x ?? Infinity) < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Keep a neighbor on either edge so a segment crossing the viewport clips continuously. */
export function sliceSamples(samples: readonly LinkedChartSample[], range: ScaleInterval) {
  const first = Math.max(0, findStart(samples, range[0]) - 1);
  let end = findStart(samples, range[1]);
  while (samples[end]?.x === range[1]) end++;
  return samples.slice(first, end + 1);
}

interface DrawnSample {
  x: number;
  y: number;
  sample: LinkedChartSample;
}

function toPath(points: readonly DrawnSample[]) {
  return points
    .map((p, i) => (i === 0 ? 'M' : 'L') + roundCoordinate(p.x) + ',' + roundCoordinate(p.y))
    .join(' ');
}

/** Split at missing data before pixel reduction. Retain source objects for the cursor readout. */
export function drawTrace(samples: readonly LinkedChartSample[], x: LinearScale, y: LinearScale) {
  let run: DrawnSample[] = [];
  const paths: string[] = [];
  const displayed: LinkedChartSample[] = [];
  const flush = () => {
    const kept = sampleRun(run);
    if (kept.length) paths.push(toPath(kept) + (kept.length === 1 ? ' l0,0' : ''));
    for (const p of kept) {
      if (p.x >= x.range[0] && p.x <= x.range[1] && p.y <= y.range[0] && p.y >= y.range[1])
        displayed.push(p.sample);
    }
    run = [];
  };
  for (const sample of samples) {
    const px = x.map(sample.x);
    const py = y.map(sample.y ?? NaN);
    if (Number.isFinite(px) && Number.isFinite(py)) run.push({ x: px, y: py, sample });
    else flush();
  }
  flush();
  return { path: paths.join(' '), displayed };
}

export function drawBand(samples: readonly LinkedChartSample[], x: LinearScale, y: LinearScale) {
  let upper: DrawnSample[] = [];
  let lower: DrawnSample[] = [];
  const paths: string[] = [];
  const flush = () => {
    if (upper.length) {
      const kept = new Set([...sampleRun(upper), ...sampleRun(lower)].map((p) => p.sample));
      const top = upper.filter((p) => kept.has(p.sample));
      const bottom = lower.filter((p) => kept.has(p.sample)).reverse();
      paths.push(toPath([...top, ...bottom]) + ' Z');
    }
    upper = [];
    lower = [];
  };
  for (const sample of samples) {
    const px = x.map(sample.x);
    const top = y.map(sample.upper ?? NaN);
    const bottom = y.map(sample.lower ?? NaN);
    if (![px, top, bottom].every(Number.isFinite) || top > bottom) {
      flush();
      continue;
    }
    upper.push({ x: px, y: top, sample });
    lower.push({ x: px, y: bottom, sample });
  }
  flush();
  return paths.join(' ');
}

export function findNearestSample(
  samples: readonly LinkedChartSample[],
  x: number,
  axis: LinearScale,
) {
  const index = findStart(samples, x);
  const before = samples[index - 1];
  const after = samples[index];
  if (!before || !after) return after ?? before ?? null;
  const at = axis.map(x);
  return at - axis.map(before.x) <= axis.map(after.x) - at ? before : after;
}

/** Analyze source samples in order. A threshold crossing can fall between two acquired samples. */
export function measureChannel(
  samples: readonly LinkedChartSample[],
  channel: LinkedChartChannel,
  range: ScaleInterval,
) {
  const values = samples.filter(
    (p) =>
      p.x >= range[0] &&
      p.x <= range[1] &&
      p.y !== null &&
      isAxisValue(p.y, channel.yScale ?? 'linear'),
  );
  const extremes = findExtremes(values);
  const outside = values.find(validBandViolation)?.x;
  let rising: number | undefined;
  let falling: number | undefined;
  let previous: LinkedChartSample | undefined;
  for (const p of samples) {
    if (p.y === null || !isAxisValue(p.y, channel.yScale ?? 'linear')) {
      previous = undefined;
      continue;
    }
    const crossing = findCrossing(previous, p, channel.threshold);
    if (crossing && crossing.x >= range[0] && crossing.x <= range[1]) {
      if (crossing.rising) rising ??= crossing.x;
      else falling ??= crossing.x;
    }
    previous = p;
  }
  return { ...extremes, rising, falling, outside };
}

function findExtremes(values: readonly LinkedChartSample[]) {
  let min: LinkedChartSample | undefined;
  let max: LinkedChartSample | undefined;
  for (const sample of values) {
    if (sample.y === null) continue;
    if (sample.y < (min?.y ?? Infinity)) min = sample;
    if (sample.y > (max?.y ?? -Infinity)) max = sample;
  }
  return {
    min: min?.x,
    minSample: min,
    maxSample: max,
    max: max?.x,
    peakToPeak: min?.y != null && max?.y != null ? max.y - min.y : null,
  };
}

function validBandViolation(p: LinkedChartSample) {
  const { y, lower, upper } = p;
  return (
    y !== null &&
    lower !== undefined &&
    upper !== undefined &&
    Number.isFinite(lower) &&
    Number.isFinite(upper) &&
    lower <= upper &&
    (y < lower || y > upper)
  );
}

function findCrossing(
  a: LinkedChartSample | undefined,
  b: LinkedChartSample,
  level: number | undefined,
) {
  if (!a || a.y === null || b.y === null || level === undefined) return;
  const rising = a.y < level && b.y >= level;
  if (!rising && !(a.y > level && b.y <= level)) return;
  return { x: a.x + (b.x - a.x) * ((level - a.y) / (b.y - a.y)), rising };
}
