export interface TextMatchRange {
    start: number;
    end: number;
    /** The index, in the terms searched for, of the term that starts the range. */
    term: number;
}
export interface MatchTextOptions {
    /** Fold accented letters to their base letter, so `cafe` matches `café`. */
    ignoreAccents?: boolean | undefined;
}
export interface FindTermRangesOptions extends MatchTextOptions {
    /** Match terms as words (see `isWordMatchAt`) instead of anywhere in the text. */
    matchWords?: boolean | undefined;
}
/**
 * Whether `term`, found at `index` in `text`, counts as a word match: it starts a word, and either
 * ends it or is at least three characters long (so a partly typed word still matches).
 * `text` and `term` are compared as given; normalize both first.
 */
export declare function isWordMatchAt(text: string, index: number, term: string): boolean;
/** Every index at which `term` is a word match in `text`. */
export declare function findWordMatches(text: string, term: string): number[];
/**
 * Lower-cases `text` and turns `/`, `_` and `-` into spaces, one code unit at a time, so an index
 * in the result is the same index in the original. With `ignoreAccents`, an accented letter becomes
 * its base letter (`é` → `e`). Characters whose folded form has a different length are kept.
 */
export declare function normalizeMatchText(text: string, options?: MatchTextOptions): string;
/** Splits a typed query into normalized, non-empty terms. */
export declare function splitMatchTerms(query: string, options?: MatchTextOptions): string[];
/**
 * The ranges of `text` where any term occurs, sorted, with overlapping or touching ranges merged
 * (keeping the term that starts first). A range never ends between a letter and its combining mark.
 */
export declare function findTermRanges(text: string, terms: readonly string[], { matchWords, ignoreAccents }?: FindTermRangesOptions): TextMatchRange[];
/** Whether every term occurs in `text`. No terms means no filter, so any text matches. */
export declare function textMatchesTerms(text: string, terms: readonly string[], options?: MatchTextOptions): boolean;
//# sourceMappingURL=match-ranges.d.ts.map