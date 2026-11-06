'use client';

import { useEffect, useRef, useState } from 'react';
import { type CascaderOption, toCascaderPathKey } from './cascader-options.js';

/**
 * Loads the options under a branch: called with the branch, the path down to it and a signal that
 * aborts when the field unmounts. It resolves the branch's children; a rejection shows the failure
 * with a Retry button.
 */
export type CascaderLoader = (
  option: CascaderOption,
  context: { path: readonly CascaderOption[]; signal: AbortSignal },
) => Promise<readonly CascaderOption[]>;

/** Where the children of one branch stand. */
export type CascaderLoad =
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'ready'; options: readonly CascaderOption[] };

const toKey = (path: readonly CascaderOption[]) =>
  toCascaderPathKey(path.map((option) => option.id));

/**
 * The children the host loaded for branches, by path: each branch loads once, when it is first
 * opened, and again only through `retry` after a failure. Every load aborts when the field
 * unmounts, and an answer after that is dropped.
 */
export function useCascaderLoads(loader: CascaderLoader | undefined) {
  const [loads, setLoads] = useState<ReadonlyMap<string, CascaderLoad>>(new Map());
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    return () => controller.abort();
  }, []);
  const settle = (key: string, load: CascaderLoad) =>
    setLoads((current) => new Map(current).set(key, load));
  const start = (path: readonly CascaderOption[]) => {
    const branch = path.at(-1);
    const signal = controllerRef.current?.signal;
    if (!loader || !branch || !signal || signal.aborted) return;
    const key = toKey(path);
    settle(key, { status: 'loading' });
    void loader(branch, { path, signal }).then(
      (options) => {
        if (!signal.aborted) settle(key, { status: 'ready', options });
      },
      () => {
        if (!signal.aborted) settle(key, { status: 'failed' });
      },
    );
  };
  return {
    hasLoader: loader !== undefined,
    read: (path: readonly CascaderOption[]) => loads.get(toKey(path)),
    /** Loads a branch's children unless they are loading, loaded or failed. */
    load: (path: readonly CascaderOption[]) => {
      if (!loads.has(toKey(path))) start(path);
    },
    /** Loads a failed branch's children again. */
    retry: (path: readonly CascaderOption[]) => {
      if (loads.get(toKey(path))?.status === 'failed') start(path);
    },
  };
}
