'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns `begin`, which an async operation calls when it starts and keeps the signal it returns:
 * the signal aborts when the component that started the operation unmounts, so the operation
 * settles without calling back into its host, moving focus or setting state. An operation keeps
 * its own signal, so one started before a remount stays aborted after it.
 */
export function useLifetimeSignal(): () => AbortSignal {
  const lifetime = useRef<AbortController | null>(null);
  useEffect(() => {
    // An operation begun before this effect ran shares the controller it created.
    if (!lifetime.current || lifetime.current.signal.aborted) {
      lifetime.current = new AbortController();
    }
    const controller = lifetime.current;
    return () => controller.abort();
  }, []);
  return useCallback(() => {
    lifetime.current ??= new AbortController();
    return lifetime.current.signal;
  }, []);
}
