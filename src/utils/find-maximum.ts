/** The largest projected value, preserving Math.max semantics for empty and non-finite inputs. */
export function findMaximum<T>(
  values: Iterable<T>,
  getValue: (value: T) => number,
  initial = -Infinity,
): number {
  let largest = initial;
  for (const value of values) largest = Math.max(largest, getValue(value));
  return largest;
}
