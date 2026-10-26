import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { GridList, useFilter } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { SearchField } from '../search-field/search-field.js';
import { Skeleton, SkeletonText } from '../skeleton/skeleton.js';
import { TextMatchProvider } from '../text-match/text-match.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { ChatListRow, listHooks } from './chat-list-row.js';
const currentTime = () => new Date();
/** How many placeholder rows stand in for the conversations while they load. */
const skeletonRows = 4;
/** The conversations the search keeps: all of them while the host searches or the text is blank. */
function useShownConversations({ conversations, onSearchChange }, query) {
    const { contains } = useFilter({ sensitivity: 'base' });
    const text = query.trim();
    if (onSearchChange || !text)
        return conversations;
    return conversations.filter((conversation) => contains(conversation.title, text) || contains(conversation.lastMessage ?? '', text));
}
/** Placeholder rows and a loading announcement. */
function LoadingRows() {
    const strings = useUiStrings();
    return (_jsxs(_Fragment, { children: [Array.from({ length: skeletonRows }, (_, row) => (_jsxs("div", { ...listHooks.slot('skeleton'), children: [_jsx(Skeleton, { shape: "circle" }), _jsx(SkeletonText, { lines: 2 })] }, row))), _jsx(VisuallyHidden, { role: "status", children: strings.loadingConversations })] }));
}
/** What the list shows without rows: loading rows, the empty state or the no-match notice. */
function ListEmptyState({ isLoading, isSearching, emptyState, }) {
    const strings = useUiStrings();
    if (isLoading)
        return _jsx(LoadingRows, {});
    return (_jsx("div", { ...listHooks.slot('empty'), children: isSearching ? (_jsx(EmptyState, { size: "sm", description: strings.noMatchingConversations })) : ((emptyState ?? _jsx(EmptyState, { size: "sm", description: strings.noConversations }))) }));
}
/** The search field and, given `onNew`, the New chat button. */
function ListHeader({ query, onSearch, onNew, }) {
    const strings = useUiStrings();
    return (_jsxs("div", { ...listHooks.slot('header'), children: [_jsx(SearchField, { label: strings.searchConversations, placeholder: strings.searchConversations, size: "sm", value: query, onChange: onSearch, className: listHooks.slotClass('search') }), onNew ? (_jsx(Button, { size: "sm", startIcon: "plus", onPress: onNew, className: listHooks.slotClass('new'), children: strings.newChat })) : null] }));
}
/**
 * A list of conversations to open: a search field, a New chat button and a React Aria grid list of
 * rows with an avatar, title, time, last message, muted mark, unread count and the host's actions.
 * One conversation is selected at a time; arrow keys move between rows and into a row's controls.
 */
export function ChatList({ conversations, selectedId, onSelectionChange, onSearchChange, onNew, isLoading = false, emptyState, renderActions, getNow = currentTime, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, className, ...rest }) {
    const strings = useUiStrings();
    const [query, setQuery] = useState('');
    const [ownSelection, setOwnSelection] = useState(null);
    const shown = useShownConversations({ conversations, onSearchChange }, query);
    const selected = selectedId === undefined ? ownSelection : selectedId;
    const select = (keys) => {
        const [key] = keys === 'all' ? [] : [...keys];
        if (key === undefined)
            return;
        setOwnSelection(String(key));
        onSelectionChange?.(String(key));
    };
    return (_jsxs("div", { ...rest, ...listHooks.root({ className, props: rest, data: { loading: isLoading } }), "aria-busy": isLoading || undefined, children: [_jsx(ListHeader, { query: query, onSearch: (value) => {
                    setQuery(value);
                    onSearchChange?.(value);
                }, onNew: onNew }), _jsx(TextMatchProvider, { query: query, ignoreAccents: true, children: _jsx(GridList, { "aria-label": ariaLabelledby ? undefined : (ariaLabel ?? strings.conversations), "aria-labelledby": ariaLabelledby, className: listHooks.slotClass('list'), items: isLoading ? [] : shown, selectionMode: "single", disallowEmptySelection: true, selectedKeys: selected === null ? [] : [selected], onSelectionChange: select, dependencies: [renderActions, getNow], renderEmptyState: () => (_jsx(ListEmptyState, { isLoading: isLoading, isSearching: query.trim() !== '', emptyState: emptyState })), children: (conversation) => (_jsx(ChatListRow, { conversation: conversation, renderActions: renderActions, getNow: getNow })) }) })] }));
}
//# sourceMappingURL=chat-list.js.map