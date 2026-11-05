'use client';

import { useSyncExternalStore } from 'react';

const subscribeToNothing = () => () => {};

/**
 * False on the server and while hydrating, so both render the same output, then true. A render on
 * the client alone is true from the start.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}
