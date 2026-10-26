import { type ReactNode, type RefObject } from 'react';
import { type CodeHoverModel } from './code-hover.js';
import type { CodeDiagnostic, CodeTokenizer } from './code-layers.js';
import { type CodeSegment } from './code-segments.js';
import type { Completions, CompletionsModel } from '../completion-list/completion-list.js';
import { useCodeKeys } from './use-code-keys.js';
import { type CodeSearchModel } from './use-code-search.js';
import { type CodeSnippetSession } from './use-code-snippet.js';
export interface CodeLayers {
    input: RefObject<HTMLTextAreaElement | null>;
    highlight: RefObject<HTMLPreElement | null>;
    gutter: RefObject<HTMLDivElement | null>;
}
export interface CodeEditorOptions {
    value: string;
    onChange: ((value: string) => void) | undefined;
    tokenize: CodeTokenizer | undefined;
    diagnostics: readonly CodeDiagnostic[];
    completions: Completions | undefined;
    renderHover: ((offset: number) => ReactNode) | undefined;
    /** Defaults to 2. */
    indent: number | undefined;
    indentWithTab: boolean | undefined;
    autoCloseBrackets: boolean | undefined;
    allowsSearch: boolean | undefined;
    /** `false` leaves Enter to the caller instead of breaking the line. */
    multiline: boolean;
    isLocked: boolean;
}
/** Everything the editor's parts draw from: layers, decorated text and the interaction models. */
export interface CodeEditorModel {
    layers: CodeLayers;
    segments: Array<CodeSegment | null>;
    completion: CompletionsModel;
    search: CodeSearchModel;
    hover: CodeHoverModel;
    snippet: CodeSnippetSession;
    /** The latest message read out after moving to a problem. */
    announcement: string;
    /** Records the caret for bracket matching; `null` while the text area has no focus. */
    setCaret(caret: number | null): void;
    /** Handles the editing keys; returns whether a key was used. */
    handleKeyDown: ReturnType<typeof useCodeKeys>;
}
/** Moves the highlighted layer and the gutter to the input's scroll offset. */
export declare function alignLayers({ input, highlight, gutter }: CodeLayers): void;
/**
 * The state of a code editor: its layers, the decorated source (diagnostics, brackets, search
 * matches and the completion caret), completion, search, the hover tip and the editing keys.
 */
export declare function useCodeEditor(options: CodeEditorOptions): CodeEditorModel;
//# sourceMappingURL=use-code-editor.d.ts.map