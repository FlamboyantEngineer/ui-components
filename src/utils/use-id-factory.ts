'use client';

import { useCallback, useId, useRef } from 'react';

/**
 * Returns a function that creates a new id on each call, unique within the document, for the items
 * an editor adds (rules, steps). The function is the same across renders.
 */
export function useIdFactory(): () => string {
  const base = useId();
  const count = useRef(0);
  return useCallback(() => {
    count.current += 1;
    return `${base}${count.current}`;
  }, [base]);
}
