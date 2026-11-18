// The time arithmetic of signal traces: visible ranges, zoom, pan, cursors and nearest samples.

import type { Key } from '../../core/props.js';

/** A stretch of the shared time axis, from its earlier to its later end, in the caller's unit. */
export type SignalTimeRange = readonly [number, number];

/** The times of the two linked cursors, in the caller's unit. */
export type SignalCursors = readonly [number, number];

/** One display sample: a time and a value, or `null` for a gap. */
export interface SignalSample {
  readonly time: number;
  readonly value: number | null;
}

/** One display sample of an envelope: the lower and upper values at a time. */
export interface SignalEnvelopeSample {
  readonly time: number;
  readonly lower: number;
  readonly upper: number;
}

/** One channel: its own value scale, drawn in a band of its own, over the shared time axis. */
export interface SignalChannel {
  /** Stable key of the channel. */
  readonly id: Key;
  /** Visible name of the channel. */
  readonly label: string;
  /** The unit of its values, shown beside the label and its readings. */
  readonly unit?: string | undefined;
  /** Display samples in increasing time order, already reduced to what the view draws. */
  readonly samples: readonly SignalSample[];
  /** A reference series in increasing time order, drawn dashed. */
  readonly reference?: readonly SignalSample[] | undefined;
  /** Lower and upper bounds in increasing time order, drawn as a shaded band. */
  readonly envelope?: readonly SignalEnvelopeSample[] | undefined;
}

/** Maps a time and a value to a position in the drawing. */
export interface SignalProjection {
  x: (time: number) => number;
  y: (value: number) => number;
}

/** The narrowest range, as a share of the data window, a zoom reaches. */
const minimumShare = 1e-6;
/** How many representable steps of the range's own magnitude its span keeps at least. */
const minimumSteps = 64;

/** The narrowest span the window can be zoomed to, kept well above floating-point resolution. */
export function getMinimumSpan(domain: SignalTimeRange): number {
  const magnitude = Math.max(Math.abs(domain[0]), Math.abs(domain[1]));
  return Math.max(
    (domain[1] - domain[0]) * minimumShare,
    magnitude * Number.EPSILON * minimumSteps,
  );
}

/** The data window with its ends in order; a window that is not finite reads as `[0, 1]`. */
export function normalizeDomain(domain: SignalTimeRange): SignalTimeRange {
  const [from, to] = domain;
  if (!Number.isFinite(from) || !Number.isFinite(to)) return [0, 1];
  if (from === to) return [from - 0.5, to + 0.5];
  return from < to ? [from, to] : [to, from];
}

/**
 * `range` made valid for `domain`: ends in order, no wider than the window, no narrower than its
 * minimum span, and shifted inside it.
 */
export function fitRange(range: SignalTimeRange, domain: SignalTimeRange): SignalTimeRange {
  const [low, high] = domain;
  const first = Number.isFinite(range[0]) ? range[0] : low;
  const second = Number.isFinite(range[1]) ? range[1] : high;
  const from = Math.min(first, second);
  const span = Math.min(
    Math.max(Math.max(first, second) - from, getMinimumSpan(domain)),
    high - low,
  );
  const start = Math.min(Math.max(from, low), high - span);
  return [start, start + span];
}

/** `range` scaled by `factor` around `anchor`, which keeps its place in the view, then fitted. */
export function zoomRange(
  range: SignalTimeRange,
  domain: SignalTimeRange,
  { factor, anchor }: { factor: number; anchor: number },
): SignalTimeRange {
  const span = range[1] - range[0];
  const share = span > 0 ? (anchor - range[0]) / span : 0.5;
  const next = Math.min(Math.max(span * factor, getMinimumSpan(domain)), domain[1] - domain[0]);
  const start = anchor - share * next;
  return fitRange([start, start + next], domain);
}

/** `range` moved later by `offset` (earlier when negative), stopping at the window's ends. */
export function panRange(
  range: SignalTimeRange,
  domain: SignalTimeRange,
  offset: number,
): SignalTimeRange {
  return fitRange([range[0] + offset, range[1] + offset], domain);
}

