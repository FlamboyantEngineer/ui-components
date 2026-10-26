import { useRef, useState } from 'react';
import { useAsyncList } from '../primitives/index.js';
const defaultSearchDelay = 240;
function wait(milliseconds, signal) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, milliseconds);
        signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(signal.reason);
        }, { once: true });
    });
}
/**
 * Searches through the caller's loader as the query changes, after a pause in typing, and loads the
 * next page of the results on request. React Aria's async list aborts a superseded search, so only
 * the latest results show.
 */
export function useRemoteSearch({ load, minSearchLength = 1, searchDelay = defaultSearchDelay, }) {
    const [hasMore, setHasMore] = useState(false);
    const immediate = useRef(false);
    const list = useAsyncList({
        async load({ signal, filterText = '', cursor }) {
            // The async list calls this synchronously, so the flag belongs to this search.
            const isImmediate = immediate.current;
            immediate.current = false;
            const query = filterText.trim();
            if (!load || query.length < minSearchLength)
                return { items: [] };
            if (cursor === undefined && !isImmediate)
                await wait(searchDelay, signal);
            // A first page is asked for with the query alone, as a loader without pages expects.
            const page = cursor === undefined ? await load(query, signal) : await load(query, signal, cursor);
            if (!signal.aborted)
                setHasMore(Boolean(page.cursor));
            return { items: page.items, cursor: page.cursor };
        },
    });
    const isTooShort = list.filterText.trim().length < minSearchLength;
    const isLoading = list.loadingState === 'loading' || list.loadingState === 'filtering';
    return {
        results: list.items,
        isLoading: Boolean(load) && isLoading && !isTooShort,
        isLoadingMore: list.loadingState === 'loadingMore',
        hasMore: hasMore && !isTooShort,
        hasFailed: list.loadingState === 'error',
        isTooShort,
        minSearchLength,
        search: (query) => {
            if (load)
                list.setFilterText(query);
        },
        searchNow: (query) => {
            if (!load)
                return;
            immediate.current = true;
            list.setFilterText(query);
        },
        loadMore: () => list.loadMore(),
    };
}
//# sourceMappingURL=use-remote-search.js.map