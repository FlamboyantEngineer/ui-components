// How a rendered toast follows its queue entry: its current content, its timer and its exit.

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { ToastContent, ToastLifecycle, ToastSnapshot } from './toast-queue.js';

/** The building block's timer of a shown toast, which region hover and focus also pause. */
export interface ToastTimer {
  reset: (delay: number) => void;
  pause: () => void;
}

const subscribeToNothing = () => () => {};

/** The toast's current content and lifetime: its queue entry's, or the queued values as they are. */
export function useToastSnapshot(
  content: ToastContent,
  lifecycle: ToastLifecycle | undefined,
): ToastSnapshot {
  const fallback = useMemo(() => ({ content, timeout: 0, lifetime: 0, isOpen: true }), [content]);
  return useSyncExternalStore(
    lifecycle?.subscribe ?? subscribeToNothing,
    lifecycle?.getSnapshot ?? (() => fallback),
    lifecycle?.getSnapshot ?? (() => fallback),
  );
}

/**
 * Runs the toast's timer for its current lifetime while it is shown and open, and
 * restarts it when an update gives a new lifetime. Region hover and focus pause the same timer.
 */
export function useToastTimer(timer: ToastTimer | undefined, snapshot: ToastSnapshot) {
  const { timeout, lifetime, isOpen } = snapshot;
  useEffect(() => {
    if (!timer || !isOpen) return undefined;
    timer.reset(timeout);
    return () => timer.pause();
  }, [timer, timeout, lifetime, isOpen]);
}

/** Registers the rendered toast with its entry and removes it from the queue once it has exited. */
export function useToastPresence(lifecycle: ToastLifecycle | undefined, isMounted: boolean) {
  useEffect(() => lifecycle?.mount(), [lifecycle]);
  useEffect(() => {
    if (!isMounted) lifecycle?.finishExit();
  }, [lifecycle, isMounted]);
}
