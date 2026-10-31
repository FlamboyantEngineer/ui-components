'use client';

import { isShallowEqual } from './is-shallow-equal.js';
import { useEqualValue } from './use-equal-value.js';

/** Whether two items are the same value, or objects whose fields are (`isShallowEqual`). */
function isSameItem(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (typeof left !== 'object' || typeof right !== 'object') return false;
  return isShallowEqual(left, right);
}

/** Whether two lists hold the same items in the same order, each compared shallowly. */
export function isSameArray(left: readonly unknown[], right: readonly unknown[]): boolean {
  return (
    left === right ||
    (left.length === right.length && left.every((item, at) => isSameItem(item, right[at])))
  );
}

/**
 * `items`, or the array an earlier render returned while it holds the same items (`isSameArray`),
 * so a list rebuilt on each render, such as a host's tokens or the ids read from a tree, keeps its
 * identity for `useMemo` and `memo` without serialising it.
 */
export function useStableArray<T>(items: readonly T[]): readonly T[] {
  return useEqualValue(items, isSameArray);
}
