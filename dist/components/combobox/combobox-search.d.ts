import { type ReactNode } from 'react';
import { type RemoteSearch } from '../../utils/use-remote-search.js';
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
export type ComboboxLoader = (query: string, signal: AbortSignal, cursor?: string) => Promise<readonly ComboboxItem[] | ComboboxPage>;
export interface ComboboxSearchOptions {
    loadItems?: ComboboxLoader | undefined;
    minSearchLength?: number | undefined;
    searchDelay?: number | undefined;
    /** The list is open: only an open list searches. */
    isOpen: boolean;
    /** The input's text. */
    text: string;
}
/** What the combobox draws while its list holds no option. */
export interface ComboboxEmptyOptions {
    search: RemoteSearch<ComboboxItem> | null;
    renderEmptyState: (() => ReactNode) | undefined;
}
/**
 * Searches suggestions through `loadItems` while the list is open: at once when the list opens or
 * the loader changes, and after the search delay when the text changes. A closed list keeps the
 * latest results, so a picked option stays in the collection that names it.
 */
export declare function useComboboxSearch({ loadItems, minSearchLength, searchDelay, isOpen, text, }: ComboboxSearchOptions): RemoteSearch<ComboboxItem> | null;
/**
 * The empty list's content: the search status while searching, after a failure or while the text is
 * too short, else the caller's empty state or the provider's `noResults`.
 */
export declare function useEmptyContent({ search, renderEmptyState }: ComboboxEmptyOptions): () => ReactNode;
//# sourceMappingURL=combobox-search.d.ts.map