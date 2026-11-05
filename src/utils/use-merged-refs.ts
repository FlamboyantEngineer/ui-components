import { type Ref, type RefCallback, useCallback } from 'react';
import { mergeRefs } from './merge-props.js';

/**
 * One callback ref, kept while the refs given stay the same, that hands the element to each of them
 * (`mergeRefs`) when React attaches it and clears them when it leaves. The refs are only touched
 * then, never while rendering. Given one ref, it hands that ref on as a callback that a function
 * building the element, such as a `render` prop, can take without reading it while rendering.
 */
export function useMergedRefs<T>(
  first: Ref<T> | undefined,
  second?: Ref<T> | undefined,
  third?: Ref<T> | undefined,
): RefCallback<T> {
  return useCallback(
    (value: T | null) => mergeRefs(first, second, third)(value),
    [first, second, third],
  );
}
