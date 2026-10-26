export interface LinkTarget {
    href: string;
    title: string | null;
    /** Index just past the construct. */
    end: number;
}
export interface DelimiterFlanking {
    canOpen: boolean;
    canClose: boolean;
}
export declare function isEscapable(char: string | undefined): boolean;
/** Resolves backslash escapes and entities, as in link destinations, titles and info strings. */
export declare function unescapeMarkdown(text: string): string;
/** A label's lookup key: trimmed, inner whitespace collapsed, case folded. */
export declare function normalizeLabel(label: string): string;
/** Index just past the run of `char` that starts at `at`. */
export declare function runEnd(text: string, at: number, char: string): number;
/** A code span opening at `at`: its content and end, or null when no equal run closes it. */
export declare function readCodeSpan(text: string, at: number): {
    text: string;
    end: number;
} | null;
/** An autolink (`<https://…>` or `<name@example.com>`) at `at`. */
export declare function readAutolink(text: string, at: number): {
    href: string;
    label: string;
    end: number;
} | null;
/** An inline link target `(destination "title")` opening at `at`. */
export declare function readLinkTarget(text: string, at: number): LinkTarget | null;
/** A link label `[label]` opening at `at`: its raw text and end. */
export declare function readLinkLabel(text: string, at: number): {
    label: string;
    end: number;
} | null;
/** Whether the delimiter run `text[start, end)` may open or close emphasis. */
export declare function readFlanking(text: string, start: number, end: number): DelimiterFlanking;
//# sourceMappingURL=markdown-inline-syntax.d.ts.map