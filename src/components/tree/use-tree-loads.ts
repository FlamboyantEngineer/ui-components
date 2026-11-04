'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { toErrorMessage } from '../../utils/to-error-message.js';
import { useLatest } from '../../utils/use-latest.js';

/**
 * Where loading a branch's children stands: loading by one request, loaded, or failed with a
 * message. A request is identified by a token of its own, so a request whose branch left the items
 * cannot settle the branch that comes back under the same key.
 */
type BranchLoad = { request: symbol } | 'loaded' | { error: string };

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

function isRequest(load: BranchLoad | undefined): load is { request: symbol } {
  return typeof load === 'object' && 'request' in load;
}

/** The loads of the branches still listed, or `loads` itself when every one is. */
function pruneLoads(
  loads: ReadonlyMap<Key, BranchLoad>,
  isListed: (key: Key) => boolean,
): ReadonlyMap<Key, BranchLoad> {
  const gone = [...loads].filter(([key]) => !isListed(key));
  if (gone.length === 0) return loads;
  const kept = new Map(loads);
  for (const [key] of gone) kept.delete(key);
  return kept;
}

/**
 * Loading children on demand, branch by branch: `onLoad` may return a promise; while it is pending
 * the branch is loading, and a rejection keeps its message until the next attempt. A branch that
 * `isListed` no longer finds is forgotten with any request still running for it, so it asks again
 * if it comes back, and the old request's result is ignored.
 */
export function useTreeLoads(
  onLoad: ((key: Key) => unknown) | undefined,
  isListed: (key: Key) => boolean,
): TreeLoads {
  const strings = useUiStrings();
  const [loads, setLoads] = useState<ReadonlyMap<Key, BranchLoad>>(() => new Map());
  const [prunedFor, setPrunedFor] = useState(() => isListed);
  if (prunedFor !== isListed) {
    setPrunedFor(() => isListed);
    setLoads((current) => pruneLoads(current, isListed));
  }
  // Requests can repeat before the loading state renders: the running ones are tracked here too,
  // and forgotten with their branch, so a branch that comes back may ask again.
  const running = useRef(new Map<Key, symbol>());
  useLayoutEffect(() => {
    for (const key of [...running.current.keys()]) {
      if (!isListed(key)) running.current.delete(key);
    }
  }, [isListed]);
  const latest = useLatest(onLoad);
  return useMemo(() => {
    // Only the request a branch is still loading by settles it; an obsolete one changes nothing.
    const settle = (key: Key, request: symbol, next: BranchLoad) => {
      if (running.current.get(key) === request) running.current.delete(key);
      setLoads((current) => {
        const load = current.get(key);
        return isRequest(load) && load.request === request
          ? new Map(current).set(key, next)
          : current;
      });
    };
    return {
      load(key) {
        const run = latest.current;
        if (!run || running.current.has(key)) return;
        const request = Symbol(String(key));
        running.current.set(key, request);
        setLoads((current) => new Map(current).set(key, { request }));
        Promise.resolve()
          .then(() => run(key))
          .then(
            () => settle(key, request, 'loaded'),
            (error: unknown) =>
              settle(key, request, { error: toErrorMessage(error, strings.actionFailed) }),
          );
      },
      isLoading: (key) => isRequest(loads.get(key)),
      hasLoaded: (key) => loads.get(key) === 'loaded',
      errorOf(key) {
        const entry = loads.get(key);
        return typeof entry === 'object' && 'error' in entry ? entry.error : null;
      },
    };
  }, [loads, strings.actionFailed, latest]);
}
