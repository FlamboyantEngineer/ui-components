// The points of a scatter chart and its two value axes (specs/CHART.md).

import type { Key } from '../../core/props.js';
import type { LinearScale } from '../../utils/linear-scale.js';
import { summarizeNumbers } from '../../utils/summarize-numbers.js';
import { toValueIdentity } from './chart-identity.js';
import {
  type ChartBox,
  type ChartMargin,
  countTicks,
  createBoundedScale,
  resolvePlotBox,
  roundCoordinate,
} from './chart-layout.js';

/** One observation of a scatter chart's series. */
export interface ScatterChartPoint {
  /** Keys the observation within its series, apart from where it sits. */
  id: Key;
  /** Its value along the x axis; one that is not a finite number is left out. */
  x: number | null;
  /** Its value along the y axis; `null` or one that is not a finite number is left out. */
  y: number | null;
  /** Names the observation in its name, its tooltip and the table. */
  label?: string | undefined;
}

interface ScatterGeometrySeries {
  series: number;
  id: Key;
  points: readonly ScatterChartPoint[];
}

export interface ScatterGeometryInput {
  /** The series drawn, without the hidden ones. */
  series: readonly ScatterGeometrySeries[];
  width: number;
  height: number;
  margin: ChartMargin;
  minX?: number | undefined;
  maxX?: number | undefined;
  minY?: number | undefined;
  maxY?: number | undefined;
  locale: string;
  formatOptions?: Intl.NumberFormatOptions | undefined;
}

/** A drawn observation. */
export interface ScatterMark {
  key: string;
  series: number;
  /** Its position among its series' drawn observations, in x order. */
  index: number;
  /** Its x, which keyboard moves between series compare. */
  position: number;
  point: ScatterChartPoint;
  /** Its x and y values, finite. */
  at: number;
  value: number;
  x: number;
  y: number;
}

export interface ScatterGeometry {
  marks: ScatterMark[];
  xScale: LinearScale;
  yScale: LinearScale;
  plot: ChartBox;
}

const xTickSpacing = 80;
const yTickSpacing = 40;

const isFiniteNumber = (value: number | null): value is number =>
  value !== null && Number.isFinite(value);

/** Whether an observation draws: both its values are finite numbers. */
export function isDrawnPoint(point: ScatterChartPoint): point is ScatterChartPoint & {
  x: number;
  y: number;
} {
  return isFiniteNumber(point.x) && isFiniteNumber(point.y);
}

/** An axis domain: the given bounds, else the drawn values' extent, widened when it is one value. */
function findDomain(values: Iterable<number>, low?: number, high?: number): [number, number] {
  const summary = summarizeNumbers(values);
  const from = low ?? (summary.count > 0 ? summary.min : 0);
  const to = high ?? (summary.count > 0 ? summary.max : 1);
  if (from !== to) return [from, to];
  const pad = Math.abs(from) / 10 || 1;
  return [low ?? from - pad, high ?? to + pad];
}

function drawnPoints(input: Pick<ScatterGeometryInput, 'series'>) {
  return input.series.flatMap((entry) => entry.points.filter(isDrawnPoint));
}

/** The y axis, also used to measure tick labels before laying out the points. */
export function createScatterYScale(input: ScatterGeometryInput, plot: ChartBox): LinearScale {
  return createBoundedScale(
    {
      domain: findDomain(
        drawnPoints(input).map((point) => point.y),
        input.minY,
        input.maxY,
      ),
      range: [plot.bottom, plot.top],
      clamp: true,
      tickCount: countTicks(plot.bottom - plot.top, yTickSpacing),
      locale: input.locale,
      formatOptions: input.formatOptions,
    },
    { low: input.minY, high: input.maxY },
  );
}

function createScatterXScale(input: ScatterGeometryInput, plot: ChartBox): LinearScale {
  return createBoundedScale(
    {
      domain: findDomain(
        drawnPoints(input).map((point) => point.x),
        input.minX,
        input.maxX,
      ),
      range: [plot.left, plot.right],
      clamp: true,
      tickCount: countTicks(plot.right - plot.left, xTickSpacing),
      locale: input.locale,
      formatOptions: input.formatOptions,
    },
    { low: input.minX, high: input.maxX },
  );
}

/**
 * Lays observations out in a box on two linear axes. An observation whose x or y is not a finite
 * number is left out; values beyond fixed bounds sit at the edges. Each observation is keyed by
 * its series' id and its own, so observations at the same coordinates stay distinct and keep
 * their identity when others move; a repeated id within a series keeps its first observation.
 * A series' observations are ordered by x, then y, then given order, for the arrow keys.
 */
export function resolveScatterGeometry(
  input: ScatterGeometryInput,
  yScale?: LinearScale,
): ScatterGeometry {
  const plot = resolvePlotBox(input.width, input.height, input.margin);
  const xScale = createScatterXScale(input, plot);
  const ys = yScale ?? createScatterYScale(input, plot);
  const marks = input.series.flatMap((entry) => {
    const seen = new Set<string>();
    const drawn = entry.points
      .filter(isDrawnPoint)
      .filter((point) => {
        const key = toValueIdentity(entry.id, JSON.stringify(toValueIdentity(point.id)));
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((point, order) => ({ point, order }))
      .sort((a, b) => a.point.x - b.point.x || a.point.y - b.point.y || a.order - b.order);
    return drawn.map(({ point }, index) => ({
      key: toValueIdentity(entry.id, JSON.stringify(toValueIdentity(point.id))),
      series: entry.series,
      index,
      position: point.x,
      point,
      at: point.x,
      value: point.y,
      x: roundCoordinate(xScale.map(point.x)),
      y: roundCoordinate(ys.map(point.y)),
    }));
  });
  return { marks, xScale, yScale: ys, plot };
}
