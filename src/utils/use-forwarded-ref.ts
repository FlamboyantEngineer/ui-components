'use client';

import { useRef, type Ref, type RefCallback, type RefObject } from 'react';
import { useMergedRefs } from './use-merged-refs.js';

/**
 * A ref object for a component's own use, and the ref callback to put on its element, which also
 * hands the element to the caller's `ref` (running a React 19 callback ref's cleanup on detach).
 */
export function useForwardedRef<T>(ref: Ref<T> | undefined): [RefObject<T | null>, RefCallback<T>] {
  const own = useRef<T | null>(null);
  const setRef = useMergedRefs(own, ref);
  return [own, setRef];
}
