'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useLatest } from '../../utils/use-latest.js';
import {
  findMatchFrom,
  findTextMatches,
  groupMatchRanges,
  markCurrentMatch,
  type PdfMatch,
  type PdfMatchRange,
  type PdfSearchOptions,
} from './pdf-search.js';
import type { LoadedPdf } from './use-pdf-document.js';
import { usePdfPageTexts } from './use-pdf-page-texts.js';
import type { PdfPagesController } from './use-pdf-pages.js';

interface UsePdfSearchOptions {
  loaded: Pick<LoadedPdf, 'pages' | 'getTextContent'> | null;
  isDocumentError?: boolean;
  pages: Pick<PdfPagesController, 'currentPage' | 'nearPages' | 'scrollToPage'>;
  /** The caller's query; `undefined` keeps the query in the viewer. */
  searchQuery?: string | undefined;
  onSearchQueryChange?: ((query: string) => void) | undefined;
  /** The caller's current match, taken modulo the number of matches; `undefined` keeps it in the viewer. */
  matchIndex?: number | undefined;
  /** Changes to reveal the current match again, including an unchanged controlled index. */
  matchRevealRequest?: number | undefined;
  onMatchIndexChange?: ((index: number) => void) | undefined;
  /** The caller's find options; `undefined` keeps them in the viewer. */
  searchOptions?: PdfSearchOptions | undefined;
  onSearchOptionsChange?: ((options: PdfSearchOptions) => void) | undefined;
}

/** One ordered result, with offsets into its page's source text. */
export interface PdfSearchResult {
  readonly pageIndex: number;
  readonly start: number;
  readonly end: number;
  readonly text: string;
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
  /** Text extraction state; errors never masquerade as a successful empty search. */
  status: 'idle' | 'loading' | 'ready' | 'unavailable' | 'error';
  /** Ordered results, shared with the viewer's highlighting pass. */
  results: readonly PdfSearchResult[];
  /** Activates an index in the complete result set, wrapping it. */
  selectResult(index: number): void;
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

function wrapIndex(index: number, total: number): number {
  return total > 0 ? ((Math.trunc(index) % total) + total) % total : 0;
}

/** A key that changes whenever the matches change or the current match is moved. */
function useRevealKey(matches: readonly PdfMatch[], move: number, request = 0): number {
  const [reveal, setReveal] = useState({ matches, move, request, key: 0 });
  if (reveal.matches !== matches || reveal.move !== move || reveal.request !== request) {
    setReveal({ matches, move, request, key: reveal.key + 1 });
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
  const revealKey = useRevealKey(
    matches,
    isControlled ? matchIndex : own.moves,
    options.matchRevealRequest,
  );

  // A new query starts at its first match on or after the current page, also for the caller.
  const latest = useLatest(options);
  useEffect(() => {
    const { pages: latestPages, onMatchIndexChange: report } = latest.current;
    if (matches.length > 0) report?.(findMatchFrom(matches, latestPages.currentPage));
  }, [matches, latest]);

  const selectResult = (index: number) => {
    if (total === 0) return;
    const next = wrapIndex(index, total);
    if (!isControlled)
      setOwn((previous) => ({ ...previous, index: next, moves: previous.moves + 1 }));
    onMatchIndexChange?.(next);
  };
  return { current, revealKey, selectResult };
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
  const extraction = usePdfPageTexts(loaded, isSearching);
  const texts = extraction?.texts ?? null;
  const search = useSearchOptions(options);
  const { matchCase, ignoreAccents, wholeWords, highlightAll } = search.options;
  const matches = useMemo(
    () => (texts ? findTextMatches(texts, query, { matchCase, ignoreAccents, wholeWords }) : []),
    [texts, query, matchCase, ignoreAccents, wholeWords],
  );
  const { current, revealKey, selectResult } = useCurrentMatch(options, matches);

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

  const results = useMemo(
    () =>
      matches.map((match) => ({
        ...match,
        text: texts?.[match.pageIndex]?.text ?? '',
      })),
    [matches, texts],
  );
  const status = !isSearching
    ? 'idle'
    : options.isDocumentError || extraction?.hasError
      ? 'error'
      : !texts
        ? 'loading'
        : texts.some((text) => text.text.trim())
          ? 'ready'
          : 'unavailable';
  // Every match is grouped once per search; stepping through them groups only the current page again.
  const allRanges = useMemo(
    () => groupMatchRanges(texts ?? [], matches, highlightAll),
    [texts, matches, highlightAll],
  );
  const rangesByPage = useMemo(
    () => markCurrentMatch(allRanges, { pages: texts ?? [], matches }, { current, highlightAll }),
    [allRanges, texts, matches, current, highlightAll],
  );
  return {
    ...search,
    query,
    setQuery,
    isPending: status === 'loading',
    status,
    results,
    selectResult,
    total: matches.length,
    current,
    findNext: () => selectResult(current + 1),
    findPrevious: () => selectResult(current - 1),
    rangesByPage,
    revealKey,
  };
}
