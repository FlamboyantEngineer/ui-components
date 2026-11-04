'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useLatest } from '../../utils/use-latest.js';
import { mapBounded } from './map-bounded.js';
import {
  createPageText,
  findMatchFrom,
  findTextMatches,
  groupMatchRanges,
  type PdfMatch,
  type PdfMatchRange,
  type PdfPageText,
  type PdfSearchOptions,
} from './pdf-search.js';
import { type LoadedPdf, pdfRequestLimit } from './use-pdf-document.js';
import type { PdfPagesController } from './use-pdf-pages.js';

interface UsePdfSearchOptions {
  loaded: Pick<LoadedPdf, 'pages' | 'getTextContent'> | null;
  pages: Pick<PdfPagesController, 'currentPage' | 'nearPages' | 'scrollToPage'>;
  /** The caller's query; `undefined` keeps the query in the viewer. */
  searchQuery?: string | undefined;
  onSearchQueryChange?: ((query: string) => void) | undefined;
  /** The caller's current match, taken modulo the number of matches; `undefined` keeps it in the viewer. */
  matchIndex?: number | undefined;
  onMatchIndexChange?: ((index: number) => void) | undefined;
  /** The caller's find options; `undefined` keeps them in the viewer. */
  searchOptions?: PdfSearchOptions | undefined;
  onSearchOptionsChange?: ((options: PdfSearchOptions) => void) | undefined;
}

/** What find controls read and do: the query, the result count and stepping through matches. */
export interface PdfSearchControls {
  query: string;
  setQuery(query: string): void;
  /** The find options in effect, each one set. */
  options: Required<PdfSearchOptions>;
  setOptions(options: PdfSearchOptions): void;
  /** A query is waiting for the document or its text. */
  isPending: boolean;
  total: number;
  /** The current match, zero-based. */
  current: number;
  findNext(): void;
  findPrevious(): void;
}

export interface PdfSearchState extends PdfSearchControls {
  /** Match ranges per page index. */
  rangesByPage: ReadonlyMap<number, PdfMatchRange[]>;
  /** Changes whenever the current match should be brought into view. */
  revealKey: number;
}

/** The viewer's own current match: reset to a new query's first match, moved by each step. */
interface OwnSelection {
  matches: readonly PdfMatch[];
  index: number;
  /** Counts resets and steps, so a step that lands on the same match still reveals it. */
  moves: number;
}

const emptyText: PdfPageText = { text: '', starts: [], lengths: [] };
const noOptions: PdfSearchOptions = {};

/** Every find option, with its default where it is not set. */
function resolveSearchOptions(options: PdfSearchOptions): Required<PdfSearchOptions> {
  return {
    highlightAll: options.highlightAll ?? true,
    matchCase: options.matchCase ?? false,
    ignoreAccents: options.ignoreAccents ?? false,
    wholeWords: options.wholeWords ?? false,
  };
}

/** Extracts every page's text once per document, while a query needs it. */
function usePageTexts(
  loaded: UsePdfSearchOptions['loaded'],
  isNeeded: boolean,
): PdfPageText[] | null {
  const [extracted, setExtracted] = useState<{
    loaded: NonNullable<UsePdfSearchOptions['loaded']>;
    texts: PdfPageText[];
  } | null>(null);
  const texts = extracted && extracted.loaded === loaded ? extracted.texts : null;
  useEffect(() => {
    if (!loaded || !isNeeded || texts) return undefined;
    let isCancelled = false;
    void mapBounded(
      loaded.pages.length,
      (pageIndex) => loaded.getTextContent(pageIndex).then(createPageText, () => emptyText),
      { limit: pdfRequestLimit, isCancelled: () => isCancelled },
    ).then((pageTexts) => {
      if (!isCancelled) setExtracted({ loaded, texts: pageTexts });
    });
    return () => {
      isCancelled = true;
    };
  }, [loaded, isNeeded, texts]);
  return texts;
}

function wrapIndex(index: number, total: number): number {
  return total > 0 ? ((Math.trunc(index) % total) + total) % total : 0;
}

/** A key that changes whenever the matches change or the current match is moved. */
function useRevealKey(matches: readonly PdfMatch[], move: number): number {
  const [reveal, setReveal] = useState({ matches, move, key: 0 });
  if (reveal.matches !== matches || reveal.move !== move) {
    setReveal({ matches, move, key: reveal.key + 1 });
  }
  return reveal.key;
}

/** The current match, kept by the viewer or by the caller, and the steps that move it. */
function useCurrentMatch(options: UsePdfSearchOptions, matches: readonly PdfMatch[]) {
  const { matchIndex, onMatchIndexChange, pages } = options;
  const [own, setOwn] = useState<OwnSelection>({ matches, index: 0, moves: 0 });
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
    if (matches.length > 0) report?.(findMatchFrom(matches, latestPages.currentPage));
  }, [matches, latest]);

  const step = (delta: number) => {
    if (total === 0) return;
    const next = wrapIndex(current + delta, total);
    if (!isControlled)
      setOwn((previous) => ({ ...previous, index: next, moves: previous.moves + 1 }));
    onMatchIndexChange?.(next);
  };
  return { current, revealKey, step };
}

/** The find options, kept by the viewer or by the caller. */
function useSearchOptions({ searchOptions, onSearchOptionsChange }: UsePdfSearchOptions) {
  const [current, setOptions] = useControllableState(
    searchOptions,
    noOptions,
    onSearchOptionsChange,
  );
  const resolved = resolveSearchOptions(current);
  const { highlightAll, matchCase, ignoreAccents, wholeWords } = resolved;
  const options = useMemo(
    () => ({ highlightAll, matchCase, ignoreAccents, wholeWords }),
    [highlightAll, matchCase, ignoreAccents, wholeWords],
  );
  return { options, setOptions };
}

/**
 * Find in the document: every match highlighted, one current match the reader steps through, and
 * the count. A query typed while the document loads runs once its text is available. The query,
 * the options and the current match are each the viewer's own unless the caller passes them.
 */
export function usePdfSearch(options: UsePdfSearchOptions): PdfSearchState {
  const { loaded, pages, onSearchQueryChange } = options;
  const { nearPages, scrollToPage } = pages;
  const [query, setQuery] = useControllableState(options.searchQuery, '', onSearchQueryChange);
  const isSearching = query.trim() !== '';
  const texts = usePageTexts(loaded, isSearching);
  const search = useSearchOptions(options);
  const { matchCase, ignoreAccents, wholeWords, highlightAll } = search.options;
  const matches = useMemo(
    () => (texts ? findTextMatches(texts, query, { matchCase, ignoreAccents, wholeWords }) : []),
    [texts, query, matchCase, ignoreAccents, wholeWords],
  );
  const { current, revealKey, step } = useCurrentMatch(options, matches);

  // A match on a page that is not rendered yet is reached by scrolling to its page first.
  const revealed = useRef(0);
  const currentMatch = matches[current];
  useEffect(() => {
    if (revealed.current === revealKey) return;
    revealed.current = revealKey;
    if (currentMatch && nearPages && !nearPages.has(currentMatch.pageIndex)) {
      scrollToPage(currentMatch.pageIndex);
    }
  }, [currentMatch, nearPages, scrollToPage, revealKey]);

  const rangesByPage = useMemo(
    () => groupMatchRanges(texts ?? [], matches, { current, highlightAll }),
    [texts, matches, current, highlightAll],
  );
  return {
    ...search,
    query,
    setQuery,
    isPending: isSearching && texts === null,
    total: matches.length,
    current,
    findNext: () => step(1),
    findPrevious: () => step(-1),
    rangesByPage,
    revealKey,
  };
}
