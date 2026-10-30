'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useUiStrings } from '../../core/provider.js';
import {
  useRemoteSearch,
  type RemoteSearch,
  type RemoteSearchLoader,
} from '../../utils/use-remote-search.js';
import type { ComboboxItem } from './combobox-options.js';

/** One page of a search's suggestions; a `cursor` means another page follows. */
export interface ComboboxPage {
  items: readonly ComboboxItem[];
  /** Passed back to the loader to fetch the next page; absent on the last page. */
  cursor?: string | undefined;
}

/**
 * Fetches the suggestions (options or sections) matching the typed text, or with `cursor` the page
 * after the one that returned it; it should stop when `signal` aborts.
 */
export type ComboboxLoader = (
  query: string,
  signal: AbortSignal,
  cursor?: string,
) => Promise<readonly ComboboxItem[] | ComboboxPage>;

interface ComboboxSearchOptions {
  loadItems?: ComboboxLoader | undefined;
  minSearchLength?: number | undefined;
  searchDelay?: number | undefined;
  /** The list is open: only an open list searches. */
  isOpen: boolean;
  /** The input's text. */
  text: string;
}

/** What the combobox draws while its list holds no option. */
interface ComboboxEmptyOptions {
  search: RemoteSearch<ComboboxItem> | null;
  renderEmptyState: (() => ReactNode) | undefined;
}

function toLoader(loadItems: ComboboxLoader): RemoteSearchLoader<ComboboxItem> {
  return async (query, signal, cursor) => {
    const result =
      cursor === undefined
        ? await loadItems(query, signal)
        : await loadItems(query, signal, cursor);
    return 'items' in result ? result : { items: result };
  };
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
    load: loadItems && isOpen ? toLoader(loadItems) : undefined,
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

/**
 * The empty list's content: the search status while searching, after a failure or while the text is
 * too short, else the caller's empty state or the provider's `noResults`.
 */
export function useEmptyContent({ search, renderEmptyState }: ComboboxEmptyOptions) {
  const strings = useUiStrings();
  return (): ReactNode => {
    if (search?.isLoading) return strings.loading;
    if (search?.hasFailed) return strings.searchFailed;
    if (search?.isTooShort) return strings.typeToSearch(search.minSearchLength);
    return renderEmptyState ? renderEmptyState() : strings.noResults;
  };
}
