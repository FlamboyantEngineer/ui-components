'use client';

// The asynchronous check of a field: debounced, aborted when the value or the validator moves on.

import { useEffect, useState } from 'react';
import { useLatest } from '../../utils/use-latest.js';
import { type FieldIssue, type FieldIssues, toIssueList } from './field-validation.js';

/** A check that may wait (for a server): it receives the value and a signal that aborts it. */
export type FieldAsyncValidate<T> = (value: T, signal: AbortSignal) => Promise<FieldIssues>;

interface AsyncCheckOptions<T> {
  validateAsync: FieldAsyncValidate<T> | undefined;
  /** How long the value must stay unchanged before the check runs, in milliseconds. */
  debounce: number;
  /** Leaves the check out, as while the value already has an error. */
  isSkipped: boolean;
  /** Whether two values are the same value, so the check of one counts for the other. */
  isEqual: (left: T, right: T) => boolean;
}

interface AsyncCheck {
  /** The issues the check found for the current value. */
  issues: FieldIssue[];
  /** The current value waits for its check or is being checked. */
  isRunning: boolean;
}

/** One check: the value and validator it is for, and its issues once it settles. */
interface Attempt<T> {
  /** Numbers the attempts, so a check runs once per attempt. */
  id: number;
  value: T;
  validateAsync: FieldAsyncValidate<T> | undefined;
  isEnabled: boolean;
  issues: FieldIssue[] | null;
}

/**
 * Runs `validateAsync` once the value has stayed unchanged for `debounce` milliseconds. Each value,
 * validator and enabling starts a new attempt, pending until its own check settles: a result counts
 * only for the attempt that asked for it, so returning to a value checked before, or replacing the
 * validator, waits for a fresh check. A newer attempt aborts the older check; a new `debounce` restarts
 * a pending check's wait and leaves a settled one as it is. A check that rejects,
 * or throws before returning its promise, reports no issue.
 */
export function useAsyncCheck<T>(value: T, options: AsyncCheckOptions<T>): AsyncCheck {
  const { validateAsync, debounce, isSkipped, isEqual } = options;
  const isEnabled = Boolean(validateAsync) && !isSkipped;
  const [attempt, setAttempt] = useState<Attempt<T>>(() => ({
    id: 0,
    value,
    validateAsync,
    isEnabled,
    issues: null,
  }));
  const latest = useLatest(value);
  let current = attempt;
  if (
    !isEqual(attempt.value, value) ||
    attempt.validateAsync !== validateAsync ||
    attempt.isEnabled !== isEnabled
  ) {
    // A new attempt starts pending, during this render, so no earlier result shows for it.
    current = { id: attempt.id + 1, value, validateAsync, isEnabled, issues: null };
    setAttempt(current);
  }
  const { id } = current;
  const isSettled = current.issues !== null;

  useEffect(() => {
    // A settled check stays valid for its value and validator: a change of timing alone does not
    // run it again. A pending one restarts on the new timing, still pending.
    if (!isEnabled || !validateAsync || isSettled) return;
    const controller = new AbortController();
    const settle = (issues: FieldIssues) => {
      if (controller.signal.aborted) return;
      setAttempt((previous) =>
        previous.id === id ? { ...previous, issues: toIssueList(issues) } : previous,
      );
    };
    const timer = setTimeout(() => {
      // A throw before the check returns its promise settles it as a rejection does.
      new Promise<FieldIssues>((resolve) => {
        resolve(validateAsync(latest.current, controller.signal));
      }).then(settle, () => settle(null));
    }, debounce);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [id, isEnabled, isSettled, validateAsync, debounce, latest]);

  return {
    issues: isEnabled ? (current.issues ?? []) : [],
    isRunning: isEnabled && current.issues === null,
  };
}
