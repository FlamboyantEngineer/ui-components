// The drawing box shared by the charts with axes (specs/CHART.md).

import {
  createLinearScale,
  type LinearScale,
  type LinearScaleOptions,
} from '../../utils/linear-scale.js';

/** Space around the plotted area for the axes' labels, in pixels. */
export interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** The plotted area's edges inside the drawing, in pixels. */
export interface ChartBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** The plotted area of a `width` by `height` drawing inside `margin`, never inside out. */
export function resolvePlotBox(width: number, height: number, margin: ChartMargin): ChartBox {
  const left = Math.min(margin.left, width);
  const top = Math.min(margin.top, height);
  return {
    top,
    left,
    right: Math.max(left, width - margin.right),
    bottom: Math.max(top, height - margin.bottom),
  };
}

/** About one tick per `spacing` pixels of axis, and never fewer than two. */
export function countTicks(length: number, spacing: number): number {
  return Math.max(2, Math.round(length / spacing));
}

/** A coordinate rounded to two decimals, for stable markup. */
export function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

/** The ends of a value axis the caller fixed (`minValue`, `maxX`, …); a missing one is open. */
export interface AxisBounds {
  low?: number | undefined;
  high?: number | undefined;
}

/**
 * A linear scale over `domain`, in increasing order whatever order the ends come in, whose open
 * ends extend to whole tick steps while the ends the caller fixed stay exactly where they are.
 */
export function createBoundedScale(
  options: Omit<LinearScaleOptions, 'nice'>,
  bounds: AxisBounds,
): LinearScale {
  const [low, high] = [...options.domain].sort((a, b) => a - b) as [number, number];
  const fixed = new Set([bounds.low, bounds.high].filter((bound) => bound !== undefined));
  const ordered = { ...options, domain: [low, high] as const };
  if (fixed.size === 0) return createLinearScale({ ...ordered, nice: true });
  const nice = createLinearScale({ ...ordered, nice: true }).domain;
  return createLinearScale({
    ...ordered,
    domain: [fixed.has(low) ? low : nice[0], fixed.has(high) ? high : nice[1]],
  });
}
