// The bars of a bar chart and its scales, from its values and box (specs/CHART.md).

import type { Key, Orientation } from '../../core/props.js';
import { type BandScale, createBandScale } from '../../utils/band-scale.js';
import { getNumberFormat } from '../../utils/intl-format.js';
import { createLinearScale, type LinearScale } from '../../utils/linear-scale.js';
import { requireDefined } from '../../utils/require-defined.js';
import { withAxisFormat } from './chart-format.js';
import { createPlaceIdentities, toValueIdentity } from './chart-identity.js';
import {
  type ChartBox,
  type ChartMargin,
  countTicks,
  resolvePlotBox,
  roundCoordinate,
} from './chart-layout.js';

/** `grouped` sets a category's bars side by side; `stacked` piles them into one bar. */
export type BarChartLayout = 'grouped' | 'stacked';

/** A drawn series: its position among the chart's series and one value per category. */
interface BarGeometrySeries {
  series: number;
  /** The series' id, which keys its bars across reorders. */
  id: Key;
  values: readonly number[];
}

export interface BarGeometryInput {
  categories: readonly string[];
  /** The series drawn, without the hidden ones. */
  series: readonly BarGeometrySeries[];
  layout: BarChartLayout;
  /** `vertical` bars rise from a bottom axis; `horizontal` bars grow from a left axis. */
  orientation: Orientation;
  width: number;
  height: number;
  margin: ChartMargin;
  /** BCP 47 locale of the value axis labels. */
  locale: string;
  /** How the value axis labels are formatted; by default with the tick step's decimals. */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /** Writes the value axis labels instead of `formatOptions`. */
  formatAxisValue?: ((value: number) => string) | undefined;
}

