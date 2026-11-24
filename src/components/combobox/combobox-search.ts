'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  type RemoteLoader,
  type RemotePage,
  type RemoteSearch,
  useRemoteSearch,
} from '../../utils/use-remote-search.js';
import { type ComboboxItem, mergeComboboxResults } from './combobox-options.js';

/** One page of a search's suggestions; a `cursor` means another page follows. */
export type ComboboxPage = RemotePage<ComboboxItem>;

/**
 * Fetches the suggestions (options or sections) matching the typed text, or with `cursor` the page
 * after the one that returned it; it should stop when `signal` aborts.
 */
export type ComboboxLoader = RemoteLoader<ComboboxItem>;

interface ComboboxSearchOptions {
  loadItems?: ComboboxLoader | undefined;
  minSearchLength?: number | undefined;
  searchDelay?: number | undefined;
  /** The list is open: only an open list searches. */
  isOpen: boolean;
  /** The input's text. */
  text: string;
}

/**
 * Searches suggestions through `loadItems` while the list is open: at once when the list opens or
 * the loader changes, and after the search delay when the text changes. A closed list keeps the
 * latest results, so a picked option stays in the collection that names it.
 */
export function useComboboxSearch({
  loadItems,
  minSearchLength,
  searchDelay,
  isOpen,
  text,
}: ComboboxSearchOptions): RemoteSearch<ComboboxItem> | null {
  const search = useRemoteSearch<ComboboxItem>({
    load: loadItems && isOpen ? loadItems : undefined,
    source: loadItems,
    minSearchLength,
    searchDelay,
    searchOnMount: false,
  });
  const query = loadItems && isOpen ? text : null;
  const last = useRef<{ query: string; loadItems: ComboboxLoader | undefined } | null>(null);
  // React can replay effects with the same refs after the search cleanup aborts the request.
  useEffect(
    () => () => {
      last.current = null;
    },
    [],
  );
  // Searching reaches outside React, so it follows the rendered text, open state and loader.
  useEffect(() => {
    const previous = last.current;
    last.current = query === null ? null : { query, loadItems };
    if (query === null) {
      if (previous) search.cancel();
      return;
    }
    if (!previous || previous.loadItems !== loadItems) search.searchNow(query);
    else if (previous.query !== query) search.search(query);
  });
  const results = useMemo(() => mergeComboboxResults(search.results), [search.results]);
  return loadItems ? { ...search, results } : null;
}
