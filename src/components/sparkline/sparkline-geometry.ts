// The paths and marked points of a sparkline, from its values and box (specs/SPARKLINE.md).

import { requireDefined } from '../../utils/require-defined.js';
import { summarizeNumbers } from '../../utils/summarize-numbers.js';
import { createLinearScale, type LinearScale } from '../../utils/linear-scale.js';

/** A value the sparkline can mark. */
export type SparklineMarker = 'min' | 'max' | 'last';

/** A drawn value: its index in the series and where it sits in the box. */
interface SparklinePoint {
  index: number;
  value: number;
  x: number;
  y: number;
}

interface SparklineGeometryInput {
  values: readonly number[];
  width: number;
  height: number;
  /** The value at the bottom edge. Defaults to the lowest value. */
  minValue?: number | undefined;
  /** The value at the top edge. Defaults to the highest value. */
  maxValue?: number | undefined;
}

export interface SparklineGeometry {
  /** Path data of the line: one subpath per run of two or more finite values. */
  line: string;
  /** Path data of the area between each such run and the baseline. */
  area: string;
  /** The finite values with no finite neighbour, which no line reaches. */
  dots: SparklinePoint[];
  /** The first lowest, the first highest and the last finite values; empty without any. */
  points: Partial<Record<SparklineMarker, SparklinePoint>>;
}

/** Space kept inside the box so markers on the edges stay whole, in pixels. */
const inset = 3;

const round = (value: number) => Math.round(value * 100) / 100;

/** Consecutive finite points, split where a value is missing. */
function splitRuns(points: ReadonlyArray<SparklinePoint | null>): SparklinePoint[][] {
  const runs: SparklinePoint[][] = [];
  let run: SparklinePoint[] = [];
  for (const point of points) {
    if (point) {
      run.push(point);
    } else if (run.length > 0) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length > 0) runs.push(run);
  return runs;
}

function toLine(run: readonly SparklinePoint[]): string {
  return run.map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join('');
}

function toArea(run: readonly SparklinePoint[], baseline: number): string {
  const first = requireDefined(run[0]);
  const last = requireDefined(run[run.length - 1]);
  return `${toLine(run)}L${last.x},${baseline}L${first.x},${baseline}Z`;
}

function findMarkedPoints(points: readonly SparklinePoint[]): SparklineGeometry['points'] {
  if (points.length === 0) return {};
  let min = requireDefined(points[0]);
  let max = requireDefined(points[0]);
  for (const point of points) {
    if (point.value < min.value) min = point;
    if (point.value > max.value) max = point;
  }
  return { min, max, last: requireDefined(points[points.length - 1]) };
}

/**
 * Where the area meets the zero line: at zero inside the y domain, and otherwise at the edge
 * nearest zero, even when the domain is a single value.
 */
function findBaseline(y: LinearScale): number {
  const [low, high] = y.domain;
  const [bottom, top] = y.range;
  // The value at the top edge may be the lower one when a caller reverses the range.
  const [lowEdge, highEdge] = low <= high ? [bottom, top] : [top, bottom];
  if (0 < Math.min(low, high)) return lowEdge;
  if (0 > Math.max(low, high)) return highEdge;
  return round(y.map(0));
}

/**
 * Lays out a series in a box: index along x, value along y (higher values higher up), inset so
 * edge markers stay whole. Values that are not finite numbers leave gaps, and a finite value
 * between gaps becomes a dot. The area fills toward zero, stopping at the edge nearest zero when
 * zero is outside the value range.
 */
export function resolveSparklineGeometry(input: SparklineGeometryInput): SparklineGeometry {
  const { values, width, height } = input;
  const summary = summarizeNumbers(values);
  const low = input.minValue ?? summary.min;
  const high = input.maxValue ?? summary.max;
  const x = createLinearScale({
    domain: [0, values.length - 1],
    range: [inset, width - inset],
  });
  const y = createLinearScale({
    domain: [low, high],
    range: [height - inset, inset],
    clamp: true,
  });
  const points = values.map((value, index) =>
    Number.isFinite(value)
      ? { index, value, x: round(x.map(index)), y: round(y.map(value)) }
      : null,
  );
  const runs = splitRuns(points);
  const paths = runs.filter((run) => run.length > 1);
  const baseline = findBaseline(y);
  return {
    line: paths.map(toLine).join(''),
    area: paths.map((run) => toArea(run, baseline)).join(''),
    dots: runs.filter((run) => run.length === 1).flat(),
    points: findMarkedPoints(runs.flat()),
  };
}
