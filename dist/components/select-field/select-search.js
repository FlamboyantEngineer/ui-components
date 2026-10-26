import { useState } from 'react';
import { useRemoteSearch } from '../../utils/use-remote-search.js';
import { mergeSelectOptions } from './select-options.js';
function toPage(result) {
    return 'options' in result ? result : { options: result };
}
/**
 * Searches options through the caller's loader with the shared remote search, remembering every
 * option a search returns.
 */
export function useSelectSearch({ loadOptions, minSearchLength, searchDelay, }) {
    const [seen, setSeen] = useState([]);
    const search = useRemoteSearch({
        load: loadOptions
            ? async (query, signal, cursor) => {
                const page = toPage(cursor === undefined
                    ? await loadOptions(query, signal)
                    : await loadOptions(query, signal, cursor));
                if (!signal.aborted)
                    setSeen((previous) => mergeSelectOptions(page.options, previous));
                return { items: page.options, cursor: page.cursor };
            }
            : undefined,
        minSearchLength,
        searchDelay,
    });
    return { ...search, seen };
}
//# sourceMappingURL=select-search.js.map