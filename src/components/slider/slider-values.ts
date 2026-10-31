import { clamp } from '../../utils/clamp.js';

/** The values a slider can hold: from `minValue` to `maxValue`, `step` apart from `minValue`. */
export interface SliderGrid {
  minValue: number;
  maxValue: number;
  step: number;
}

/** How many decimals a step writes, so a sum of steps drops the binary noise (`0.1 + 0.2`). */
function countDecimals(step: number): number {
  const [digits = '', exponent = '0'] = String(step).toLowerCase().split('e');
  const decimals = (digits.split('.')[1] ?? '').length - Number(exponent);
  return clamp(decimals, 0, 100);
}

/**
 * A number on the grid, as React Aria's slider draws it: the nearest step from the minimum within
 * the bounds, rounded to the step's decimals; above the last step it is the last step.
 */
export function snapToStep(value: number, { minValue, maxValue, step }: SliderGrid): number {
  const decimals = countDecimals(step);
  const round = (number: number) => (decimals > 0 ? Number(number.toFixed(decimals)) : number);
  if (!(step > 0)) return clamp(value, minValue, maxValue);
  const steps = Math.round((clamp(value, minValue, maxValue) - minValue) / step);
  const lastStep = Math.floor(round((maxValue - minValue) / step));
  return round(minValue + Math.min(steps, lastStep) * step);
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
