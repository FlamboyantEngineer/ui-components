'use client';

import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

/** An element, or a ref to one. */
type ElementTarget<T extends Element = Element> = T | RefObject<T | null> | null | undefined;

/**
 * The element `target` holds. A ref is read again after every commit, since its element changes in
 * commits that change no prop, so an element that mounts late or replaces the previous one under
 * the same ref takes over; until the first read the result is `null`.
 */
export function useTargetElement<T extends Element>(target: ElementTarget<T>): T | null {
  const ref = target && 'current' in target ? target : null;
  const [element, setElement] = useState<T | null>(null);
  const held = useRef<T | null>(null);
  const read = () => {
    const next = ref ? ref.current : null;
    if (next === held.current) return;
    held.current = next;
    setElement(next);
  };
  // Read before paint, and again once every ref of the commit is attached: an element later in the
  // tree than the caller gets its ref after the caller's layout effects.
  useLayoutEffect(read);
  useEffect(read);
  if (ref) return element;
  return target && !('current' in target) ? target : null;
}
