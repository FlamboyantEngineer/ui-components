import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Autocomplete, Input, ListBox, ListBoxLoadMoreItem, ListLayout, Popover, PopoverContext, SearchField, useFilter, useSlottedContext, Virtualizer, } from '../../primitives/index.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { triggerWidthProperty, useLayerZIndex } from '../portal/portal.js';
import { SelectListItems } from './select-option.js';
import { flattenSelectItems } from './select-options.js';
const hooks = createHooks('select-field', [
    'popover',
    'search',
    'search-input',
    'loading',
    'listbox',
    'load-more',
    'empty',
]);
// Estimates the virtualizer starts from; it measures each row as it renders.
const listLayoutOptions = { estimatedRowSize: 32, estimatedHeadingSize: 26, loaderSize: 32 };
/** Starts typing after the filter text a key on the closed trigger seeded, not over it. */
function moveCaretToEnd(event) {
    const { length } = event.currentTarget.value;
    event.currentTarget.setSelectionRange(length, length);
}
function OptionList(props) {
    const strings = useUiStrings();
    const { items, more, emptyMessage, isMultiple, blockedKeys, renderOption } = props;
    const display = { isMultiple, blockedKeys, renderOption };
    const list = (_jsxs(ListBox, { className: hooks.slotClass('listbox'), renderEmptyState: () => _jsx("span", { ...hooks.slot('empty'), children: emptyMessage }), children: [_jsx(SelectListItems, { items: items, display: display }), more ? (_jsx(ListBoxLoadMoreItem, { className: hooks.slotClass('load-more'), isLoading: more.isLoading, onLoadMore: more.onLoadMore, children: strings.loading })) : null] }));
    if (!props.isVirtualized)
        return list;
    return (_jsx(Virtualizer, { layout: ListLayout, layoutOptions: listLayoutOptions, children: list }));
}
/**
 * The open list of a select field: a popover on the `dropdown` layer holding the options and
 * groups, led by a filter input when the list is filterable. Focus stays in the filter while the
 * arrow keys move through the options.
 */
export function SelectList(props) {
    const strings = useUiStrings();
    const zIndex = useLayerZIndex('dropdown');
    const { contains } = useFilter({ sensitivity: 'base' });
    const context = useSlottedContext(PopoverContext);
    const contextStyle = typeof context?.style === 'object' ? context.style : {};
    const descriptions = useMemo(() => new Map(flattenSelectItems(props.items).map((option) => [
        toCollectionKey(option.id),
        option.description,
    ])), [props.items]);
    const filter = (text, query, node) => {
        const description = descriptions.get(String(node.key));
        return contains(text, query) || Boolean(description && contains(description, query));
    };
    return (_jsxs(Popover, { ...hooks.slot('popover', { layer: 'dropdown' }), offset: 4, containerPadding: 8, style: { ...contextStyle, ...triggerWidthProperty, zIndex }, children: [props.isLoading && props.items.length > 0 ? (_jsx("div", { ...hooks.slot('loading'), role: "status", children: strings.loading })) : null, props.isFilterable ? (_jsxs(Autocomplete, { inputValue: props.filterText, onInputChange: props.onFilterTextChange, filter: props.filtersLocally ? filter : undefined, children: [_jsx(SearchField, { className: hooks.slotClass('search'), "aria-label": strings.search, autoFocus: true, children: _jsx(Input, { className: hooks.slotClass('search-input'), onFocus: moveCaretToEnd }) }), _jsx(OptionList, { ...props })] })) : (_jsx(OptionList, { ...props }))] }));
}
//# sourceMappingURL=select-list.js.map