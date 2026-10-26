import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The parts around a list of tabs: scroll buttons, the "more" menu of hidden tabs and the add button.
import { useContext, useMemo } from 'react';
import { useLocale } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { useOverflowItems } from '../../utils/use-overflow-items.js';
import { scrollStripPage } from '../../utils/use-scroll-strip-overflow.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { Button, ScrollStripButton } from '../button/button.js';
import { TabsSharedContext } from './tab-actions.js';
import { tabsHooks as hooks } from './tab-hooks.js';
const noKeys = Object.freeze([]);
/** The menu entries of the hidden tabs: their text, disabled state and link. */
function toMenuEntries(state, keys, isDisabled) {
    return keys.map((key) => {
        const node = state.collection.getItem(key);
        const props = (node?.props ?? {});
        return {
            id: key,
            label: node?.textValue || String(key),
            isDisabled: isDisabled || state.disabledKeys.has(key) || props.isDisabled === true,
            href: props.href,
        };
    });
}
/** Which tabs a menu list keeps: the selected and focused tabs first, then from the start. */
export function useTabOverflow(state, isMenu) {
    const keys = isMenu && state ? [...state.collection].map((node) => node.key) : noKeys;
    const selectedKey = state?.selectedKey ?? null;
    const manager = state?.selectionManager;
    const focusedKey = manager?.isFocused ? manager.focusedKey : null;
    const overflow = useOverflowItems({
        items: keys,
        getPriority: (key) => (key === selectedKey ? 2 : key === focusedKey ? 1 : 0),
    });
    const visibleKeys = useMemo(() => new Set(overflow.visibleItems), [overflow.visibleItems]);
    return { ...overflow, visibleKeys: isMenu ? visibleKeys : null };
}
/** The parts around a list: scroll buttons, the "more" menu of hidden tabs and the add button. */
export function TabBar({ state, orientation, isMenu, hasButtons, menu, strip, onAdd, children, }) {
    const strings = useUiStrings();
    const { isDisabled } = useContext(TabsSharedContext);
    const rtl = useLocale().direction === 'rtl';
    const pageToward = (edge) => {
        if (!strip.stripRef.current)
            return;
        scrollStripPage(strip.stripRef.current, { edge, rtl });
        strip.syncOverflow();
    };
    const scrollButton = (edge) => hasButtons ? (_jsx(ScrollStripButton, { ...hooks.slot('scroll-button', { edge }), edge: edge, isHidden: !strip.overflow[edge], onPress: pageToward })) : null;
    return (_jsxs("div", { ref: isMenu ? menu.containerRef : undefined, ...hooks.slot('bar', { overflow: isMenu ? 'menu' : 'scroll', orientation }), children: [scrollButton('start'), children, scrollButton('end'), isMenu && menu.hiddenItems.length > 0 ? (_jsx("div", { ref: menu.indicatorRef, ...hooks.slot('overflow'), children: _jsx(DropdownMenu, { iconOnly: true, size: "sm", placement: "bottom end", label: strings.moreItems(menu.hiddenItems.length), isDisabled: isDisabled, items: toMenuEntries(state, menu.hiddenItems, isDisabled), onAction: (key) => state.setSelectedKey(key) }) })) : null, onAdd ? (_jsx(Button, { ...hooks.slot('add'), icon: "plus", label: strings.addTab, size: "sm", onPress: onAdd })) : null] }));
}
//# sourceMappingURL=tab-bar.js.map