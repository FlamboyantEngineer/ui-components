import { clamp } from '../../utils/clamp.js';
import { countDecimalPlaces } from '../../utils/count-decimal-places.js';

interface NumberBounds {
  minValue?: number | undefined;
  maxValue?: number | undefined;
  step?: number | undefined;
}

function roundToPrecision(value: number, precision: number): number {
  return precision <= 100 ? Number(value.toFixed(precision)) : value;
}

/**
 * Snaps an edited value to the step grid from `minValue` (or 0) within the bounds, while external
 * values remain visible for validation. A value already on the grid, however large, stays itself.
 */
export function snapNumberValue(value: number, bounds: NumberBounds): number {
  const { minValue, maxValue, step } = bounds;
  const minimum = minValue ?? -Infinity;
  const maximum = maxValue ?? Infinity;
  const bounded = clamp(value, minimum, maximum);
  if (step === undefined || !Number.isFinite(step) || step <= 0) return bounded;
  const origin = minValue ?? 0;
  const ratio = (bounded - origin) / step;
  if (!Number.isFinite(ratio)) return bounded;
  const precision = Math.max(countDecimalPlaces(origin), countDecimalPlaces(step));
  const toValue = (count: number) => roundToPrecision(origin + count * step, precision);
  const lower = Math.floor(Math.abs(ratio));
  // Compare in value space: decimal midpoints need one more place than the grid. A tolerance
  // scaled by the count would mistake exactly representable quarter steps for rounding noise.
  const midpoint = roundToPrecision(
    origin + Math.sign(ratio) * (lower + 0.5) * step,
    precision + 1,
  );
  let count = Number.isInteger(ratio)
    ? ratio
    : Math.sign(ratio) * (lower + (Math.sign(ratio) * (bounded - midpoint) >= 0 ? 1 : 0));
  if (maxValue !== undefined) {
    const limit = (maxValue - origin) / step;
    const near = Math.round(limit);
    // Reconstructing at grid precision tolerates decimal arithmetic noise (0.3 / 0.1), while
    // requiring the step itself to fit prevents an off-grid maximum from being accepted.
    const maximumCount = toValue(near) <= maxValue ? near : near - 1;
    count = Math.min(count, maximumCount);
  }
  return clamp(toValue(count), minimum, maximum);
}
