export interface InlineTextDiffSegment {
    kind: 'text' | 'removed' | 'added';
    text: string;
}
export interface TextDiffParts {
    /** Unchanged text before the change. */
    prefix: string;
    removed: string;
    added: string;
    /** Unchanged text after the change. */
    suffix: string;
}
export interface TextDiffExcerptOptions {
    /** Characters of unchanged text kept on each side. Defaults to 24. */
    context?: number | undefined;
    /** Characters kept of each changed run. Defaults to 100. */
    run?: number | undefined;
}
/**
 * Splits two values around their one contiguous change: the longest common prefix and suffix are
 * kept, and the middle of each value is what was removed and added. Compares by code point.
 */
export declare function splitTextDiff(before: string, after: string): TextDiffParts;
/**
 * Segments for `InlineTextDiff` showing the change from `before` to `after`, with the unchanged
 * context and each changed run cut to a bounded length (marked with an ellipsis). Empty segments
 * are left out, so a first value is one added run and a cleared value one removed run.
 */
export declare function createInlineTextDiffExcerpt(before: string, after: string, { context, run }?: TextDiffExcerptOptions): InlineTextDiffSegment[];
/**
 * Segments for `InlineTextDiff` showing every changed run of words from `before` to `after`
 * (`diffWords`), whole and in reading order: each change's removed run before its added run.
 */
export declare function createInlineWordDiff(before: string, after: string): InlineTextDiffSegment[];
//# sourceMappingURL=text-diff.d.ts.map