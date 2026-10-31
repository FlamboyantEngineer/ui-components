'use client';

import { useEffect, useRef, useState } from 'react';
import { useLatest } from './use-latest.js';

/** One page of a search's results; a `cursor` means another page follows. */
interface RemoteSearchPage<T> {
  items: readonly T[];
  /** Passed back to the loader to fetch the next page; absent on the last page. */
  cursor?: string | undefined;
}

/**
 * Fetches the results matching a query, or with `cursor` the page after the one that returned it;
 * it should stop when `signal` aborts.
 */
export type RemoteSearchLoader<T> = (
  query: string,
  signal: AbortSignal,
  cursor?: string,
) => Promise<RemoteSearchPage<T>>;

interface RemoteSearchOptions<T> {
  /** Without a loader nothing is searched. */
  load?: RemoteSearchLoader<T> | undefined;
  /**
   * What the results come from, such as the caller's own loader, as `load` may be a fresh adapter
   * each render. A new source ends the running search and the paging of the results.
   */
  source: unknown;
  /** Shortest trimmed query that runs a search. Defaults to 1. */
  minSearchLength?: number | undefined;
  /** Milliseconds to wait after the last keystroke before searching. Defaults to 240. */
  searchDelay?: number | undefined;
}

export interface RemoteSearch<T> {
  /** The results of the latest search, its pages appended. */
  results: readonly T[];
  isLoading: boolean;
  /** The next page is loading. */
  isLoadingMore: boolean;
  /** The latest results have another page. */
  hasMore: boolean;
  hasFailed: boolean;
  /** The query of the latest search. */
  query: string;
  /** The query is too short to search. */
  isTooShort: boolean;
  /** The shortest query that searches. */
  minSearchLength: number;
  /** Searches `query` once typing pauses for the search delay. */
  search(query: string): void;
  /** Searches `query` at once, as when a list opens or the source changes. */
  searchNow(query: string): void;
  /** Loads the next page of the latest results. */
  loadMore(): void;
}

const defaultSearchDelay = 240;

function wait(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

/**
 * One search: its query, its source and the pages it has loaded so far. A `cursor` belongs to the
 * search whose page returned it, and `scope` (aborted when a newer search starts) is that search's
 * lifetime.
 */
interface SearchState<T> {
  query: string;
  source: unknown;
  items: readonly T[];
  cursor: string | undefined;
  status: 'idle' | 'loading' | 'loadingMore' | 'failed';
  scope: AbortController;
}

/** Whether the shown results may load their next page: not while searching or after a failure. */
const canPage = (status: SearchState<unknown>['status']) =>
  status === 'idle' || status === 'loadingMore';

function createState<T>(query: string, source: unknown, items: readonly T[] = []): SearchState<T> {
  return { query, source, items, cursor: undefined, status: 'idle', scope: new AbortController() };
}

/** The search state, read synchronously by the handlers and rendered from React state. */
function useSearchState<T>(source: unknown) {
  const [state, setState] = useState<SearchState<T>>(() => createState('', source));
  const current = useRef(state);
  const commit = (next: SearchState<T>) => {
    current.current = next;
    setState(next);
  };
  useEffect(() => () => current.current.scope.abort(), []);
  return { state, current, commit };
}

/**
 * Searches through the caller's loader as the query changes, after a pause in typing, and loads the
 * next page of the results on request. Each search owns its pages: starting another aborts it, and
 * whatever it returns after that is dropped, so only the latest search's pages show and its cursor
 * is only ever passed back with its own query and source. A new source aborts the running search and
 * keeps the results shown without a next page until the caller searches again. While a search runs
 * the previous results stay in view without a next page; a failed search lists nothing and reports
 * the failure until the next search, and a failed next page keeps the pages already shown.
 */
export function useRemoteSearch<T>({
  load,
  source,
  minSearchLength = 1,
  searchDelay = defaultSearchDelay,
}: RemoteSearchOptions<T>): RemoteSearch<T> {
  const { state, current, commit } = useSearchState<T>(source);
  const loader = useLatest(load);
  const latestSource = useLatest(source);
  const isCurrent = (scope: AbortController) =>
    current.current.scope === scope && !scope.signal.aborted;
  const start = async (query: string, isImmediate: boolean) => {
    if (!load) return;
    current.current.scope.abort();
    const trimmed = query.trim();
    if (trimmed.length < minSearchLength) return commit(createState(query, source));
    const next = {
      ...createState(query, source, current.current.items),
      status: 'loading' as const,
    };
    commit(next);
    const { signal } = next.scope;
    try {
      if (!isImmediate) await wait(searchDelay, signal);
      // A first page is asked for with the query alone, as a loader without pages expects.
      const page = await (loader.current ?? load)(trimmed, signal);
      if (isCurrent(next.scope))
        commit({ ...next, items: page.items, cursor: page.cursor, status: 'idle' });
    } catch {
      if (isCurrent(next.scope)) commit({ ...next, items: [], status: 'failed' });
    }
  };
  const loadMore = async () => {
    const from = current.current;
    const run = loader.current;
    if (!run || from.status !== 'idle' || from.cursor === undefined) return;
    if (from.source !== latestSource.current) return;
    commit({ ...from, status: 'loadingMore' });
    try {
      const page = await run(from.query.trim(), from.scope.signal, from.cursor);
      if (!isCurrent(from.scope)) return;
      commit({ ...from, items: [...from.items, ...page.items], cursor: page.cursor });
    } catch {
      if (isCurrent(from.scope)) commit({ ...from, status: 'failed' });
    }
  };
  // Like a list that loads as it mounts, the empty query searches at once where it is long enough.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the first search runs once
  useEffect(() => void start('', false), []);
  // A search belongs to the source it ran against: another source ends it and its paging.
  useEffect(() => {
    const from = current.current;
    if (from.source === source) return;
    from.scope.abort();
    commit(createState(from.query, source, from.items));
  }, [source, current, commit]);
  const isTooShort = state.query.trim().length < minSearchLength;
  return {
    results: state.items,
    isLoading: Boolean(load) && state.status === 'loading' && !isTooShort,
    isLoadingMore: state.status === 'loadingMore',
    hasMore:
      state.cursor !== undefined && canPage(state.status) && state.source === source && !isTooShort,
    hasFailed: state.status === 'failed',
    query: state.query,
    isTooShort,
    minSearchLength,
    search: (query) => void start(query, false),
    searchNow: (query) => void start(query, true),
    loadMore: () => void loadMore(),
  };
}
