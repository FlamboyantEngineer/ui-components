export interface NumberSummary {
  count: number;
  sum: number;
  min: number;
  max: number;
}

/** Finite numeric values in one pass, without spreading an unbounded input into a function call. */
export function summarizeNumbers(values: Iterable<unknown>): NumberSummary {
  const summary = { count: 0, sum: 0, min: Infinity, max: -Infinity };
  for (const value of values) {
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    summary.count += 1;
    summary.sum += value;
    summary.min = Math.min(summary.min, value);
    summary.max = Math.max(summary.max, value);
  }
  return summary;
}
