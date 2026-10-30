import { useRef } from 'react';
import { isShallowEqual } from './is-shallow-equal.js';

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
