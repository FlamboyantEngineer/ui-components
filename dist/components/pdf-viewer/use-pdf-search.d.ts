import { type PdfMatchRange, type PdfSearchOptions } from './pdf-search.js';
import type { LoadedPdf } from './use-pdf-document.js';
import type { PdfPagesController } from './use-pdf-pages.js';
export interface UsePdfSearchOptions {
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
/**
 * Find in the document: every match highlighted, one current match the reader steps through, and
 * the count. A query typed while the document loads runs once its text is available. The query,
 * the options and the current match are each the viewer's own unless the caller passes them.
 */
export declare function usePdfSearch(options: UsePdfSearchOptions): PdfSearchState;
//# sourceMappingURL=use-pdf-search.d.ts.map