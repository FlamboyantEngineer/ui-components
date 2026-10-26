import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { findMatches } from './code-ranges.js';
/** The first match that starts at or after `offset`, wrapping to the first. */
function firstFrom(matches, offset) {
    if (matches.length === 0)
        return -1;
    const index = matches.findIndex(({ start }) => start >= offset);
    return index === -1 ? 0 : index;
}
function selectionOf(input) {
    return input ? input.value.slice(input.selectionStart, input.selectionEnd) : '';
}
/**
 * Find and replace in a code editor: the matches of the query (ignoring case), the current one,
 * stepping through them and replacing one or all of them.
 */
export function useCodeSearch({ value, inputRef, applyEdit }) {
    const [isOpen, setOpen] = useState(false);
    const [query, setQueryState] = useState('');
    const [replacement, setReplacement] = useState('');
    const [anchor, setAnchor] = useState(0);
    const [focusRequest, setFocusRequest] = useState(0);
    const findRef = useRef(null);
    useLayoutEffect(() => {
        if (focusRequest === 0)
            return;
        findRef.current?.focus();
        findRef.current?.select();
    }, [focusRequest]);
    const matches = useMemo(() => (isOpen ? findMatches(value, query) : []), [isOpen, value, query]);
    const current = firstFrom(matches, anchor);
    const match = matches[current];
    const setQuery = (next) => {
        setAnchor(inputRef.current?.selectionStart ?? 0);
        setQueryState(next);
    };
    return {
        isOpen,
        query,
        replacement,
        matches,
        current,
        findRef,
        open() {
            const selected = selectionOf(inputRef.current);
            if (selected && !selected.includes('\n'))
                setQuery(selected);
            setOpen(true);
            setFocusRequest((request) => request + 1);
        },
        close() {
            setOpen(false);
            const input = inputRef.current;
            input?.focus();
            if (input && match)
                input.setSelectionRange(match.start, match.end);
        },
        setQuery,
        setReplacement,
        step(delta) {
            const next = matches[(current + delta + matches.length) % matches.length];
            if (next)
                setAnchor(next.start);
        },
        replace() {
            if (!match)
                return;
            const end = match.start + replacement.length;
            applyEdit({ ...match, text: replacement, selection: { start: end, end } });
            setAnchor(end);
        },
        replaceAll() {
            const first = matches[0];
            const last = matches.at(-1);
            if (!first || !last)
                return;
            const text = matches
                .map((range, index) => replacement + value.slice(range.end, matches[index + 1]?.start ?? range.end))
                .join('');
            const end = first.start + text.length;
            applyEdit({ start: first.start, end: last.end, text, selection: { start: end, end } });
        },
    };
}
//# sourceMappingURL=use-code-search.js.map