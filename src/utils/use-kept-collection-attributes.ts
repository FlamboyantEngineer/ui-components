'use client';

import { useLayoutEffect, useRef } from 'react';

/** The caller's attributes that React Aria replaces on a collection that can take drops. */
export interface KeptCollectionAttributes {
  id?: string | undefined;
  'aria-describedby'?: string | undefined;
}

/**
 * Keeps the caller's `id` and `aria-describedby` on a collection whose drag and drop hooks stay
 * mounted. React Aria gives every collection that can take drops its own id and clears its
 * description, even while its drag and drop is disabled. Returns the ref for the collection.
 */
export function useKeptCollectionAttributes<E extends Element>(
  attributes: KeptCollectionAttributes,
) {
  const ref = useRef<E>(null);
  const applied = useRef(new Set<string>());
  const { id, 'aria-describedby': describedBy } = attributes;
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const wanted = [
      ['id', id],
      ['aria-describedby', describedBy],
    ] as const;
    for (const [name, value] of wanted) {
      if (value !== undefined) {
        element.setAttribute(name, value);
        applied.current.add(name);
      } else if (applied.current.delete(name) && name === 'aria-describedby') {
        element.removeAttribute(name);
      }
    }
  });
  return ref;
}
