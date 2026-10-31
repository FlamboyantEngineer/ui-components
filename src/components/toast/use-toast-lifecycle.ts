'use client';

// How a rendered toast follows its queue entry: its current content, its timer and its exit.

import { useEffect, useSyncExternalStore } from 'react';
import type { ToastLifecycle, ToastSnapshot } from './toast-queue.js';

/** The building block's timer of a shown toast, which region hover and focus also pause. */
interface ToastTimer {
  reset: (delay: number) => void;
  pause: () => void;
  /** Runs on with the time that remained; resuming a running timer starts a second timeout. */
  resume: () => void;
}

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
  timer: ToastTimer | undefined,
  { lifecycle, snapshot }: { lifecycle: ToastLifecycle; snapshot: ToastSnapshot },
  isPaused: boolean,
) {
  const { timeout, lifetime, isOpen } = snapshot;
  useEffect(() => {
    if (!timer || !isOpen) return undefined;
    // Shown again, the timer was paused as it was hidden; the effect below resumes it.
    if (lifecycle.startLifetime()) timer.reset(timeout);
    return () => timer.pause();
  }, [timer, lifecycle, timeout, lifetime, isOpen]);
  useEffect(() => {
    if (!timer || !isOpen) return;
    // Pausing first leaves a single timeout running once resumed.
    timer.pause();
    if (!isPaused) timer.resume();
  }, [timer, timeout, lifetime, isOpen, isPaused]);
}

/** Registers the rendered toast with its entry and removes it from the queue once it has exited. */
export function useToastPresence(lifecycle: ToastLifecycle, isMounted: boolean) {
  useEffect(() => lifecycle.mount(), [lifecycle]);
  useEffect(() => {
    if (!isMounted) lifecycle.finishExit();
  }, [lifecycle, isMounted]);
}