/** One drawn bar. */
interface BarRect {
  /** Its series' id and its category, stable while either moves. */
  key: string;
  series: number;
  /** The category's position. */
  index: number;
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BarGeometry {
  bars: BarRect[];
  /** Values to positions along the value axis. */
  values: LinearScale;
  /** Categories to bands along the category axis. */
  bands: BandScale;
  plot: ChartBox;
}

/** Pixels of value axis per tick, about. */
const valueTickSpacing = { vertical: 40, horizontal: 80 } as const;
/** The share of a category's band left between its grouped bars. */
const groupPadding = 0.1;

/** The scale in units, and the unit, behind each value scale over divided values. */
const unitScales = new WeakMap<LinearScale, { scale: LinearScale; unit: number }>();

/** Room the nice domain and its ticks need beyond the values, as a power of two. */
const niceHeadroom = 8;

/**
 * The power of two the bars' values are divided by before they are summed and scaled: 1, unless
 * a stack of the largest value, with room for a nice domain, would pass the largest number. Dividing
 * by a power of two keeps every value's digits, so the bars keep their proportions.
 */
function findValueUnit(input: BarGeometryInput): number {
  let largest = 0;
  for (const { values } of input.series) {
    for (const value of values) {
      if (Number.isFinite(value)) largest = Math.max(largest, Math.abs(value));
    }
  }
  const room = input.series.length * niceHeadroom;
  let unit = 1;
  while (!Number.isFinite((largest / unit) * room)) unit *= 2;
  return unit;
}

/**
 * A scale over values divided by `unit`, read and labelled in the values themselves. A tick past
 * the largest number reads as the number format's infinity.
 */
function toUnitScale(
  scale: LinearScale,
  unit: number,
  { locale, formatOptions }: Pick<BarGeometryInput, 'locale' | 'formatOptions'>,
): LinearScale {
  const labels = getNumberFormat(
    locale,
    formatOptions ?? { notation: 'scientific', maximumSignificantDigits: 3 },
  );
  const format = (value: number) => labels.format(value);
  const scaled: LinearScale = {
    domain: [scale.domain[0] * unit, scale.domain[1] * unit],
    range: scale.range,
    map: (value) => scale.map(value / unit),
    invert: (position) => scale.invert(position) * unit,
    ticks: () =>
      scale
        .ticks()
        .map((tick) => ({ ...tick, value: tick.value * unit, label: format(tick.value * unit) })),
    format,
  };
  unitScales.set(scaled, { scale, unit });
  return scaled;
}

/** The lowest and highest ends the bars reach, in `unit`s, always including zero. */
function findValueExtent(input: BarGeometryInput, unit: number): [number, number] {
  let low = 0;
  let high = 0;
  input.categories.forEach((_, index) => {
    let above = 0;
    let below = 0;
    for (const { values } of input.series) {
      const given = values[index];
      if (given === undefined || !Number.isFinite(given)) continue;
      const value = given / unit;
      if (input.layout === 'grouped') {
        low = Math.min(low, value);
        high = Math.max(high, value);
      } else if (value >= 0) above += value;
      else below += value;
    }
    low = Math.min(low, below);
    high = Math.max(high, above);
  });
  return low === high ? [0, 1] : [low, high];
}

/** The value axis, also used to measure tick labels before laying out bars. */
export function createBarValueScale(input: BarGeometryInput, plot: ChartBox): LinearScale {
  const isVertical = input.orientation === 'vertical';
  const valueRange: [number, number] = isVertical
    ? [plot.bottom, plot.top]
    : [plot.left, plot.right];
  const unit = findValueUnit(input);
  const scale = createLinearScale({
    domain: findValueExtent(input, unit),
    range: valueRange,
    nice: true,
    locale: input.locale,
    formatOptions: input.formatOptions,
    tickCount: countTicks(
      Math.abs(valueRange[1] - valueRange[0]),
      valueTickSpacing[input.orientation],
    ),
  });
  const values = unit === 1 ? scale : toUnitScale(scale, unit, input);
  const labelled = withAxisFormat(values, input.formatAxisValue);
  const units = unitScales.get(values);
  if (units) unitScales.set(labelled, units);
  return labelled;
}

/**
 * Lays bars out in a box: one band per category along the category axis, and each value from zero
 * (or from the top of the values stacked under it) along a nice value axis that always includes
 * zero. Grouped bars split their band between the drawn series. Values that are not finite numbers
 * draw no bar. Coordinates are rounded to two decimals.
 */
export function resolveBarGeometry(input: BarGeometryInput, valueScale?: LinearScale): BarGeometry {
  const plot = resolvePlotBox(input.width, input.height, input.margin);
  const isVertical = input.orientation === 'vertical';
  const values = valueScale ?? createBarValueScale(input, plot);
  const bands = createBandScale({
    domain: input.categories,
    range: isVertical ? [plot.left, plot.right] : [plot.top, plot.bottom],
  });
  const groups = createBandScale({
    domain: input.series.map(({ series }) => String(series)),
    range: [0, bands.bandwidth],
    padding: groupPadding,
  });
  const isGrouped = input.layout === 'grouped';
  // Stacks sum values in the scale's units, which never overflow.
  const { scale: unitScale, unit } = unitScales.get(values) ?? { scale: values, unit: 1 };
  const toPosition = (units: number) => unitScale.map(units);
  const bars: BarRect[] = [];
  const placeOf = createPlaceIdentities();
  input.categories.forEach((category, index) => {
    const place = placeOf(category);
    const stack = { above: 0, below: 0 };
    for (const { series, id, values: seriesValues } of input.series) {
      const value = seriesValues[index];
      if (value === undefined || !Number.isFinite(value)) continue;
      const side = value >= 0 ? 'above' : 'below';
      const units = value / unit;
      const base = isGrouped ? 0 : stack[side];
      stack[side] = base + units;
      const ends = [toPosition(base), toPosition(base + units)];
      const start = bands.map(category) + (isGrouped ? groups.map(String(series)) : 0);
      const breadth = isGrouped ? groups.bandwidth : bands.bandwidth;
      const low = Math.min(...ends);
      const length = Math.abs(requireDefined(ends[1]) - requireDefined(ends[0]));
      const box =
        input.orientation === 'vertical'
          ? { x: start, y: low, width: breadth, height: length }
          : { x: low, y: start, width: length, height: breadth };
      bars.push({
        key: toValueIdentity(id, place),
        series,
        index,
        value,
        x: roundCoordinate(box.x),
        y: roundCoordinate(box.y),
        width: roundCoordinate(box.width),
        height: roundCoordinate(box.height),
      });
    }
  });
  return { bars, values, bands, plot };
}
