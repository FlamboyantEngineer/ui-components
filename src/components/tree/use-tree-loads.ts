'use client';

import { toErrorMessage } from '../../utils/to-error-message.js';
import { useMemo, useRef, useState } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLatest } from '../../utils/use-latest.js';

/** Where loading a branch's children stands: loading, loaded, or failed with a message. */
type BranchLoad = 'loading' | 'loaded' | { error: string };

/** Loading the children of tree branches on demand, branch by branch. */
export interface TreeLoads {
  /** Asks the owner for a branch's children, unless they are loading already. */
  load: (key: Key) => void;
  isLoading: (key: Key) => boolean;
  /** Whether a load of the branch's children succeeded. */
  hasLoaded: (key: Key) => boolean;
  /** Why loading a branch's children failed, or `null`. */
  errorOf: (key: Key) => string | null;
}

/**
 * Loading children on demand, branch by branch: `onLoad` may return a promise; while it is pending
 * the branch is loading, and a rejection keeps its message until the next attempt.
 */
export function useTreeLoads(onLoad: ((key: Key) => unknown) | undefined): TreeLoads {
  const strings = useUiStrings();
  const [loads, setLoads] = useState<ReadonlyMap<Key, BranchLoad>>(() => new Map());
  // Requests can repeat before the loading state renders: the running ones are tracked here too.
  const running = useRef(new Set<Key>());
  const latest = useLatest(onLoad);
  return useMemo(() => {
    const settle = (key: Key, next: BranchLoad) => {
      if (next !== 'loading') running.current.delete(key);
      setLoads((current) => new Map(current).set(key, next));
    };
    return {
      load(key) {
        const run = latest.current;
        if (!run || running.current.has(key)) return;
        running.current.add(key);
        settle(key, 'loading');
        Promise.resolve()
          .then(() => run(key))
          .then(
            () => settle(key, 'loaded'),
            (error: unknown) => settle(key, { error: toErrorMessage(error, strings.actionFailed) }),
          );
      },
      isLoading: (key) => loads.get(key) === 'loading',
      hasLoaded: (key) => loads.get(key) === 'loaded',
      errorOf(key) {
        const entry = loads.get(key);
        return typeof entry === 'object' ? entry.error : null;
      },
    };
  }, [loads, strings.actionFailed, latest]);
}
