import { clamp } from '../../utils/clamp.js';

/** The ends of a slider's track, in values. */
export interface SliderBounds {
  minValue: number;
  maxValue: number;
}

/**
 * How values lie along a slider's track: a monotonic map between a value in the bounds and its
 * position on the track, from 0 at `minValue` to 1 at `maxValue`. The value, its callbacks, its
 * validation and its form data stay in values; only the thumb, fill and mark positions follow it.
 */
export interface NumberSliderScale {
  /** The track position, from 0 to 1, of a value in the bounds. It grows with the value. */
  toPosition(value: number, bounds: SliderBounds): number;
  /** The value at a track position from 0 to 1: the inverse of `toPosition`. */
  toValue(position: number, bounds: SliderBounds): number;
}

/**
 * A slider's scale: `linear` (the default), where equal distances are equal differences,
 * `logarithmic`, where equal distances are equal ratios (its bounds must be above zero), or the
 * caller's own monotonic map.
 */
export type NumberSliderScaleOption = 'linear' | 'logarithmic' | NumberSliderScale;

/** Equal distances along the track are equal ratios of values: for bounds above zero. */
export const logarithmicScale: NumberSliderScale = {
  toPosition: (value, { minValue, maxValue }) =>
    maxValue > minValue ? Math.log(value / minValue) / Math.log(maxValue / minValue) : 0,
  toValue: (position, { minValue, maxValue }) => minValue * (maxValue / minValue) ** position,
};

/**
 * The scale a slider draws its track with, or `null` for the linear default. A logarithmic scale
 * needs bounds above zero, so other bounds throw a `RangeError` rather than mix coordinates.
 */
export function resolveSliderScale(
  scale: NumberSliderScaleOption | undefined,
  bounds: SliderBounds,
): NumberSliderScale | null {
  if (scale === undefined || scale === 'linear') return null;
  if (scale !== 'logarithmic') return scale;
  if (!(bounds.minValue > 0 && bounds.maxValue > 0)) {
    throw new RangeError('A logarithmic slider needs a minValue and a maxValue above 0.');
  }
  return logarithmicScale;
}

/** A value's position along the track, from 0 to 1: on the scale, or linear without one. */
export function toTrackPercent(
  value: number,
  scale: NumberSliderScale | null,
  grid: SliderBounds,
): number {
  const { minValue, maxValue } = grid;
  const inBounds = clamp(value, minValue, maxValue);
  const position = scale
    ? scale.toPosition(inBounds, grid)
    : (inBounds - minValue) / (maxValue - minValue || 1);
  return clamp(position, 0, 1);
}
