'use client';

import { useEffect, useRef, useState } from 'react';
import {
  loadRemotePage,
  type RemoteLoader,
  type RemotePage,
  type RemoteSearch,
  useRemoteSearch,
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
  loadItems?: SelectFieldLoader | undefined;
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
  loadItems,
  minSearchLength,
  searchDelay,
}: SelectSearchOptions): SelectSearch {
  const [seen, setSeen] = useState<readonly SelectFieldOption[]>([]);
  const search = useRemoteSearch<SelectFieldOption>({
    load: loadItems
      ? async (query, signal, cursor) => {
          const page = await loadRemotePage(loadItems, { query, signal, cursor });
          if (!signal.aborted) setSeen((previous) => mergeSelectOptions(page.items, previous));
          return page;
        }
      : undefined,
    source: loadItems,
    minSearchLength,
    searchDelay,
  });
  const searchedWith = useRef(loadItems);
  // Searching reaches outside React, so a new loader searches once it renders.
  useEffect(() => {
    if (searchedWith.current === loadItems) return;
    searchedWith.current = loadItems;
    if (loadItems) search.searchNow(search.query);
  });
  return { ...search, seen };
}
