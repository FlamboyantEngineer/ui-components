'use client';

import { useRef, useState } from 'react';
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
  const [pending, setPending] = useState<{ value: T } | null>(null);
  // Counts resets, so a change pending across one settles without effect.
  const resets = useRef(0);
  const isControlled = value !== undefined;
  const current = isControlled ? value : own;
  const shown = pending ? pending.value : current;

  const change = (next: T) => {
    if (pending) return;
    const result = onChange?.(next);
    if (!isThenable(result)) {
      if (!isControlled) setOwn(next);
      return;
    }
    setPending({ value: next });
    const generation = resets.current;
    const settle = (isApplied: boolean) => {
      if (generation !== resets.current) return;
      if (isApplied && !isControlled) setOwn(next);
      setPending(null);
    };
    result.then(
      () => settle(true),
      // The caller reports its own failure; the choice only goes back.
      () => settle(false),
    );
  };

  const reset = () => {
    resets.current += 1;
    setPending(null);
    if (!isControlled) setOwn(initial);
    if (isSameValue(current, initial)) return;
    const result = onChange?.(initial);
    // The caller reports its own failure; the reset stands.
    if (isThenable(result)) result.then(undefined, () => undefined);
  };

  return { value: shown, isPending: pending !== null, change, reset };
}