/** The cursors a view starts with: a third and two thirds of the way through `range`. */
export function getDefaultCursors(range: SignalTimeRange): SignalCursors {
  const span = range[1] - range[0];
  return [range[0] + span / 3, range[0] + (2 * span) / 3];
}

/** `time` kept inside `range`. */
export function clampTime(time: number, range: SignalTimeRange): number {
  if (!Number.isFinite(time)) return range[0];
  return Math.min(Math.max(time, range[0]), range[1]);
}

/** The index of the first sample at or after `time`, in samples sorted by time. */
function findFirstAtOrAfter(samples: readonly { time: number }[], time: number): number {
  let low = 0;
  let high = samples.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if ((samples[middle]?.time ?? Infinity) < time) low = middle + 1;
    else high = middle;
  }
  return low;
}

/** The sample nearest `time`, the earlier one on a tie, or `undefined` when there are none. */
export function findNearestSample(
  samples: readonly SignalSample[],
  time: number,
): SignalSample | undefined {
  const index = findFirstAtOrAfter(samples, time);
  const after = samples[index];
  const before = samples[index - 1];
  if (!before) return after;
  if (!after) return before;
  return time - before.time <= after.time - time ? before : after;
}

/** The samples a view of `range` draws: those inside it and one beyond each end. */
export function sliceVisible<T extends { time: number }>(
  samples: readonly T[],
  range: SignalTimeRange,
): readonly T[] {
  const start = Math.max(0, findFirstAtOrAfter(samples, range[0]) - 1);
  const end = Math.min(samples.length, findFirstAtOrAfter(samples, range[1]) + 1);
  return start === 0 && end === samples.length ? samples : samples.slice(start, end);
}

/** The lowest and highest finite value of a channel's samples, reference and envelope. */
export function readChannelExtent(channel: SignalChannel): SignalTimeRange | null {
  let low = Infinity;
  let high = -Infinity;
  const add = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) return;
    low = Math.min(low, value);
    high = Math.max(high, value);
  };
  for (const sample of channel.samples) add(sample.value);
  for (const sample of channel.reference ?? []) add(sample.value);
  for (const sample of channel.envelope ?? []) {
    add(sample.lower);
    add(sample.upper);
  }
  if (low > high) return null;
  if (low === high) {
    const pad = low === 0 ? 1 : Math.abs(low) / 10;
    return [low - pad, high + pad];
  }
  return [low, high];
}

const formatPoint = (x: number, y: number) => `${String(x)} ${String(y)}`;

/** An SVG path through the samples, broken at gaps and values that are not finite. */
export function buildTracePath(
  samples: readonly SignalSample[],
  projection: SignalProjection,
): string {
  const parts: string[] = [];
  let isDrawing = false;
  for (const sample of samples) {
    const x = projection.x(sample.time);
    const y = sample.value === null ? NaN : projection.y(sample.value);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      isDrawing = false;
      continue;
    }
    parts.push(`${isDrawing ? 'L' : 'M'}${formatPoint(x, y)}`);
    isDrawing = true;
  }
  return parts.join(' ');
}

/** An SVG path of closed shapes between the upper and lower bounds, broken where one is missing. */
export function buildEnvelopePath(
  samples: readonly SignalEnvelopeSample[],
  projection: SignalProjection,
): string {
  const shapes: string[] = [];
  let run: Array<{ x: number; upper: number; lower: number }> = [];
  const close = () => {
    if (run.length > 1) {
      const top = run.map((point) => formatPoint(point.x, point.upper));
      const bottom = run.map((point) => formatPoint(point.x, point.lower)).reverse();
      shapes.push(`M${[...top, ...bottom].join(' L')} Z`);
    }
    run = [];
  };
  for (const sample of samples) {
    const point = {
      x: projection.x(sample.time),
      upper: projection.y(sample.upper),
      lower: projection.y(sample.lower),
    };
    if ([point.x, point.upper, point.lower].every(Number.isFinite)) run.push(point);
    else close();
  }
  close();
  return shapes.join(' ');
}
