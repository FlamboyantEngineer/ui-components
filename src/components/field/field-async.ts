// The asynchronous check of a field: debounced, aborted when the value moves on.

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

/**
 * Runs `validateAsync` once the value has stayed unchanged for `debounce` milliseconds. A result
 * counts only for the value it checked: a newer value aborts the older check. A check that rejects
 * reports no issue.
 */
export function useAsyncCheck<T>(value: T, options: AsyncCheckOptions<T>): AsyncCheck {
  const { validateAsync, debounce, isSkipped } = options;
  const key = toFieldValueKey(value);
  const [result, setResult] = useState<{ key: string; issues: FieldIssue[] } | null>(null);
  const latest = useLatest({ value, validateAsync });
  const isEnabled = Boolean(validateAsync) && !isSkipped;

  useEffect(() => {
    if (!isEnabled) return;
    const controller = new AbortController();
    const settle = (issues: FieldIssues) => {
      if (!controller.signal.aborted) setResult({ key, issues: toIssueList(issues) });
    };
    const timer = setTimeout(() => {
      const check = latest.current;
      check.validateAsync?.(check.value, controller.signal).then(settle, () => settle(null));
    }, debounce);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, isEnabled, debounce, latest]);

  const isCurrent = result?.key === key;
  return {
    issues: isEnabled && isCurrent ? result.issues : [],
    isRunning: isEnabled && !isCurrent,
  };
}
