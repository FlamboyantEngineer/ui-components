'use client';

import { useCallback, useId, useRef } from 'react';

/**
 * Returns a function that starts one edit's id source for the items an editor adds (rules, steps):
 * given the ids the current data already holds, such as ids a restored value kept from an earlier
 * page, each call of the source returns a new id, unique within the document, that is none of them
 * and none it returned before, so an edit adding several items reserves each. The function is the
 * same across renders.
 */
export function useIdFactory(): (taken: Iterable<string>) => () => string {
  const base = useId();
  const count = useRef(0);
  return useCallback(
    (taken: Iterable<string>) => {
      const used = new Set(taken);
      const next = () => {
        count.current += 1;
        return `${base}${count.current}`;
      };
      return () => {
        let id = next();
        while (used.has(id)) id = next();
        used.add(id);
        return id;
      };
    },
    [base],
  );
}
