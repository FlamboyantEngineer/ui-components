import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo } from 'react';
import { createHooks } from '../../core/hooks.js';
import { findTermRanges, splitMatchTerms } from './match-ranges.js';
const noTerms = Object.freeze([]);
const TextMatchContext = createContext({
    terms: noTerms,
    matchWords: false,
    ignoreAccents: false,
    registerText: undefined,
});
const hooks = createHooks('text-match');
/** Supplies the query that every `TextMatch` below it highlights. Renders no element. */
export function TextMatchProvider({ query = '', matchWords = false, ignoreAccents = false, registerText, children, }) {
    const terms = useMemo(() => splitMatchTerms(query, { ignoreAccents }), [query, ignoreAccents]);
    const value = useMemo(() => ({ terms, matchWords, ignoreAccents, registerText }), [terms, matchWords, ignoreAccents, registerText]);
    return _jsx(TextMatchContext.Provider, { value: value, children: children });
}
/**
 * Shows a text with each occurrence of the nearest provider's terms wrapped in a `<mark>` that
 * names the term it matched in `data-term`. Without a provider, terms or a hit it returns the plain
 * text, with no element of its own.
 */
export function TextMatch({ children: text, className, ...rest }) {
    const { terms, matchWords, ignoreAccents, registerText } = useContext(TextMatchContext);
    useEffect(() => registerText?.(text), [registerText, text]);
    if (terms.length === 0)
        return text;
    const ranges = findTermRanges(text, terms, { matchWords, ignoreAccents });
    if (ranges.length === 0)
        return text;
    const parts = [];
    let cursor = 0;
    for (const range of ranges) {
        if (range.start > cursor)
            parts.push(text.slice(cursor, range.start));
        parts.push(_jsx("mark", { ...hooks.root({ className, props: rest, data: { term: range.term } }), children: text.slice(range.start, range.end) }, range.start));
        cursor = range.end;
    }
    if (cursor < text.length)
        parts.push(text.slice(cursor));
    return _jsx(_Fragment, { children: parts });
}
export { splitMatchTerms, textMatchesTerms } from './match-ranges.js';
//# sourceMappingURL=text-match.js.map