import type { PdfMatchRange } from './pdf-search.js';
export interface HighlightTextRunsOptions {
    /** The text layer's run elements. */
    runs: readonly HTMLElement[];
    /** Each run's original text. */
    texts: readonly string[];
    ranges: readonly PdfMatchRange[];
}
export interface HighlightedTextRuns {
    /** The element of the current match, when this layer holds it. */
    current: HTMLElement | null;
    /** Puts every touched run back to its original text. */
    restore(): void;
}
/**
 * Wraps each match in the text layer's runs in a `ui-pdf-viewer__match` element, the current one marked with
 * `data-current`. The runs belong to the engine, so they are rewritten in place and restored after.
 */
export declare function highlightTextRuns({ runs, texts, ranges, }: HighlightTextRunsOptions): HighlightedTextRuns;
//# sourceMappingURL=highlights.d.ts.map