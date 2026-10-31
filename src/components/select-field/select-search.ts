'use client';

import { useEffect, useRef, useState } from 'react';
import {
  loadRemotePage,
  useRemoteSearch,
  type RemoteLoader,
  type RemotePage,
  type RemoteSearch,
} from '../../utils/use-remote-search.js';
import { mergeSelectOptions, type SelectFieldOption } from './select-options.js';

/** One page of a search's results; a `cursor` means another page follows. */
export type SelectFieldPage = RemotePage<SelectFieldOption>;

/**
 * Fetches the options matching a query, or with `cursor` the page after the one that returned it; it
 * should stop when `signal` aborts.
 */
export type SelectFieldLoader = RemoteLoader<SelectFieldOption>;

interface SelectSearchOptions {
  loadOptions?: SelectFieldLoader | undefined;
  /** Shortest trimmed query that runs a search. Defaults to 1. */
  minSearchLength?: number | undefined;
  /** Milliseconds to wait after the last keystroke before searching. Defaults to 240. */
  searchDelay?: number | undefined;
}

export interface SelectSearch extends RemoteSearch<SelectFieldOption> {
  /** Every option a search has returned while the field is mounted, so chosen ones keep labels. */
  seen: readonly SelectFieldOption[];
}

/**
 * Searches options through the caller's loader with the shared remote search, remembering every
 * option a search returns. Another loader searches the latest query again from its first page.
 */
export function useSelectSearch({
  loadOptions,
  minSearchLength,
  searchDelay,
}: SelectSearchOptions): SelectSearch {
  const [seen, setSeen] = useState<readonly SelectFieldOption[]>([]);
  const search = useRemoteSearch<SelectFieldOption>({
    load: loadOptions
      ? async (query, signal, cursor) => {
          const page = await loadRemotePage(loadOptions, { query, signal, cursor });
          if (!signal.aborted) setSeen((previous) => mergeSelectOptions(page.items, previous));
          return page;
        }
      : undefined,
    source: loadOptions,
    minSearchLength,
    searchDelay,
  });
  const searchedWith = useRef(loadOptions);
  // Searching reaches outside React, so a new loader searches once it renders.
  useEffect(() => {
    if (searchedWith.current === loadOptions) return;
    searchedWith.current = loadOptions;
    if (loadOptions) search.searchNow(search.query);
  });
  return { ...search, seen };
}
