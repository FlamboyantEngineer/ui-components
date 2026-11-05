import { snapNumberValue } from './snap-number-value.js';

/** The values a slider can hold: from `minValue` to `maxValue`, `step` apart from `minValue`. */
export interface SliderGrid {
  minValue: number;
  maxValue: number;
  step: number;
}

/**
 * The nearest step from the minimum within the bounds, preserving the minimum's and step's
 * precision; above the last step it is the last step. NaN is the minimum, and an infinity the
 * end it points to.
 */
export function snapToStep(given: number, grid: SliderGrid): number {
  return snapNumberValue(Number.isNaN(given) ? grid.minValue : given, grid);
}

/**
 * The value a slider holds for a given one: each number snapped onto the grid, and a range's ends
 * in order.
 */
export function normalizeSliderValue<T extends number | [number, number]>(
  value: T,
  grid: SliderGrid,
): T {
  if (!Array.isArray(value)) return snapToStep(value, grid) as T;
  const start = snapToStep(value[0], grid);
  const end = snapToStep(value[1], grid);
  return (start <= end ? [start, end] : [end, start]) as T;
}
