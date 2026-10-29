import { useRef } from 'react';

function isShallowEqual(left: object, right: object): boolean {
  const keys = Object.keys(left);
  if (keys.length !== Object.keys(right).length) return false;
  return keys.every(
    (key) =>
      Object.hasOwn(right, key) &&
      Object.is((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]),
  );
}

/**
 * `value`, or the object an earlier render returned while every field of `value` is the same
 * (`Object.is`), so an options object built on each render keeps its identity for `memo` and
 * effects without listing its fields as dependencies.
 */
export function useShallowStable<T extends object>(value: T): T {
  const ref = useRef(value);
  if (!isShallowEqual(ref.current, value)) ref.current = value;
  return ref.current;
}
