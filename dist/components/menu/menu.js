import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cloneElement, createContext, useContext } from 'react';
import { Autocomplete, AutocompleteStateContext, Input, ListLayout, Menu as AriaMenu, MenuContext, MenuLoadMoreItem, MenuTrigger as AriaMenuTrigger, SearchField, SubmenuTrigger as AriaSubmenuTrigger, useFilter, useSlottedContext, Virtualizer, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionSelectionProps } from '../../utils/collection-selection.js';
import { TextMatchProvider } from '../text-match/text-match.js';
import { MenuSizeContext } from './menu-context.js';
import { MenuTriggerPress } from './menu-trigger-press.js';
import { renderMenuChildren } from './menu-entries.js';
const hooks = createHooks('menu', [
    'search',
    'search-input',
    'empty',
    'load-more',
    'load-more-spinner',
]);
const MenuActionContext = createContext(undefined);
const defaultRowHeights = { sm: 24, md: 28, lg: 32 };
/** The loading sentinel: React Aria calls `onLoadMore` as it scrolls into view and shows the row while loading. */
function MenuLoader({ onLoadMore, isLoading }) {
    const strings = useUiStrings();
    return (_jsxs(MenuLoadMoreItem, { className: hooks.slotClass('load-more'), onLoadMore: onLoadMore, isLoading: isLoading, children: [_jsx("span", { ...hooks.slot('load-more-spinner'), "aria-hidden": "true" }), " ", strings.loading] }));
}
/**
 * The search field of a filterable menu over the menu (React Aria `Autocomplete`): the arrow keys
 * move through the items while focus stays in the field, which a menu opened from a trigger focuses.
 */
function MenuFilter({ isOpenedByTrigger, children, }) {
    const strings = useUiStrings();
    const { contains } = useFilter({ sensitivity: 'base' });
    return (_jsxs(Autocomplete, { filter: contains, children: [_jsx(SearchField, { className: hooks.slotClass('search'), "aria-label": strings.search, autoFocus: isOpenedByTrigger, children: _jsx(Input, { className: hooks.slotClass('search-input'), placeholder: strings.search }) }), children] }));
}
/** Hands the text typed in the enclosing React Aria `Autocomplete` to the `TextMatch` labels below. */
function AutocompleteMatches({ children }) {
    const query = useContext(AutocompleteStateContext)?.inputValue;
    return (_jsx(TextMatchProvider, { query: query, ignoreAccents: true, children: children }));
}
/** While loading, the loading row stands alone; a filtered menu with no match says so. */
function useEmptyState({ renderEmptyState, isLoading, filterable }) {
    const strings = useUiStrings();
    if (isLoading)
        return undefined;
    if (renderEmptyState || !filterable)
        return renderEmptyState;
    return () => _jsx("span", { ...hooks.slot('empty'), children: strings.noResults });
}
/** Renders only the rows in view (React Aria `Virtualizer` with a list layout). */
function MenuVirtualizer({ rowHeight, children, }) {
    const size = useContext(MenuSizeContext);
    const height = rowHeight ?? defaultRowHeights[size];
    return (_jsx(Virtualizer, { layout: ListLayout, layoutOptions: { rowHeight: height, loaderHeight: height }, children: children }));
}
/**
 * A list of actions or options (React Aria `Menu`), standalone or in a `MenuPopover`. A submenu's
 * `Menu` without its own `onAction` reports to the menu that opens it. It can lead with a search
 * field that filters its items, mark the typed text in their labels, render only the rows in view,
 * and end with a sentinel that loads more of them.
 */
export function Menu(props) {
    const { items, children, size, className, onAction, selectedKeys, defaultSelectedKeys, disabledKeys, onSelectionChange, filterable, highlightMatches = false, virtualized = false, rowHeight, onLoadMore, isLoading, ...rest } = props;
    const inheritedSize = useContext(MenuSizeContext);
    const inheritedAction = useContext(MenuActionContext);
    const resolvedSize = size ?? inheritedSize;
    const action = onAction ?? inheritedAction;
    const trigger = useSlottedContext(MenuContext);
    const renderEmptyState = useEmptyState(props);
    let menu = (_jsxs(AriaMenu, { ...rest, ...hooks.root({ className, props: rest, data: { size: resolvedSize, virtualized } }), onAction: action && ((key) => action(fromCollectionKey(key))), ...toCollectionSelectionProps({
            selectedKeys,
            defaultSelectedKeys,
            disabledKeys,
            onSelectionChange,
        }), renderEmptyState: renderEmptyState, children: [renderMenuChildren({ children, items, highlightMatches }), onLoadMore || isLoading ? (_jsx(MenuLoader, { onLoadMore: onLoadMore, isLoading: isLoading })) : null] }));
    if (virtualized)
        menu = _jsx(MenuVirtualizer, { rowHeight: rowHeight, children: menu });
    // An explicit `aria-label` names the menu instead of the trigger that would label it.
    if (rest['aria-label'] && trigger && 'aria-labelledby' in trigger) {
        const { 'aria-labelledby': _labelledBy, ...unlabelled } = trigger;
        menu = _jsx(MenuContext.Provider, { value: unlabelled, children: menu });
    }
    if (highlightMatches)
        menu = _jsx(AutocompleteMatches, { children: menu });
    if (filterable)
        menu = _jsx(MenuFilter, { isOpenedByTrigger: Boolean(trigger), children: menu });
    return (_jsx(MenuSizeContext.Provider, { value: resolvedSize, children: _jsx(MenuActionContext.Provider, { value: action, children: menu }) }));
}
/**
 * Opens its `MenuPopover` from its trigger (React Aria `MenuTrigger`): on press, Enter or Space,
 * and on Arrow Down or Arrow Up, which focus the first or last item.
 */
export function MenuTrigger({ children, ...openState }) {
    return (_jsx(AriaMenuTrigger, { ...openState, children: _jsx(MenuTriggerPress, { children: children }) }));
}
/**
 * Makes its `MenuItem` open the `MenuPopover` beside it (React Aria `SubmenuTrigger`). The item
 * ignores `focusableWhenDisabled`: hover and the arrow key would still open the submenu.
 */
export function SubmenuTrigger({ children }) {
    const [item, popover] = children;
    return (_jsxs(AriaSubmenuTrigger, { children: [cloneElement(item, { focusableWhenDisabled: false }), popover] }));
}
export { MenuItem, MenuSection, MenuSeparator } from './menu-item.js';
export { MenuOverlay, MenuPopover } from './menu-popover.js';
export { joinMenuGroups } from './menu-groups.js';
//# sourceMappingURL=menu.js.map