'use client';

import { useEffect, useState } from 'react';
import { useLatest } from '../../utils/use-latest.js';

/** What a step's `prepare` receives: aborted once the step no longer waits for it. */
export interface TourPrepareContext {
  /** Aborted when the reader moves on, skips or closes, the steps change or the tour unmounts. */
  signal: AbortSignal;
}

/** Gets a step's target ready, such as by opening the section it is in or loading its data. */
export type TourStepPrepare = (context: TourPrepareContext) => void | Promise<void>;

/** Where a step is: getting ready, ready to point at its target, or failed to get ready. */
export type TourStepStatus = 'pending' | 'ready' | 'failed';

interface PreparedStep {
  /** The step's place: its index and id, so another step or dataset never reuses the result. */
  key: string;
  /** The attempt the result belongs to, so Retry starts afresh. */
  attempt: number;
  status: 'ready' | 'failed';
}

/**
 * Runs the shown step's `prepare` while the tour is open, once per step, attempt and opening, and
 * reports its status. Moving to another step, a step of another id, closing and unmounting abort
 * the signal, and a settlement after that is ignored, so it can neither show nor advance a step.
 */
export function useStepPreparation(
  prepare: TourStepPrepare | undefined,
  key: string,
  isOpen: boolean,
) {
  const [attempt, setAttempt] = useState(0);
  const [prepared, setPrepared] = useState<PreparedStep | null>(null);
  const latest = useLatest(prepare);
  const hasPrepare = prepare !== undefined;
  useEffect(() => {
    const run = latest.current;
    if (!isOpen || !run) return undefined;
    const controller = new AbortController();
    const settle = (status: PreparedStep['status']) => {
      if (!controller.signal.aborted) setPrepared({ key, attempt, status });
    };
    // A prepare that throws at once fails like one that rejects.
    new Promise<void>((resolve) => {
      resolve(run({ signal: controller.signal }));
    }).then(
      () => settle('ready'),
      () => settle('failed'),
    );
    return () => {
      controller.abort();
      setPrepared(null);
    };
  }, [isOpen, key, attempt, hasPrepare, latest]);
  const isCurrent = prepared?.key === key && prepared.attempt === attempt;
  const status: TourStepStatus = !hasPrepare ? 'ready' : isCurrent ? prepared.status : 'pending';
  return { status, retry: () => setAttempt((count) => count + 1) };
}

/**
 * Whether the step has stopped waiting for its target: at once without `targetTimeout`, else once
 * the target is found or the timeout passes, measured from when the step got ready.
 */
export function useTargetWait(
  key: string,
  options: { isReady: boolean; hasTarget: boolean; timeout: number },
) {
  const [expired, setExpired] = useState<string | null>(null);
  const { isReady, hasTarget, timeout } = options;
  const isWaiting = isReady && !hasTarget && timeout > 0 && expired !== key;
  useEffect(() => {
    if (!isWaiting) return undefined;
    const timer = setTimeout(() => setExpired(key), timeout);
    return () => clearTimeout(timer);
  }, [isWaiting, key, timeout]);
  return isWaiting;
}
