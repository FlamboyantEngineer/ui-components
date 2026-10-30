'use client';

// The asynchronous check of a field: debounced, aborted when the value or the validator moves on.

import { useEffect, useState } from 'react';
import { useLatest } from '../../utils/use-latest.js';
import { toFieldValueKey } from './field-value.js';
import { toIssueList, type FieldIssue, type FieldIssues } from './field-validation.js';

/** A check that may wait (for a server): it receives the value and a signal that aborts it. */
export type FieldAsyncValidate<T> = (value: T, signal: AbortSignal) => Promise<FieldIssues>;

interface AsyncCheckOptions<T> {
  validateAsync: FieldAsyncValidate<T> | undefined;
  /** How long the value must stay unchanged before the check runs, in milliseconds. */
  debounce: number;
  /** Leaves the check out, as while the value already has an error. */
  isSkipped: boolean;
}

interface AsyncCheck {
  /** The issues the check found for the current value. */
  issues: FieldIssue[];
  /** The current value waits for its check or is being checked. */
  isRunning: boolean;
}

/** One check: the value and validator it is for, and its issues once it settles. */
interface Attempt<T> {
  key: string;
  validateAsync: FieldAsyncValidate<T> | undefined;
  isEnabled: boolean;
  issues: FieldIssue[] | null;
}

/**
 * Runs `validateAsync` once the value has stayed unchanged for `debounce` milliseconds. Each value,
 * validator and enabling starts a new attempt, pending until its own check settles: a result counts
 * only for the attempt that asked for it, so returning to a value checked before, or replacing the
 * validator, waits for a fresh check. A newer attempt aborts the older check. A check that rejects
 * reports no issue.
 */
export function useAsyncCheck<T>(value: T, options: AsyncCheckOptions<T>): AsyncCheck {
  const { validateAsync, debounce, isSkipped } = options;
  const key = toFieldValueKey(value);
  const isEnabled = Boolean(validateAsync) && !isSkipped;
  const [attempt, setAttempt] = useState<Attempt<T>>(() => ({
    key,
    validateAsync,
    isEnabled,
    issues: null,
  }));
  const latest = useLatest(value);
  let current = attempt;
  if (
    attempt.key !== key ||
    attempt.validateAsync !== validateAsync ||
    attempt.isEnabled !== isEnabled
  ) {
    // A new attempt starts pending, during this render, so no earlier result shows for it.
    current = { key, validateAsync, isEnabled, issues: null };
    setAttempt(current);
  }

  useEffect(() => {
    if (!isEnabled || !validateAsync) return;
    const controller = new AbortController();
    const settle = (issues: FieldIssues) => {
      if (controller.signal.aborted) return;
      setAttempt((previous) =>
        previous.key === key && previous.validateAsync === validateAsync && previous.isEnabled
          ? { ...previous, issues: toIssueList(issues) }
          : previous,
      );
    };
    const timer = setTimeout(() => {
      validateAsync(latest.current, controller.signal).then(settle, () => settle(null));
    }, debounce);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, isEnabled, validateAsync, debounce, latest]);

  return {
    issues: isEnabled ? (current.issues ?? []) : [],
    isRunning: isEnabled && current.issues === null,
  };
}
