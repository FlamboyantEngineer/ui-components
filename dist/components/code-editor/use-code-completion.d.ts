import type { RefObject } from 'react';
import { type Completions, type CompletionsModel } from '../completion-list/completion-list.js';
import { type CodeEdit } from './code-editing.js';
import type { CodeSnippetSession } from './use-code-snippet.js';
export interface CodeCompletionOptions {
    completions: Completions | undefined;
    inputRef: RefObject<HTMLTextAreaElement | null>;
    /** A read-only or disabled editor offers nothing. */
    isLocked: boolean;
    applyEdit: (edit: CodeEdit) => void;
    snippet: CodeSnippetSession;
}
/**
 * Completion for a code editor's input: the shared completions engine completing the
 * identifier-like word before the caret, inserting snippets with their fields as editor edits.
 */
export declare function useCodeCompletion(options: CodeCompletionOptions): CompletionsModel;
//# sourceMappingURL=use-code-completion.d.ts.map