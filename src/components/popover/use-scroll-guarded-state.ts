'use client';

import { useContext, useMemo, type RefObject } from 'react';
import {
  OverlayTriggerStateContext,
  PopoverContext,
  useSlottedContext,
} from '../../primitives/index.js';
import { useScrollCloseGuard } from '../../utils/use-scroll-close-guard.js';

const noTrigger: RefObject<Element | null> = { current: null };

interface ScrollGuardOptions {
  isOpen: boolean | undefined;
  onOpenChange: ((isOpen: boolean) => void) | undefined;
  triggerRef: RefObject<Element | null> | undefined;
  isNonModal: boolean;
}

/**
 * The open state a nonmodal panel hands React Aria, which ignores the closes `useScrollCloseGuard`
 * refuses: a queued scroll event of an ancestor that has not moved since the panel opened. React
 * Aria closes through the trigger's state inside a trigger and through `onOpenChange` otherwise, so
 * both are guarded.
 */
export function useScrollGuardedState({
  isOpen,
  onOpenChange,
  triggerRef,
  isNonModal,
}: ScrollGuardOptions) {
  const context = useContext(OverlayTriggerStateContext);
  const anchor = useSlottedContext(PopoverContext)?.triggerRef;
  const isIgnored = useScrollCloseGuard(
    isNonModal && (isOpen ?? context?.isOpen ?? false),
    triggerRef ?? anchor ?? noTrigger,
    // The panel stays where it opened, so a real scroll of the page still closes it.
    { followsPage: false },
  );
  const state = useMemo(
    () =>
      context && {
        ...context,
        close: () => {
          if (!isIgnored()) context.close();
        },
        setOpen: (open: boolean) => {
          if (open || !isIgnored()) context.setOpen(open);
        },
        toggle: () => {
          if (!context.isOpen || !isIgnored()) context.toggle();
        },
      },
    [context, isIgnored],
  );
  return {
    state,
    onOpenChange: (open: boolean) => {
      if (open || !isIgnored()) onOpenChange?.(open);
    },
  };
}
