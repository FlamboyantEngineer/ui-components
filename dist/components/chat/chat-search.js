import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { FindBar } from '../find-bar/find-bar.js';
import { Button } from '../button/button.js';
import { chatHooks as hooks } from './chat-hooks.js';
import { findMessageMatches } from './chat-model.js';
/** Moves focus to the current match's message, else back to the toggle, once the bar closes. */
function focusAfterClose(highlightedId, toggle) {
    const message = highlightedId ? document.getElementById(highlightedId) : null;
    (message ?? toggle)?.focus();
}
/**
 * Searches the conversation's data rather than its mounted messages, so a virtualized history is
 * searched whole; the newest match is current first, and the steps wrap around.
 */
export function useChatSearch(messages) {
    const [isOpen, setOpen] = useState(false);
    const [query, setQueryState] = useState('');
    const [chosenId, setChosenId] = useState(null);
    const inputRef = useRef(null);
    const toggleRef = useRef(null);
    const barId = useId();
    const matches = useMemo(() => (isOpen ? findMessageMatches(messages, query) : []), [messages, query, isOpen]);
    const chosen = chosenId === null ? -1 : matches.indexOf(chosenId);
    const currentIndex = chosen >= 0 ? chosen : matches.length - 1;
    const highlightedId = matches[currentIndex];
    useEffect(() => {
        if (isOpen)
            inputRef.current?.focus();
    }, [isOpen]);
    const close = () => {
        setOpen(false);
        setQueryState('');
        setChosenId(null);
        focusAfterClose(highlightedId, toggleRef.current);
    };
    return {
        ...{ isOpen, query, matches, currentIndex, highlightedId, barId, inputRef, toggleRef },
        toggle: () => (isOpen ? close() : setOpen(true)),
        close,
        setQuery: (next) => {
            setQueryState(next);
            setChosenId(null);
        },
        step: (by) => {
            if (matches.length === 0)
                return;
            const next = (currentIndex + by + matches.length) % matches.length;
            setChosenId(matches[next] ?? null);
        },
    };
}
/** The button in the header that opens and closes the search. */
export function ChatSearchToggle({ search }) {
    const strings = useUiStrings();
    return (_jsx(Button, { ref: search.toggleRef, icon: "search", label: strings.chatSearch, size: "sm", "aria-expanded": search.isOpen, "aria-controls": search.isOpen ? search.barId : undefined, className: hooks.slotClass('search-toggle'), onPress: search.toggle }));
}
/** The find row under the header: the query, the match count, the steps and Close. */
export function ChatSearchBar({ search }) {
    const strings = useUiStrings();
    if (!search.isOpen)
        return null;
    return (_jsx(FindBar, { id: search.barId, label: strings.chatSearch, query: search.query, onQueryChange: search.setQuery, matchCount: search.query.trim() ? search.matches.length : undefined, currentIndex: search.currentIndex, onNext: () => search.step(1), onPrevious: () => search.step(-1), onClose: search.close, inputRef: search.inputRef, className: hooks.slotClass('search') }));
}
//# sourceMappingURL=chat-search.js.map