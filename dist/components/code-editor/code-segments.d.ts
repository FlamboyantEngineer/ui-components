import type { FieldSeverity } from '../field/field.js';
import type { CodeToken } from './code-layers.js';
import type { CodeRange } from './code-ranges.js';
/** What the highlighted copy marks on top of the tokens. */
export interface CodeDecorations {
    /** Diagnostic ranges, underlined. */
    marks: ReadonlyArray<CodeRange & {
        severity: FieldSeverity;
    }>;
    /** Search matches, in order and without overlaps. */
    matches: ReadonlyArray<CodeRange & {
        isCurrent: boolean;
    }>;
    /** The bracket at the caret and its partner. */
    brackets: ReadonlyArray<CodeRange & {
        isUnmatched: boolean;
    }>;
    /** Where the caret marker goes, or `null`. */
    caret: number | null;
}
/** A piece of a token and the decorations that cover all of it. */
export interface CodeSegment {
    text: string;
    type: string | null;
    severity: FieldSeverity | null;
    match: {
        isCurrent: boolean;
    } | null;
    bracket: {
        isUnmatched: boolean;
    } | null;
}
/**
 * The tokens cut into segments at every decoration boundary, each with the decorations covering
 * it, and the caret marker (`null`) at its offset.
 */
export declare function splitSegments(tokens: readonly CodeToken[], decorations: CodeDecorations): Array<CodeSegment | null>;
//# sourceMappingURL=code-segments.d.ts.map