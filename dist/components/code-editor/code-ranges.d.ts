import type { CodeDiagnostic, CodeToken } from './code-layers.js';
/** A run of the source, as text offsets. */
export interface CodeRange {
    start: number;
    end: number;
}
/** The bracket at the caret and its partner, `null` when it has none. */
export interface BracketMatch {
    at: number;
    partner: number | null;
}
/**
 * The source a diagnostic marks: from its column to `endLine` and `endColumn`, or else the word at
 * its column; the line's text when it has no column. `null` when it has no line or nothing to mark.
 */
export declare function findDiagnosticRange(value: string, diagnostic: CodeDiagnostic, starts?: readonly number[]): CodeRange | null;
/**
 * Diagnostics whose lines are numbered from `firstLineNumber`, as the gutter numbers them, counted
 * again from 1 at the text's first line. The same list when the text starts at line 1.
 */
export declare function toTextLines(diagnostics: readonly CodeDiagnostic[], firstLineNumber: number): readonly CodeDiagnostic[];
/**
 * The bracket just before the caret (or else just after it) and its partner, skipping brackets in
 * strings, keys and comments; `null` when no bracket touches the caret.
 */
export declare function matchBracket(value: string, tokens: readonly CodeToken[], caret: number): BracketMatch | null;
/** The places `query` occurs in the source, ignoring case, without overlaps. */
export declare function findMatches(value: string, query: string): CodeRange[];
//# sourceMappingURL=code-ranges.d.ts.map