// The bound check every date field shares.

/** A bound a value breaks, with the limit to name in the message. */
export interface BoundIssue {
  bound: 'min' | 'max';
  limit: string;
}

/**
 * The bound contract every date field shares: a value, or either end of a range, may not precede
 * `minValue` or follow `maxValue`, and a range's end may not precede its start, which reads as
 * breaking a minimum of the start. `compare` orders two texts, or answers `0` for a text it cannot
 * read.
 */
export function findOrderedBoundIssue(
  value: string | { start: string; end: string },
  compare: (left: string, right: string) => number,
  { minValue, maxValue }: { minValue?: string | undefined; maxValue?: string | undefined },
): BoundIssue | null {
  const ends = typeof value === 'string' ? [value] : [value.start, value.end];
  if (minValue && ends.some((end) => compare(end, minValue) < 0)) {
    return { bound: 'min', limit: minValue };
  }
  if (maxValue && ends.some((end) => compare(end, maxValue) > 0)) {
    return { bound: 'max', limit: maxValue };
  }
  if (typeof value === 'string' || compare(value.end, value.start) >= 0) return null;
  return { bound: 'min', limit: value.start };
}
