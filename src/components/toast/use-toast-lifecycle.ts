// How a rendered toast follows its queue entry: its current content, its timer and its exit.

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { QueuedToast } from '../../primitives/index.js';
import type { ToastContent, ToastLifecycle, ToastSnapshot } from './toast-queue.js';

const subscribeToNothing = () => () => {};

/** The toast's current content and lifetime: its queue entry's, or the queued values as they are. */
export function useToastSnapshot(
  toast: QueuedToast<ToastContent>,
  lifecycle: ToastLifecycle | undefined,
): ToastSnapshot {
  const fallback = useMemo(
    () => ({ content: toast.content, timeout: 0, lifetime: 0, isOpen: true }),
    [toast.content],
  );
  return useSyncExternalStore(
    lifecycle?.subscribe ?? subscribeToNothing,
    lifecycle?.getSnapshot ?? (() => fallback),
    lifecycle?.getSnapshot ?? (() => fallback),
  );
}

/**
 * Runs the toast's React Aria timer for its current lifetime while it is shown and open, and
 * restarts it when an update gives a new lifetime. Region hover and focus pause the same timer.
 */
export function useToastTimer(timer: QueuedToast<ToastContent>['timer'], snapshot: ToastSnapshot) {
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
