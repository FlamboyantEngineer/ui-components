'use client';

// How a rendered toast follows its queue entry: its current content, its timer and its exit.

import { useEffect, useSyncExternalStore } from 'react';
import type { ToastLifecycle, ToastSnapshot } from './toast-queue.js';

/** The toast's current content and lifetime, as its queue entry holds them. */
export function useToastSnapshot(lifecycle: ToastLifecycle): ToastSnapshot {
  return useSyncExternalStore(lifecycle.subscribe, lifecycle.getSnapshot, lifecycle.getSnapshot);
}

/**
 * Runs the toast's timer for its current lifetime while it is shown and open, and restarts it when
 * an update gives a new lifetime. A lifetime starts once, the first time it is shown: a toast shown
 * again after it was displaced or its list remounted runs on with the time that remained. While
 * `isPaused` (its region is hovered or holds focus) the timer holds, also when it starts or restarts
 * meanwhile, and runs on with the time that remained after.
 */
export function useToastTimer(
  { timer }: ToastLifecycle,
  { lifetime, isOpen }: ToastSnapshot,
  isPaused: boolean,
) {
  useEffect(() => {
    if (!isOpen || isPaused) return undefined;
    timer.resume();
    return () => timer.pause();
  }, [timer, lifetime, isOpen, isPaused]);
}

/** Registers the rendered toast with its entry and removes it from the queue once it has exited. */
export function useToastPresence(lifecycle: ToastLifecycle, isMounted: boolean) {
  useEffect(() => lifecycle.mount(), [lifecycle]);
  useEffect(() => {
    if (!isMounted) lifecycle.finishExit();
  }, [lifecycle, isMounted]);
}
