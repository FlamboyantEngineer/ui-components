import { useEffect, useMemo, useRef, useState } from 'react';
import { createPageText, findMatchFrom, findTextMatches, groupMatchRanges, } from './pdf-search.js';
import { useLatest } from '../../utils/use-latest.js';
const emptyText = { text: '', starts: [], lengths: [] };
const noOptions = {};
/** Every find option, with its default where it is not set. */
function resolveSearchOptions(options) {
    return {
        highlightAll: options.highlightAll ?? true,
        matchCase: options.matchCase ?? false,
        ignoreAccents: options.ignoreAccents ?? false,
        wholeWords: options.wholeWords ?? false,
    };
}
/** Extracts every page's text once per document, while a query needs it. */
function usePageTexts(loaded, isNeeded) {
    const [extracted, setExtracted] = useState(null);
    const texts = extracted && extracted.loaded === loaded ? extracted.texts : null;
    useEffect(() => {
        if (!loaded || !isNeeded || texts)
            return undefined;
        let isCancelled = false;
        void Promise.all(loaded.pages.map((_, pageIndex) => loaded.getTextContent(pageIndex).then(createPageText, () => emptyText))).then((pageTexts) => {
            if (!isCancelled)
                setExtracted({ loaded, texts: pageTexts });
        });
        return () => {
            isCancelled = true;
        };
    }, [loaded, isNeeded, texts]);
    return texts;
}
function wrapIndex(index, total) {
    return total > 0 ? ((Math.trunc(index) % total) + total) % total : 0;
}
/** A key that changes whenever the matches change or the current match is moved. */
function useRevealKey(matches, move) {
    const [reveal, setReveal] = useState({ matches, move, key: 0 });
    if (reveal.matches !== matches || reveal.move !== move) {
        setReveal({ matches, move, key: reveal.key + 1 });
    }
    return reveal.key;
}
/** The current match, kept by the viewer or by the caller, and the steps that move it. */
function useCurrentMatch(options, matches) {
    const { matchIndex, onMatchIndexChange, pages } = options;
    const [own, setOwn] = useState({ matches, index: 0, moves: 0 });
    if (own.matches !== matches) {
        setOwn({ matches, index: findMatchFrom(matches, pages.currentPage), moves: own.moves + 1 });
    }
    const total = matches.length;
    const isControlled = matchIndex !== undefined;
    const current = isControlled ? wrapIndex(matchIndex, total) : own.index;
    const revealKey = useRevealKey(matches, isControlled ? matchIndex : own.moves);
    // A new query starts at its first match on or after the current page, also for the caller.
    const latest = useLatest(options);
    useEffect(() => {
        const { pages: latestPages, onMatchIndexChange: report } = latest.current;
        if (matches.length > 0)
            report?.(findMatchFrom(matches, latestPages.currentPage));
    }, [matches, latest]);
    const step = (delta) => {
        if (total === 0)
            return;
        const next = wrapIndex(current + delta, total);
        if (!isControlled)
            setOwn((previous) => ({ ...previous, index: next, moves: previous.moves + 1 }));
        onMatchIndexChange?.(next);
    };
    return { current, revealKey, step };
}
/** The find options, kept by the viewer or by the caller. */
function useSearchOptions({ searchOptions, onSearchOptionsChange }) {
    const [own, setOwn] = useState(noOptions);
    const resolved = resolveSearchOptions(searchOptions ?? own);
    const { highlightAll, matchCase, ignoreAccents, wholeWords } = resolved;
    const options = useMemo(() => ({ highlightAll, matchCase, ignoreAccents, wholeWords }), [highlightAll, matchCase, ignoreAccents, wholeWords]);
    const setOptions = (next) => {
        if (searchOptions === undefined)
            setOwn(next);
        onSearchOptionsChange?.(next);
    };
    return { options, setOptions };
}
/**
 * Find in the document: every match highlighted, one current match the reader steps through, and
 * the count. A query typed while the document loads runs once its text is available. The query,
 * the options and the current match are each the viewer's own unless the caller passes them.
 */
export function usePdfSearch(options) {
    const { loaded, pages, onSearchQueryChange } = options;
    const { nearPages, scrollToPage } = pages;
    const [ownQuery, setOwnQuery] = useState('');
    const query = options.searchQuery ?? ownQuery;
    const isSearching = query.trim() !== '';
    const texts = usePageTexts(loaded, isSearching);
    const search = useSearchOptions(options);
    const { matchCase, ignoreAccents, wholeWords, highlightAll } = search.options;
    const matches = useMemo(() => (texts ? findTextMatches(texts, query, { matchCase, ignoreAccents, wholeWords }) : []), [texts, query, matchCase, ignoreAccents, wholeWords]);
    const { current, revealKey, step } = useCurrentMatch(options, matches);
    // A match on a page that is not rendered yet is reached by scrolling to its page first.
    const revealed = useRef(0);
    const currentMatch = matches[current];
    useEffect(() => {
        if (revealed.current === revealKey)
            return;
        revealed.current = revealKey;
        if (currentMatch && nearPages && !nearPages.has(currentMatch.pageIndex)) {
            scrollToPage(currentMatch.pageIndex);
        }
    }, [currentMatch, nearPages, scrollToPage, revealKey]);
    const rangesByPage = useMemo(() => groupMatchRanges(texts ?? [], matches, { current, highlightAll }), [texts, matches, current, highlightAll]);
    return {
        ...search,
        query,
        setQuery(next) {
            if (options.searchQuery === undefined)
                setOwnQuery(next);
            onSearchQueryChange?.(next);
        },
        isPending: isSearching && texts === null,
        total: matches.length,
        current,
        findNext: () => step(1),
        findPrevious: () => step(-1),
        rangesByPage,
        revealKey,
    };
}
//# sourceMappingURL=use-pdf-search.js.map