import { findNearestSample, findStart, type LinkedChartSample } from './linked-channel.js';
import type { DrawnChannel } from './linked-model.js';

/** An exact acquired sample, or an estimate between consecutive measurements. */
export interface LinkedChartCursorSample extends LinkedChartSample {
  interpolated?: true;
}

export const cursorSnapRadius = 8;

/** A plot gesture uses that channel's grid. A table edit can snap to any linked channel. */
export function snapCursorX(lanes: readonly DrawnChannel[], at: number) {
  let closest = at;
  let distance = Infinity;
  for (const { measured, measurements, x } of lanes) {
    const [low, high] = x.domain;
    const grid = at >= low && at <= high ? measurements.samples : measured;
    const sample = findNearestSample(grid, at, x);
    if (!sample) continue;
    const gap = Math.abs(x.map(sample.x) - x.map(at));
    if (gap <= cursorSnapRadius && (gap < distance || (gap === distance && sample.x < closest))) {
      closest = sample.x;
      distance = gap;
    }
  }
  return closest;
}

/** Unit conversion and index × sample period can round the same coordinate differently. */
function acquiredCoordinate(at: number, before?: LinkedChartSample, after?: LinkedChartSample) {
  const nearest = at - (before?.x ?? -Infinity) < (after?.x ?? Infinity) - at ? before : after;
  return nearest && Math.abs(nearest.x - at) <= Math.abs(at) * Number.EPSILON
    ? nearest.x
    : undefined;
}

/** Evaluate the segment in plotted coordinates, including logarithmic axes and explicit breaks. */
export function readSourceSample(lane: DrawnChannel, at: number): LinkedChartCursorSample | null {
  const { x, y, source, measured } = lane;
  const next = findStart(source, at);
  const a = source[next - 1];
  const b = source[next];
  if (!Number.isFinite(x.map(at))) return null;
  const coordinate = acquiredCoordinate(at, a, b);
  if (coordinate !== undefined) {
    const exact = measured[findStart(measured, coordinate)];
    return exact?.x === coordinate ? exact : null;
  }
  if (!a || !b || a.y == null || b.y == null) return null;
  const start = x.map(a.x);
  const fraction = (x.map(at) - start) / (x.map(b.x) - start);
  const left = y.map(a.y);
  const value = y.invert(left + fraction * (y.map(b.y) - left));
  return Number.isFinite(value) ? { x: at, y: value, interpolated: true } : null;
}

/** Readout rows outside the visible range have no reading. Differential bindings use the source. */
export function readCursorSample(lane: DrawnChannel, at: number) {
  return at >= lane.x.domain[0] && at <= lane.x.domain[1] ? readSourceSample(lane, at) : null;
}
