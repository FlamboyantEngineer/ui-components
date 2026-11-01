'use client';

import { useLayoutEffect } from 'react';
import { useLatest } from './use-latest.js';

/**
 * Closes an open overlay once its control turns read-only, disabled or otherwise locked, through
 * the ordinary close (`onOpenChange(false)`), so it stays closed when the control unlocks. While
 * locked the owner draws it closed whatever its open state says.
 */
export function useCloseWhenLocked(isOpen: boolean, isLocked: boolean, close: () => void) {
  const shouldClose = isOpen && isLocked;
  const latestClose = useLatest(close);
  useLayoutEffect(() => {
    if (shouldClose) latestClose.current();
  }, [shouldClose, latestClose]);
}
