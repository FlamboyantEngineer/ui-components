'use client';

import { useRef, useState } from 'react';
import { useAsyncList } from '../primitives/index.js';

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
  /** The query is too short to search. */
  isTooShort: boolean;
  /** The shortest query that searches. */
  minSearchLength: number;
  /** Searches `query` once typing pauses for the search delay. */
  search(query: string): void;
  /** Searches `query` at once, as when a list opens or the loader changes. */
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
 * Searches through the caller's loader as the query changes, after a pause in typing, and loads the
 * next page of the results on request. React Aria's async list aborts a superseded search, so only
 * the latest results show.
 */
export function useRemoteSearch<T>({
  load,
  minSearchLength = 1,
  searchDelay = defaultSearchDelay,
}: RemoteSearchOptions<T>): RemoteSearch<T> {
  const [hasMore, setHasMore] = useState(false);
  const immediate = useRef(false);
  const list = useAsyncList<T, string>({
    async load({ signal, filterText = '', cursor }) {
      // The async list calls this synchronously, so the flag belongs to this search.
      const isImmediate = immediate.current;
      immediate.current = false;
      const query = filterText.trim();
      if (!load || query.length < minSearchLength) return { items: [] };
      if (cursor === undefined && !isImmediate) await wait(searchDelay, signal);
      // A first page is asked for with the query alone, as a loader without pages expects.
      const page =
        cursor === undefined ? await load(query, signal) : await load(query, signal, cursor);
      if (!signal.aborted) setHasMore(Boolean(page.cursor));
      return { items: page.items, cursor: page.cursor };
    },
  });
  const isTooShort = list.filterText.trim().length < minSearchLength;
  const isLoading = list.loadingState === 'loading' || list.loadingState === 'filtering';
  return {
    results: list.items,
    isLoading: Boolean(load) && isLoading && !isTooShort,
    isLoadingMore: list.loadingState === 'loadingMore',
    hasMore: hasMore && !isTooShort,
    hasFailed: list.loadingState === 'error',
    isTooShort,
    minSearchLength,
    search: (query) => {
      if (load) list.setFilterText(query);
    },
    searchNow: (query) => {
      if (!load) return;
      immediate.current = true;
      list.setFilterText(query);
    },
    loadMore: () => list.loadMore(),
  };
}
