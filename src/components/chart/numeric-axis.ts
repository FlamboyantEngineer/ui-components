// The viewport is manipulated in axis coordinates. Values and callbacks always use data units.
import { clamp } from '../../utils/clamp.js';
import {
  createLinearScale,
  type LinearScale,
  type ScaleInterval,
} from '../../utils/linear-scale.js';

export type ChartAxisScale = 'linear' | 'log';

export interface ChartViewportProps {
  /** Scale of the shared numeric x axis. Logarithmic axes draw positive coordinates. */
  xScale?: ChartAxisScale | undefined;
  /** Visible x endpoints in data units, controlled. */
  visibleRange?: ScaleInterval | undefined;
  /** Initial visible range. Defaults to the extent of the data. */
  defaultVisibleRange?: ScaleInterval | undefined;
  /** Receives pan, zoom and reset requests in data units. */
  onVisibleRangeChange?: ((range: ScaleInterval) => void) | undefined;
  /** Formats x coordinates in axis labels and measurement details. */
  formatX?: ((value: number) => string) | undefined;
  /** Names the x axis, including its unit. */
  xLabel?: string | undefined;
}

export function isAxisValue(value: number, kind: ChartAxisScale): boolean {
  return Number.isFinite(value) && (kind === 'linear' || value > 0);
}

export function findAxisExtent(values: Iterable<number>, kind: ChartAxisScale): ScaleInterval {
  let low = Infinity;
  let high = -Infinity;
  for (const value of values) {
    if (!isAxisValue(value, kind)) continue;
    low = Math.min(low, value);
    high = Math.max(high, value);
  }
  if (low > high) return kind === 'log' ? [1, 10] : [0, 1];
  if (low !== high) return [low, high];
  if (kind === 'log')
    return [Math.max(Number.MIN_VALUE, low / 2), Math.min(Number.MAX_VALUE, high * 2)];
  const padding = Math.abs(low) * 0.05 || 1;
  return [Math.max(-Number.MAX_VALUE, low - padding), Math.min(Number.MAX_VALUE, high + padding)];
}

export function isAxisRange(range: ScaleInterval, kind: ChartAxisScale): boolean {
  return range[0] < range[1] && range.every((value) => isAxisValue(value, kind));
}

interface AxisOptions {
  domain: ScaleInterval;
  range: ScaleInterval;
  kind: ChartAxisScale;
  format?: ((value: number) => string) | undefined;
  tickCount?: number | undefined;
  locale?: string | undefined;
}

/** Uses decade ticks on wide log views and ordinary numeric ticks inside a single decade. */
export function createNumericAxis(options: AxisOptions): LinearScale {
  const { domain, range, kind } = options;
  const linear = createLinearScale(options);
  const format = options.format ?? (kind === 'log' ? String : linear.format);
  if (kind === 'linear')
    return {
      ...linear,
      format,
      ticks: () => linear.ticks().map((t) => ({ ...t, label: format(t.value) })),
    };
  const transformed = createLinearScale({
    domain: [Math.log10(domain[0]), Math.log10(domain[1])],
    range,
  });
  const map = (value: number) => transformed.map(Math.log10(value));
  const invert = (position: number) => 10 ** transformed.invert(position);
  const ticks = () => {
    const [from, to] = transformed.domain;
    const step = Math.max(1, Math.ceil((to - from) / (options.tickCount ?? 5)));
    const values: number[] = [];
    for (let power = Math.ceil(from); power <= to; power += step) values.push(10 ** power);
    const marks = values.length >= 2 ? values : linear.ticks().map((t) => t.value);
    return marks.map((value) => ({ value, position: map(value), label: format(value) }));
  };
  return { domain, range, map, invert, format, ticks };
}

/** Zoom around a fractional plot coordinate, or translate, clamping the view to the capture. */
export function moveChartRange(
  axis: LinearScale,
  extent: ScaleInterval,
  move: { factor: number; anchor: number; shift: number },
): ScaleInterval {
  const [left, right] = axis.range;
  const width = right - left;
  const start = axis.map(extent[0]);
  const end = axis.map(extent[1]);
  const span = Math.min(end - start, width * move.factor);
  if (span >= end - start) return extent;
  const next = clamp(left + (width - span) * move.anchor + width * move.shift, start, end - span);
  const low = next === start ? extent[0] : axis.invert(next);
  const high = next + span >= end ? extent[1] : axis.invert(next + span);
  return Number.isFinite(low) && Number.isFinite(high) && low < high ? [low, high] : axis.domain;
}
