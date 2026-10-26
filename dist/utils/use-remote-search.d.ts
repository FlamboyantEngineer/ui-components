/** One page of a search's results; a `cursor` means another page follows. */
export interface RemoteSearchPage<T> {
    items: readonly T[];
    /** Passed back to the loader to fetch the next page; absent on the last page. */
    cursor?: string | undefined;
}
/**
 * Fetches the results matching a query, or with `cursor` the page after the one that returned it;
 * it should stop when `signal` aborts.
 */
export type RemoteSearchLoader<T> = (query: string, signal: AbortSignal, cursor?: string) => Promise<RemoteSearchPage<T>>;
export interface RemoteSearchOptions<T> {
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
/**
 * Searches through the caller's loader as the query changes, after a pause in typing, and loads the
 * next page of the results on request. React Aria's async list aborts a superseded search, so only
 * the latest results show.
 */
export declare function useRemoteSearch<T>({ load, minSearchLength, searchDelay, }: RemoteSearchOptions<T>): RemoteSearch<T>;
//# sourceMappingURL=use-remote-search.d.ts.map