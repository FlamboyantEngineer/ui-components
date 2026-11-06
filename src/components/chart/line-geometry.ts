// The lines, areas and points of a line chart and its scales (specs/CHART.md).

import type { Key } from '../../core/props.js';
import { clamp } from '../../utils/clamp.js';
import { createLinearScale, type LinearScale, type ScaleTick } from '../../utils/linear-scale.js';
import { requireDefined } from '../../utils/require-defined.js';
import { summarizeNumbers } from '../../utils/summarize-numbers.js';
import { createPlaceIdentities, toValueIdentity } from './chart-identity.js';
import {
  type ChartBox,
  type ChartMargin,
  countTicks,
  resolvePlotBox,
  roundCoordinate,
} from './chart-layout.js';
import {
  createLineXAxis,
  createLineXReader,
  type LineChartX,
  type LineXAxis,
} from './line-x-axis.js';

/** One value of a line chart's series. */
export interface LineChartPoint {
  /** Where the value sits along the x axis: an ISO 8601 date or date-time, or a number. */
  x: LineChartX;
  /** The value, or `null` when it is missing; a missing value or one that is not a finite number breaks the line. */
  y: number | null;
}

/** A drawn series: its position among the chart's series and its points. */
interface LineGeometrySeries {
  series: number;
  /** The series' id, which keys its line and points across reorders. */
  id: Key;
  points: readonly LineChartPoint[];
}

export interface LineGeometryInput {
  /** The series drawn, without the hidden ones. */
  series: readonly LineGeometrySeries[];
  width: number;
  height: number;
  margin: ChartMargin;
  /** The value at the bottom edge. Defaults to a nice value at or below zero and the lowest value. */
  minValue?: number | undefined;
  /** The value at the top edge. Defaults to a nice value at or above zero and the highest value. */
  maxValue?: number | undefined;
  timeZone: string;
  locale: string;
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /** Draws the line and area straight across missing values instead of breaking them there. */
  connectsMissing?: boolean | undefined;
}

/** A drawn value. */
interface LinePoint {
  key: string;
  series: number;
  /** Its position among its series' drawn values, in x order. */
  index: number;
  /** Its read x, a number or a time, which keyboard moves between series compare. */
  position: number;
  at: LineChartX;
  value: number;
  x: number;
  y: number;
}

/** One series' line through its values, the area under it and its points. */
interface LinePath {
  /** The series' id identity, stable while the series moves. */
  key: string;
  series: number;
  line: string;
  area: string;
  points: LinePoint[];
}

export interface LineGeometry {
  lines: LinePath[];
  xAxis: LineXAxis;
  /** Values to positions along the value axis. */
  values: LinearScale;
  yTicks: Array<ScaleTick<number>>;
  plot: ChartBox;
}

const xTickSpacing = 80;
const yTickSpacing = 40;

/** The automatic value extent covers only points drawn: those whose x the axis can read. */
function findValueDomain(input: LineGeometryInput): [number, number] {
  const points = input.series.flatMap((entry) => entry.points);
  // Each x is read once.
  const xs = points.map((point) => point.x);
  const read = createLineXReader(xs, input.timeZone);
  const summary = summarizeNumbers(
    points
      .filter((_, index) => Number.isFinite(read(requireDefined(xs[index]))))
      .map((point) => point.y),
  );
  const low = input.minValue ?? Math.min(0, summary.min);
  const high = input.maxValue ?? Math.max(0, summary.max);
  return low === high ? [low, low + 1] : [low, high];
}

/** Path data through runs of points, split where a value is missing. */
function toPaths(runs: readonly LinePoint[][], baseline: number) {
  const paths = runs.map((run) =>
    run.map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join(''),
  );
  const line = paths.join('');
  const area = runs
    .map((run, index) => {
      return `${paths[index]}L${requireDefined(run.at(-1)).x},${baseline}L${requireDefined(run[0]).x},${baseline}Z`;
    })
    .join('');
  return { line, area };
}

/** One series laid out: its readable points in x order, split into runs at missing values. */
function layOutSeries(
  { series, id, points }: LineGeometrySeries,
  scales: { xAxis: LineXAxis; y: (value: number) => number; connectsMissing: boolean },
): { runs: LinePoint[][]; points: LinePoint[] } {
  // Each x is read once before the sort, not again in the comparator.
  const ordered = points
    .map((point) => {
      const { x } = point;
      return { point, x, at: scales.xAxis.read(x) };
    })
    .filter(({ at }) => Number.isFinite(at))
    .sort((a, b) => a.at - b.at);
  const runs: LinePoint[][] = [[]];
  const drawn: LinePoint[] = [];
  const placeOf = createPlaceIdentities();
  for (const { point, x, at } of ordered) {
    const place = placeOf(at);
    const value = point.y;
    if (value === null || !Number.isFinite(value)) {
      if (!scales.connectsMissing) runs.push([]);
      continue;
    }
    const laid = {
      key: toValueIdentity(id, place),
      series,
      index: drawn.length,
      position: at,
      at: x,
      value,
      x: roundCoordinate(scales.xAxis.map(x)),
      y: roundCoordinate(scales.y(value)),
    };
    drawn.push(laid);
    requireDefined(runs.at(-1)).push(laid);
  }
  return { runs: runs.filter((run) => run.length > 0), points: drawn };
}

/** The value axis, also used to measure tick labels before laying out paths. */
export function createLineValueScale(input: LineGeometryInput, plot: ChartBox): LinearScale {
  const isFixed = input.minValue !== undefined || input.maxValue !== undefined;
  return createLinearScale({
    domain: findValueDomain(input),
    range: [plot.bottom, plot.top],
    nice: !isFixed,
    clamp: true,
    tickCount: countTicks(plot.bottom - plot.top, yTickSpacing),
    locale: input.locale,
    formatOptions: input.formatOptions,
  });
}

/**
 * Lays series out in a box: x along a time or linear axis across the readable x values, and
 * values along a value axis (higher values higher up). Points whose x cannot be read are left out;
 * a missing value (`null`) or one that is not a finite number breaks the line and the area, unless
 * `connectsMissing` draws across it. The area fills toward zero or the edge nearest it. Coordinates are rounded to two decimals.
 */
export function resolveLineGeometry(
  input: LineGeometryInput,
  valueScale?: LinearScale,
): LineGeometry {
  const plot = resolvePlotBox(input.width, input.height, input.margin);
  const xAxis = createLineXAxis({
    values: input.series.flatMap(({ points }) => points.map((point) => point.x)),
    range: [plot.left, plot.right],
    tickCount: countTicks(plot.right - plot.left, xTickSpacing),
    timeZone: input.timeZone,
    locale: input.locale,
  });
  const values = valueScale ?? createLineValueScale(input, plot);
  const [low, high] = [Math.min(...values.domain), Math.max(...values.domain)];
  const baseline = roundCoordinate(values.map(clamp(0, low, high)));
  const lines = input.series.map((entry) => {
    const { runs, points } = layOutSeries(entry, {
      xAxis,
      y: values.map,
      connectsMissing: input.connectsMissing ?? false,
    });
    return {
      key: toValueIdentity(entry.id),
      series: entry.series,
      ...toPaths(runs, baseline),
      points,
    };
  });
  return { lines, xAxis, values, yTicks: values.ticks(), plot };
}
