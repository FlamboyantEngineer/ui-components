import { type RemoteSearch } from '../../utils/use-remote-search.js';
import { type SelectFieldOption } from './select-options.js';
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
export type SelectFieldLoader = (query: string, signal: AbortSignal, cursor?: string) => Promise<readonly SelectFieldOption[] | SelectFieldPage>;
export interface SelectSearchOptions {
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
 * option a search returns.
 */
export declare function useSelectSearch({ loadOptions, minSearchLength, searchDelay, }: SelectSearchOptions): SelectSearch;
//# sourceMappingURL=select-search.d.ts.map