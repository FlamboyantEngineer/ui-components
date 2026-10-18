import { useState } from 'react';
import { useAsyncList } from '../../primitives/index.js';
import { mergeSelectOptions, type SelectFieldOption } from './select-options.js';

/** One page of a search's results; a `cursor` means another page follows. */
export interface SelectFieldPage {
  options: readonly SelectFieldOption[];
  /** Passed back to the loader to fetch the next page; absent on the last page. */
  cursor?: string | undefined;
}

/**
 * Fetches the options matching a query, or with `cursor` the page after the one that returned it; it
 * should stop when `signal` aborts.
 */
export type SelectFieldLoader = (
  query: string,
  signal: AbortSignal,
  cursor?: string,
) => Promise<readonly SelectFieldOption[] | SelectFieldPage>;

export interface SelectSearchOptions {
  loadOptions?: SelectFieldLoader | undefined;
  /** Shortest trimmed query that runs a search. Defaults to 1. */
  minSearchLength?: number | undefined;
  /** Milliseconds to wait after the last keystroke before searching. Defaults to 240. */
  searchDelay?: number | undefined;
}

export interface SelectSearch {
  /** The options of the latest search. */
  results: readonly SelectFieldOption[];
  /** Every option a search has returned while the field is mounted, so chosen ones keep labels. */
  seen: readonly SelectFieldOption[];
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
  search(query: string): void;
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

function toPage(result: readonly SelectFieldOption[] | SelectFieldPage): SelectFieldPage {
  return 'options' in result ? result : { options: result };
}

/**
 * Searches options through the caller's loader as the query changes, after a pause in typing, and
 * loads the next page of the results on request. React Aria's async list aborts a superseded
 * search, so only the latest results show.
 */
export function useSelectSearch({
  loadOptions,
  minSearchLength = 1,
  searchDelay = defaultSearchDelay,
}: SelectSearchOptions): SelectSearch {
  const [seen, setSeen] = useState<readonly SelectFieldOption[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const list = useAsyncList<SelectFieldOption, string>({
    async load({ signal, filterText = '', cursor }) {
      const query = filterText.trim();
      if (!loadOptions || query.length < minSearchLength) return { items: [] };
      if (cursor === undefined) await wait(searchDelay, signal);
      // A first page is asked for with the query alone, as a loader without pages expects.
      const result =
        cursor === undefined
          ? await loadOptions(query, signal)
          : await loadOptions(query, signal, cursor);
      const page = toPage(result);
      if (!signal.aborted) {
        setSeen((previous) => mergeSelectOptions(page.options, previous));
        setHasMore(Boolean(page.cursor));
      }
      return { items: page.options, cursor: page.cursor };
    },
  });
  const isTooShort = list.filterText.trim().length < minSearchLength;
  const isLoading = list.loadingState === 'loading' || list.loadingState === 'filtering';
  return {
    results: list.items,
    seen,
    isLoading: Boolean(loadOptions) && isLoading && !isTooShort,
    isLoadingMore: list.loadingState === 'loadingMore',
    hasMore: hasMore && !isTooShort,
    hasFailed: list.loadingState === 'error',
    isTooShort,
    minSearchLength,
    search: (query) => {
      if (loadOptions) list.setFilterText(query);
    },
    loadMore: () => list.loadMore(),
  };
}
