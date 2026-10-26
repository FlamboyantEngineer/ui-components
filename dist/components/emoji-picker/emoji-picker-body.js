import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Tab, TabList, TabPanel, Tabs } from '../tabs/tabs.js';
import { useEmojiPickerContext } from './emoji-picker-context.js';
import { EmojiGrid } from './emoji-grid.js';
const hooks = createHooks('emoji-picker', ['categories', 'message']);
const categoryIcons = {
    recent: '🕘',
    custom: '✨',
    smileys: '😀',
    people: '👋',
    nature: '🐻',
    food: '🍔',
    travel: '🚗',
    activities: '⚽',
    objects: '💡',
    symbols: '🔣',
    flags: '🏁',
};
function EmojiMessage({ children, className, ...rest }) {
    return (_jsx("div", { ...rest, ...hooks.slot('message', undefined, className), role: "status", children: children }));
}
function EmojiTabs({ className, ...rest }) {
    const strings = useUiStrings();
    const { tabs, tab, setTabId, grid } = useEmojiPickerContext();
    return (_jsxs(Tabs, { ...rest, size: "sm", className: hooks.slot('categories', undefined, className).className, selectedKey: tab?.id, onSelectionChange: (key) => setTabId(String(key)), children: [_jsx(TabList, { "aria-label": strings.emojiCategories, children: tabs.map(({ id }) => (_jsx(Tab, { id: id, icon: _jsx("span", { children: categoryIcons[id] }), children: strings.emojiCategory(id) }, id))) }), tabs.map(({ id, entries }) => (_jsx(TabPanel, { id: id, children: _jsx(EmojiGrid, { ...grid, label: strings.emojiCategory(id), entries: entries }) }, id)))] }));
}
/** The loading or failure message, the category tabs, or the search results. */
export function EmojiPickerBody(props) {
    const strings = useUiStrings();
    const { data, search, grid } = useEmojiPickerContext();
    if (data.failed)
        return _jsx(EmojiMessage, { ...props, children: strings.emojiLoadFailed });
    if (!data.emoji)
        return _jsx(EmojiMessage, { ...props, children: strings.loading });
    if (!search.isSearching)
        return _jsx(EmojiTabs, { ...props });
    if (search.results.length === 0) {
        return _jsx(EmojiMessage, { ...props, children: strings.noResults });
    }
    return (_jsx(EmojiGrid, { ...grid, ...props, label: strings.emojiCategory('search'), entries: search.results }));
}
//# sourceMappingURL=emoji-picker-body.js.map