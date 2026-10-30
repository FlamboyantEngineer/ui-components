/**
 * Whether two objects hold the same own keys with the same values (`Object.is`), such as two
 * measurements a component compares to skip a redundant state update. `null` and `undefined` equal
 * only themselves.
 */
export function isShallowEqual<T extends object>(
  left: T | null | undefined,
  right: T | null | undefined,
): boolean {
  if (left === right) return true;
  if (!left || !right) return false;
  const keys = Object.keys(left);
  if (keys.length !== Object.keys(right).length) return false;
  return keys.every(
    (key) =>
      Object.hasOwn(right, key) &&
      Object.is((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]),
  );
}
