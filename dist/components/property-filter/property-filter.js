import { jsx as _jsx } from "react/jsx-runtime";
import { useRef } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { PropertyPanel } from '../property-panel/property-panel.js';
import { PropertyScope } from '../property-scope/property-scope.js';
import { SearchField } from '../search-field/search-field.js';
const hooks = createHooks('property-filter', ['search']);
/**
 * A property panel whose header holds a `SearchField` that filters every section, group, card and
 * row in the panel through a `PropertyScope`.
 */
export function PropertyFilter({ 'aria-label': label, placeholder, query: controlledQuery, defaultQuery = '', onQueryChange, filter, children, className, ...rest }) {
    const strings = useUiStrings();
    const [query, setQuery] = useControllableState(controlledQuery, defaultQuery, onQueryChange);
    const inputRef = useRef(null);
    const clearQuery = () => {
        setQuery('');
        inputRef.current?.focus();
    };
    return (_jsx(PropertyPanel, { ...rest, className: mergeClassNames(hooks.className, className), "aria-label": label, header: _jsx(SearchField, { className: hooks.slotClass('search'), label: strings.filterLabel(label), placeholder: placeholder, value: query, onChange: setQuery, inputRef: inputRef }), children: _jsx(PropertyScope, { query: query, filter: filter, onClear: clearQuery, children: children }) }));
}
//# sourceMappingURL=property-filter.js.map