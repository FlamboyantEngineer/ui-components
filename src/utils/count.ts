// Count normalization and display shared by count badges and paging controls (specs/COUNT.md).

/** A whole, nonnegative count, or `undefined` when `value` is not a finite number. */
export function normalizeCount(value: number | null | undefined): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.floor(value));
}

export interface FormatCountOptions {
  /** Counts above this cap read as `max+`. A cap that is not a finite, nonnegative number is ignored. */
  max?: number | undefined;
  /** More entries exist beyond the counted ones: the count reads as `count+`. */
  more?: boolean | undefined;
}

/**
 * The visible text of a count: `"12"`, `"9+"` above a cap of 9, or `"12+"` when more entries exist.
 * A count that is not a finite number has no text (`""`).
 */
export function formatCount(count: number, { max, more = false }: FormatCountOptions = {}): string {
  const value = normalizeCount(count);
  if (value === undefined) return '';
  const cap = typeof max === 'number' && max >= 0 ? normalizeCount(max) : undefined;
  if (cap !== undefined && value > cap) return `${cap}+`;
  return more ? `${value}+` : String(value);
}
