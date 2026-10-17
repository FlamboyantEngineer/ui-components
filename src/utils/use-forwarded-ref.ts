import { useCallback, useRef, type Ref, type RefCallback, type RefObject } from 'react';

/**
 * A ref object for a component's own use, and the ref callback to put on its element, which also
 * hands the element to the caller's `ref`.
 */
export function useForwardedRef<T>(ref: Ref<T> | undefined): [RefObject<T | null>, RefCallback<T>] {
  const own = useRef<T | null>(null);
  const setRef = useCallback(
    (node: T | null) => {
      own.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  return [own, setRef];
}
