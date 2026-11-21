'use client';

import { type ReactNode, type RefObject, useContext, useMemo, useRef } from 'react';
import {
  TooltipContext,
  type TooltipTriggerState,
  TooltipTriggerStateContext,
  useSlottedContext,
} from '../../primitives/index.js';
import { useScrollCloseGuard } from '../../utils/use-scroll-close-guard.js';

/**
 * Hands the hint panel its trigger's state with the scroll close guarded (UIC-TOOLTIP-1.1): React
 * Aria closes a hint on any scroll of its trigger's scroll containers, so the queued scroll of a
 * reveal or focus scroll still running when a hint opens from the keyboard closed it at once. Only
 * a scroll the reader makes after the hint opened closes it, as for popovers and menus.
 */
export function TooltipScrollGuard({ children }: { children: ReactNode }) {
  const state = useContext(TooltipTriggerStateContext);
  const fallbackRef = useRef<Element>(null);
  const triggerRef: RefObject<Element | null> =
    useSlottedContext(TooltipContext)?.triggerRef ?? fallbackRef;
  const isIgnored = useScrollCloseGuard(state?.isOpen === true, triggerRef, { followsPage: false });
  const guarded = useMemo<TooltipTriggerState | null>(
    () =>
      state && {
        ...state,
        close: (immediate?: boolean) => {
          if (!isIgnored()) state.close(immediate);
        },
      },
    [state, isIgnored],
  );
  return <TooltipTriggerStateContext value={guarded}>{children}</TooltipTriggerStateContext>;
}
