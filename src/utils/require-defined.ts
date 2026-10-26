/**
 * `value` when it is present. Use it where an invariant guarantees the value, such as an index
 * inside its array's bounds; it throws when the invariant breaks instead of passing `undefined` on.
 */
export function requireDefined<T>(value: T | null | undefined): T {
  if (value === undefined || value === null) throw new Error('Expected a value to be present.');
  return value;
}
