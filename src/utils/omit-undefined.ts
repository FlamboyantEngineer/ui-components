/** A copy of `values` without its `undefined` entries, to merge over defaults without erasing them. */
export function omitUndefined<T extends object>(values: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
