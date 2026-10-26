import { type ReactNode, type Ref } from 'react';
import type { FieldSeverity } from '../field/field.js';
import type { CodeSegment } from './code-segments.js';
/** A run of source text. `type` names its kind (`keyword`, `string`, …) for the stylesheet. */
export interface CodeToken {
    text: string;
    type?: string | null | undefined;
}
/** Splits source into tokens that cover it exactly, in order. */
export type CodeTokenizer = (source: string) => readonly CodeToken[];
/** A problem in the source, at a line and column counted from 1 when known. */
export interface CodeDiagnostic {
    message: string;
    line?: number | undefined;
    column?: number | undefined;
    /** Where the marked range ends, counted from 1 and exclusive. Defaults to `line`. */
    endLine?: number | undefined;
    /** Where the marked range ends, counted from 1 and exclusive. Without it the word at `column` is marked. */
    endColumn?: number | undefined;
    /** Defaults to `error`. */
    severity?: FieldSeverity | undefined;
}
export interface CodeHighlightProps {
    /** The tokens cut at the decorations, with the caret marker (`null`) that anchors popovers. */
    segments: ReadonlyArray<CodeSegment | null>;
    caretRef: Ref<HTMLSpanElement>;
    highlightRef: Ref<HTMLPreElement>;
}
export interface CodeGutterProps {
    measurement?: boolean | undefined;
    lines: readonly string[];
    /** The number of the first row. */
    firstLineNumber: number;
    /** The worst severity reported on each line, by line counted from 1 at the text's start. */
    severities: ReadonlyMap<number, FieldSeverity>;
    /** The input's text width, so each hidden line copy wraps where the input wraps. */
    textWidth: number | undefined;
    gutterRef: Ref<HTMLDivElement>;
}
export interface CodeDiagnosticsProps {
    id: string;
    diagnostics: readonly CodeDiagnostic[];
}
export declare const codeEditorHooks: import("../../core/hooks.js").ComponentHooks<"code" | "input" | "mark" | "search" | "line" | "format" | "match" | "toolbar" | "tooltip" | "caret" | "popover" | "surface" | "gutter" | "bracket" | "line-number" | "line-text" | "highlight" | "token" | "diagnostics" | "diagnostic" | "announcement" | "scrollbars" | "scroll-marker">;
/**
 * The highlighted copy of the source behind the input. A final line break keeps its last line as
 * tall as the input's, so the two scroll to the same extent.
 */
export declare function CodeHighlight({ segments, caretRef, highlightRef }: CodeHighlightProps): import("react").JSX.Element;
/**
 * Line numbers beside the input. Each row holds a hidden copy of its line, so a wrapped line keeps
 * one number and the rows stay as tall as the lines they number.
 */
export declare function CodeGutter({ lines, measurement, firstLineNumber, severities, textWidth, gutterRef, }: CodeGutterProps): import("react").JSX.Element;
/** The worst severity on each line that a diagnostic points at. */
export declare function severitiesByLine(diagnostics: readonly CodeDiagnostic[]): Map<number, FieldSeverity>;
/** The diagnostics list. It stays in the document so new diagnostics are announced politely. */
export declare function CodeDiagnostics({ id, diagnostics }: CodeDiagnosticsProps): ReactNode;
//# sourceMappingURL=code-layers.d.ts.map