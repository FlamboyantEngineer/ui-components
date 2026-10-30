'use client';

// Keeping a closed dialog mounted: when retention starts, and what a closed retained dialog hides.

import { createContext, useState } from 'react';
import type { OpenStateProps } from '../../core/events.js';

/**
 * Whether the dialog showing in this overlay is open or exiting: a retained dialog stays mounted
 * after it closes, and runs its opening (focus in, focus back, exit complete) only while shown.
 */
export const ModalShownContext = createContext(true);

/**
 * Whether a dialog that keeps its body while closed has opened once, from which point it stays
 * mounted. Before its first opening it renders nothing.
 */
export function useRetention({ isOpen }: Pick<OpenStateProps, 'isOpen'>, keepMounted: boolean) {
  const [hasOpened, setHasOpened] = useState(Boolean(isOpen));
  if (isOpen && !hasOpened) setHasOpened(true);
  return keepMounted && hasOpened;
}

/**
 * The style that keeps a closed retained overlay out of sight, out of the accessibility tree and
 * out of the way of pointers, whatever display the host stylesheet gives it.
 */
export function retainedStyle(isShown: boolean) {
  return isShown ? {} : { visibility: 'hidden' as const, pointerEvents: 'none' as const };
}
