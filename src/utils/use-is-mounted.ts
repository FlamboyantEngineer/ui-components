'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * A ref that is true while the component is mounted, for async work that must not call back into
 * its host, move focus or settle state once the component that started it is gone.
 */
export function useIsMounted(): RefObject<boolean> {
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  return isMounted;
}
