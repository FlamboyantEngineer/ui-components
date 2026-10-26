import { useEffect, useRef } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { useRemoteSearch, } from '../../utils/use-remote-search.js';
function toLoader(loadItems) {
    return async (query, signal, cursor) => {
        const result = cursor === undefined
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
export function useComboboxSearch({ loadItems, minSearchLength, searchDelay, isOpen, text, }) {
    const search = useRemoteSearch({
        load: loadItems && isOpen ? toLoader(loadItems) : undefined,
        minSearchLength,
        searchDelay,
    });
    const query = loadItems && isOpen ? text : null;
    const last = useRef({
        query: null,
        loadItems,
    });
    // Searching reaches outside React, so it follows the rendered text, open state and loader.
    useEffect(() => {
        const previous = last.current;
        last.current = { query, loadItems };
        if (query === null)
            return;
        if (previous.query === null || previous.loadItems !== loadItems)
            search.searchNow(query);
        else if (previous.query !== query)
            search.search(query);
    });
    return loadItems ? search : null;
}
/**
 * The empty list's content: the search status while searching, after a failure or while the text is
 * too short, else the caller's empty state or the provider's `noResults`.
 */
export function useEmptyContent({ search, renderEmptyState }) {
    const strings = useUiStrings();
    return () => {
        if (search?.isLoading)
            return strings.loading;
        if (search?.hasFailed)
            return strings.searchFailed;
        if (search?.isTooShort)
            return strings.typeToSearch(search.minSearchLength);
        return renderEmptyState ? renderEmptyState() : strings.noResults;
    };
}
//# sourceMappingURL=combobox-search.js.map