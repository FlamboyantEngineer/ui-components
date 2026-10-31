'use client';

import { isShallowEqual } from './is-shallow-equal.js';
import { useEqualValue } from './use-equal-value.js';

/**
 * `value`, or the object an earlier render returned while every field of `value` is the same
 * (`Object.is`), so an options object built on each render keeps its identity for `memo` and
 * effects without listing its fields as dependencies.
 */
export function useShallowStable<T extends object>(value: T): T {
  return useEqualValue(value, isShallowEqual);
}
