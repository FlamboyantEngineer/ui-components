'use client';

import { useEffect, useRef } from 'react';
import {
  type RemoteLoader,
  type RemotePage,
  type RemoteSearch,
  useRemoteSearch,
} from '../../utils/use-remote-search.js';
import type { ComboboxItem } from './combobox-options.js';

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
  });
  const query = loadItems && isOpen ? text : null;
  const last = useRef<{ query: string | null; loadItems: ComboboxLoader | undefined }>({
    query: null,
    loadItems,
  });
  // Searching reaches outside React, so it follows the rendered text, open state and loader.
  useEffect(() => {
    const previous = last.current;
    last.current = { query, loadItems };
    if (query === null) return;
    if (previous.query === null || previous.loadItems !== loadItems) search.searchNow(query);
    else if (previous.query !== query) search.search(query);
  });
  return loadItems ? search : null;
}
