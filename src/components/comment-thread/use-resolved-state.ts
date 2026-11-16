'use client';

import { useState } from 'react';
import { isThenable } from '../../utils/is-thenable.js';

interface ResolvedStateOptions {
  isResolved: boolean | undefined;
  defaultResolved: boolean;
  onResolvedChange: ((isResolved: boolean) => void | Promise<unknown>) | undefined;
}

/**
 * The thread's resolved state, controlled or held here, and the toggle its button presses. A
 * returned promise holds the toggle pending: the state flips once it resolves, stays on a
 * rejection, and presses meanwhile do nothing.
 */
export function useResolvedState({
  isResolved,
  defaultResolved,
  onResolvedChange,
}: ResolvedStateOptions) {
  const [own, setOwn] = useState(defaultResolved);
  const [isPending, setPending] = useState(false);
  const resolved = isResolved ?? own;
  const toggle = () => {
    if (isPending || !onResolvedChange) return;
    const next = !resolved;
    const result = onResolvedChange(next);
    if (!isThenable(result)) {
      setOwn(next);
      return;
    }
    setPending(true);
    void Promise.resolve(result).then(
      () => {
        setOwn(next);
        setPending(false);
      },
      () => setPending(false),
    );
  };
  return { resolved, isPending, toggle };
}
