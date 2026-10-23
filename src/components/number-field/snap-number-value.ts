import { clamp } from '../../utils/clamp.js';
import { countDecimalPlaces } from '../../utils/count-decimal-places.js';

interface NumberBounds {
  minValue?: number | undefined;
  maxValue?: number | undefined;
  step?: number | undefined;
}

/** Snaps an edited value while external values remain visible for validation. */
export function snapNumberValue(value: number, bounds: NumberBounds): number {
  const { minValue, maxValue, step } = bounds;
  const minimum = minValue ?? -Infinity;
  const maximum = maxValue ?? Infinity;
  const bounded = clamp(value, minimum, maximum);
  if (step === undefined || !Number.isFinite(step) || step <= 0) return bounded;
  const origin = minValue ?? 0;
  const ratio = (bounded - origin) / step;
  if (!Number.isFinite(ratio)) return bounded;
  const tolerance = Number.EPSILON * Math.max(1, Math.abs(ratio)) * 2;
  let count = Math.sign(ratio) * Math.round(Math.abs(ratio) + tolerance);
  if (maxValue !== undefined) {
    const limit = (maxValue - origin) / step;
    const near = Math.round(limit);
    const maximumCount = Math.abs(limit - near) <= tolerance ? near : Math.floor(limit);
    count = Math.min(count, maximumCount);
  }
  const precision = Math.max(countDecimalPlaces(origin), countDecimalPlaces(step));
  const next = origin + count * step;
  return clamp(precision <= 100 ? Number(next.toFixed(precision)) : next, minimum, maximum);
}
