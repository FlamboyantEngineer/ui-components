'use client';

import { useContext, type RefObject } from 'react';
import { OverlayTriggerStateContext, useOverlayTriggerState } from '../primitives/index.js';
import type { OpenStateProps } from '../core/events.js';
import { useScrollCloseGuard } from './use-scroll-close-guard.js';

interface ScrollGuardedStateOptions extends Pick<OpenStateProps, 'isOpen' | 'onOpenChange'> {
  triggerRef: RefObject<Element | null>;
  isGuarded: boolean;
  followsPage: boolean;
}

export interface ScrollGuardedState {
  readonly isOpen: boolean;
  open(): void;
  close(): void;
  toggle(): void;
  setOpen(isOpen: boolean): void;
  readonly point: { x: number; y: number } | null;
  setPoint(point: { x: number; y: number }): void;
}

/**
 * Guards closes before React Aria changes its state. Rejecting an onOpenChange afterward leaves
 * its controlled-state ref closed until the next commit, which can discard a reader's Escape.
 */
export function useScrollGuardedState({
  isOpen,
  onOpenChange,
  triggerRef,
  isGuarded,
  followsPage,
}: ScrollGuardedStateOptions): ScrollGuardedState {
  const context = useContext(OverlayTriggerStateContext);
  const local = useOverlayTriggerState({ isOpen, onOpenChange });
  const state = isOpen !== undefined || !context ? local : context;
  const isIgnored = useScrollCloseGuard(isGuarded && state.isOpen, triggerRef, { followsPage });
  return {
    ...state,
    close: () => {
      if (!isIgnored()) state.close();
    },
    setOpen: (open: boolean) => {
      if (open || !isIgnored()) state.setOpen(open);
    },
    toggle: () => {
      if (!state.isOpen || !isIgnored()) state.toggle();
    },
  };
}
