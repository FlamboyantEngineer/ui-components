import { useState } from 'react';

/** Receives a new value; a returned promise holds the change pending until it settles. */
export type PendingChangeHandler<T> = (value: T) => void | Promise<unknown>;

interface PendingChange<T> {
  /** The value shown: the pending one while a change settles, else the value in effect. */
  value: T;
  /** A change waits for the promise its handler returned. */
  isPending: boolean;
  /** Reports a new value; ignored while another change is pending. */
  change: (next: T) => void;
}

function isPromiseLike(result: unknown): result is PromiseLike<unknown> {
  return typeof (result as PromiseLike<unknown> | undefined)?.then === 'function';
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
  const [pending, setPending] = useState<{ value: T } | null>(null);
  const isControlled = value !== undefined;

  const change = (next: T) => {
    if (pending) return;
    const result = onChange?.(next);
    if (!isPromiseLike(result)) {
      if (!isControlled) setOwn(next);
      return;
    }
    setPending({ value: next });
    result.then(
      () => {
        if (!isControlled) setOwn(next);
        setPending(null);
      },
      // The caller reports its own failure; the choice only goes back.
      () => setPending(null),
    );
  };

  const current = isControlled ? value : own;
  return { value: pending ? pending.value : current, isPending: pending !== null, change };
}
