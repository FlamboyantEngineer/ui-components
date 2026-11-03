'use client';

import { useLayoutEffect, useState } from 'react';
import { isShallowEqual } from '../../utils/is-shallow-equal.js';
import { isThenable } from '../../utils/is-thenable.js';

/** Receives a new value; a returned promise holds the change pending until it settles. */
export type PendingChangeHandler<T> = (value: T) => void | Promise<unknown>;

interface PendingChange<T> {
  /** The value shown: the pending one while a change settles, else the value in effect. */
  value: T;
  /** A change waits for the promise its handler returned. */
  isPending: boolean;
  /** Reports a new value; ignored while another change is pending. */
  change: (next: T) => void;
  /**
   * Puts back the value in effect when the hook mounted, as a native form reset does: it drops a
   * pending change, whose promise then changes nothing, and reports the value when it differs.
   */
  reset: () => void;
}

/** Whether two values are the same: equal, or arrays with the same items in order. */
function isSameValue<T>(left: T, right: T): boolean {
  if (Object.is(left, right)) return true;
  return Array.isArray(left) && Array.isArray(right) && isShallowEqual(left, right);
}

/**
 * A value the caller may control whose change may settle later. When `onChange` returns a promise,
 * the new value shows at once and stays pending until the promise settles: fulfilled, it takes
 * effect (an uncontrolled value keeps it); rejected, the value in effect shows again.
 */
export function usePendingChange<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: PendingChangeHandler<T> | undefined,
): PendingChange<T> {
  const [own, setOwn] = useState(defaultValue);
  const [initial] = useState(() => value ?? defaultValue);
  const [pending, setPending] = useState<{
    value: T;
    base: T;
    result: PromiseLike<unknown>;
  } | null>(null);
  const isControlled = value !== undefined;
  const current = isControlled ? value : own;
  const isStale =
    pending !== null && !isSameValue(current, pending.base) && !isSameValue(current, pending.value);
  if (isStale) setPending(null);
  const shown = pending && !isStale ? pending.value : current;

  useLayoutEffect(() => {
    if (!pending || isStale) return;
    let active = true;
    const settle = (isApplied: boolean) => {
      if (!active) return;
      if (isApplied && !isControlled) setOwn(pending.value);
      setPending(null);
    };
    pending.result.then(
      () => settle(true),
      () => settle(false),
    );
    return () => {
      active = false;
    };
  }, [pending, isStale, isControlled]);

  const change = (next: T) => {
    if (pending && !isStale) return;
    const result = onChange?.(next);
    if (!isThenable(result)) {
      if (!isControlled) setOwn(next);
      return;
    }
    // A handler can remove the choice before its pending effect commits.
    result.then(undefined, () => undefined);
    setPending({ value: next, base: current, result });
  };

  const reset = () => {
    setPending(null);
    if (!isControlled) setOwn(initial);
    if (isSameValue(current, initial)) return;
    const result = onChange?.(initial);
    // The caller reports its own failure; the reset stands.
    if (isThenable(result)) result.then(undefined, () => undefined);
  };

  return { value: shown, isPending: pending !== null && !isStale, change, reset };
}
