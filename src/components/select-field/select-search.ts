import { useState } from 'react';
import { useAsyncList } from 'react-aria-components';
import { mergeSelectOptions, type SelectFieldOption } from './select-options.js';

/** Fetches the options matching a query; it should stop when `signal` aborts. */
export type SelectFieldLoader = (
  query: string,
  signal: AbortSignal,
) => Promise<readonly SelectFieldOption[]>;

export interface SelectSearchOptions {
  loadOptions?: SelectFieldLoader | undefined;
  /** Shortest trimmed query that runs a search. */
  minSearchLength: number;
  /** Milliseconds to wait after the last keystroke before searching. */
  searchDelay: number;
}

export interface SelectSearch {
  /** The options of the latest search. */
  results: readonly SelectFieldOption[];
  /** Every option a search has returned while the field is mounted, so chosen ones keep labels. */
  seen: readonly SelectFieldOption[];
  isLoading: boolean;
  hasFailed: boolean;
  /** The query is too short to search. */
  isTooShort: boolean;
  search(query: string): void;
}

export const DEFAULT_SEARCH_DELAY = 240;

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
 * Searches options through the caller's loader as the query changes, after a pause in typing.
 * React Aria's async list aborts a superseded search, so only the latest results show.
 */
export function useSelectSearch({
  loadOptions,
  minSearchLength,
  searchDelay,
}: SelectSearchOptions): SelectSearch {
  const [seen, setSeen] = useState<readonly SelectFieldOption[]>([]);
  const list = useAsyncList<SelectFieldOption>({
    async load({ signal, filterText = '' }) {
      if (!loadOptions || filterText.trim().length < minSearchLength) return { items: [] };
      await wait(searchDelay, signal);
      const items = await loadOptions(filterText.trim(), signal);
      if (!signal.aborted) setSeen((previous) => mergeSelectOptions(items, previous));
      return { items };
    },
  });
  const isTooShort = list.filterText.trim().length < minSearchLength;
  const isLoading = list.loadingState === 'loading' || list.loadingState === 'filtering';
  return {
    results: list.items,
    seen,
    isLoading: Boolean(loadOptions) && isLoading && !isTooShort,
    hasFailed: list.loadingState === 'error',
    isTooShort,
    search: (query) => {
      if (loadOptions) list.setFilterText(query);
    },
  };
}
