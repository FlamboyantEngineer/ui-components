import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createPageText,
  findMatchFrom,
  findTextMatches,
  groupMatchRanges,
  type PdfMatch,
  type PdfMatchRange,
  type PdfPageText,
} from './pdf-search.js';
import type { LoadedPdf } from './use-pdf-document.js';
import type { PdfPagesController } from './use-pdf-pages.js';

export interface UsePdfSearchOptions {
  loaded: Pick<LoadedPdf, 'pages' | 'getTextContent'> | null;
  pages: Pick<PdfPagesController, 'currentPage' | 'nearPages' | 'scrollToPage'>;
}

export interface PdfSearchState {
  query: string;
  setQuery(query: string): void;
  /** A query is waiting for the document or its text. */
  isPending: boolean;
  total: number;
  /** The current match, zero-based. */
  current: number;
  findNext(): void;
  findPrevious(): void;
  /** Match ranges per page index. */
  rangesByPage: ReadonlyMap<number, PdfMatchRange[]>;
  /** Changes whenever the current match should be brought into view. */
  revealKey: number;
}

interface Selection {
  matches: readonly PdfMatch[];
  index: number;
  revealKey: number;
}

const emptyText: PdfPageText = { text: '', starts: [], lengths: [] };

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
    void Promise.all(
      loaded.pages.map((_, pageIndex) =>
        loaded.getTextContent(pageIndex).then(createPageText, () => emptyText),
      ),
    ).then((pageTexts) => {
      if (!isCancelled) setExtracted({ loaded, texts: pageTexts });
    });
    return () => {
      isCancelled = true;
    };
  }, [loaded, isNeeded, texts]);
  return texts;
}

/**
 * Find in the document: every match highlighted, one current match the reader steps through, and
 * the count. A query typed while the document loads runs once its text is available.
 */
export function usePdfSearch({ loaded, pages }: UsePdfSearchOptions): PdfSearchState {
  const { currentPage, nearPages, scrollToPage } = pages;
  const [query, setQuery] = useState('');
  const isSearching = query.trim() !== '';
  const texts = usePageTexts(loaded, isSearching);
  const matches = useMemo(() => (texts ? findTextMatches(texts, query) : []), [texts, query]);
  const [selection, setSelection] = useState<Selection>({ matches, index: 0, revealKey: 0 });
  if (selection.matches !== matches) {
    const index = findMatchFrom(matches, currentPage);
    setSelection({ matches, index, revealKey: selection.revealKey + 1 });
  }
  const total = matches.length;
  const step = useCallback(
    (delta: number) =>
      setSelection((previous) => ({
        ...previous,
        index: (previous.index + delta + total) % Math.max(total, 1),
        revealKey: previous.revealKey + 1,
      })),
    [total],
  );

  // A match on a page that is not rendered yet is reached by scrolling to its page first.
  const revealed = useRef(0);
  const currentMatch = matches[selection.index];
  useEffect(() => {
    if (revealed.current === selection.revealKey) return;
    revealed.current = selection.revealKey;
    if (currentMatch && nearPages && !nearPages.has(currentMatch.pageIndex)) {
      scrollToPage(currentMatch.pageIndex);
    }
  }, [currentMatch, nearPages, scrollToPage, selection.revealKey]);

  const rangesByPage = useMemo(
    () => groupMatchRanges(texts ?? [], matches, selection.index),
    [texts, matches, selection.index],
  );
  return {
    query,
    setQuery,
    isPending: isSearching && texts === null,
    total,
    current: selection.index,
    findNext: () => step(1),
    findPrevious: () => step(-1),
    rangesByPage,
    revealKey: selection.revealKey,
  };
}
