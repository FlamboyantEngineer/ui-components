import type { NumberRange } from './number-slider.js';

/**
 * The range after a thumb moved, keeping the thumbs `distance` apart: the thumb that moved stops
 * that far from the other, within the bounds. A change that moves both thumbs is kept as it is.
 * Thumbs already closer than `distance` never jump apart: a move that brings them closer is
 * refused, and one that moves them apart is kept.
 */
export function keepThumbsApart(
  next: NumberRange,
  previous: NumberRange,
  bounds: { distance: number; minValue: number; maxValue: number },
): NumberRange {
  const [start, end] = next;
  const gap = end - start;
  const movedStart = start !== previous[0];
  if (gap >= bounds.distance || movedStart === (end !== previous[1])) return next;
  const previousGap = previous[1] - previous[0];
  if (previousGap < bounds.distance) return gap >= previousGap ? next : previous;
  return movedStart
    ? [Math.max(bounds.minValue, end - bounds.distance), end]
    : [start, Math.min(bounds.maxValue, start + bounds.distance)];
}
