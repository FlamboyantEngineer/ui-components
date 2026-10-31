'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Counts settled requests, the latest one only: a request a newer one superseded counts nothing
 * when it settles. `start` begins a request and returns the call that settles it, which tells
 * whether it was still the latest. A live region that toggles on the count announces each latest
 * outcome once, a repeated outcome included.
 */
export function useLatestSettledCount() {
  const [count, setCount] = useState(0);
  const latest = useRef(0);
  const start = useCallback(() => {
    const request = ++latest.current;
    return () => {
      const isLatest = request === latest.current;
      if (isLatest) setCount((settled) => settled + 1);
      return isLatest;
    };
  }, []);
  return [count, start] as const;
}
