'use client';

import { useSyncExternalStore } from 'react';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

function query(): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(reducedMotionQuery)
    : null;
}

/**
 * Whether the reader asks for reduced motion now; false where `matchMedia` is missing. For reads at
 * event time; render reads `usePrefersReducedMotion`.
 */
export function prefersReducedMotion(): boolean {
  return query()?.matches ?? false;
}

function subscribe(onChange: () => void) {
  const list = query();
  list?.addEventListener('change', onChange);
  return () => list?.removeEventListener('change', onChange);
}

const onServer = () => false;

/**
 * Whether the reader asks for reduced motion, re-rendering when the preference changes. It is false
 * on the server and during hydration, so the server HTML and the first client render agree.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, onServer);
}
