import { type PdfTextContent } from './pdf-engine.js';
/** A page's searchable text: its runs joined, with a line break after each run that ends a line. */
export interface PdfPageText {
    text: string;
    /** Where each run starts in `text`. */
    starts: number[];
    lengths: number[];
}
/** One occurrence of the query, as offsets into its page's text. */
export interface PdfMatch {
    pageIndex: number;
    start: number;
    end: number;
}
/** How the find matches the query. */
export interface PdfSearchOptions {
    /** Highlights every match, not only the current one. Defaults to true. */
    highlightAll?: boolean | undefined;
    /** Tells upper and lower case apart. */
    matchCase?: boolean | undefined;
    /** Folds accented letters to their base letter, so `cafe` finds `café`. */
    ignoreAccents?: boolean | undefined;
    /** Finds the query only where it is a whole word or words. */
    wholeWords?: boolean | undefined;
}
/** The part of a match that lies in one text run, as offsets into that run. */
export interface PdfMatchRange {
    run: number;
    start: number;
    end: number;
    isCurrent: boolean;
}
export declare function createPageText(content: PdfTextContent): PdfPageText;
/**
 * Every occurrence of `query` in page order, ignoring case unless `matchCase`. Whitespace in the
 * query matches any run of whitespace, including a line break, so a phrase is found across lines.
 */
export declare function findTextMatches(pages: readonly PdfPageText[], query: string, options?: PdfSearchOptions): PdfMatch[];
/** The first match on `pageIndex` or after it, wrapping to the first match. */
export declare function findMatchFrom(matches: readonly PdfMatch[], pageIndex: number): number;
/**
 * The match ranges of every page that has highlighted matches, keyed by page index: every match,
 * or only the current one without `highlightAll`.
 */
export declare function groupMatchRanges(pages: readonly PdfPageText[], matches: readonly PdfMatch[], { current, highlightAll }: {
    current: number;
    highlightAll?: boolean | undefined;
}): Map<number, PdfMatchRange[]>;
//# sourceMappingURL=pdf-search.d.ts.map