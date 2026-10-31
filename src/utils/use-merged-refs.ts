import { useCallback, type Ref, type RefCallback } from 'react';
import { mergeRefs } from './merge-props.js';

/**
 * One callback ref, kept while the refs given stay the same, that hands the element to each of them
 * (`mergeRefs`) when React attaches it and clears them when it leaves. The refs are only touched
 * then, never while rendering.
 */
export function useMergedRefs<T>(
  first: Ref<T> | undefined,
  second: Ref<T> | undefined,
  third?: Ref<T> | undefined,
): RefCallback<T> {
  return useCallback(
    (value: T | null) => mergeRefs(first, second, third)(value),
    [first, second, third],
  );
}
