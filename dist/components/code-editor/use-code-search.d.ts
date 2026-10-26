import { type RefObject } from 'react';
import type { CodeEdit } from './code-editing.js';
import { type CodeRange } from './code-ranges.js';
export interface CodeSearchOptions {
    value: string;
    inputRef: RefObject<HTMLTextAreaElement | null>;
    applyEdit: (edit: CodeEdit) => void;
}
export interface CodeSearchModel {
    isOpen: boolean;
    query: string;
    replacement: string;
    matches: readonly CodeRange[];
    /** The current match's index, or -1 without matches. */
    current: number;
    findRef: RefObject<HTMLInputElement | null>;
    /** Opens the panel with the selected text as the query and moves focus to the find box. */
    open(): void;
    /** Closes the panel and returns focus to the text area with the current match selected. */
    close(): void;
    setQuery(query: string): void;
    setReplacement(replacement: string): void;
    /** Moves to the next (1) or previous (-1) match, wrapping around. */
    step(delta: 1 | -1): void;
    replace(): void;
    replaceAll(): void;
}
/**
 * Find and replace in a code editor: the matches of the query (ignoring case), the current one,
 * stepping through them and replacing one or all of them.
 */
export declare function useCodeSearch({ value, inputRef, applyEdit }: CodeSearchOptions): CodeSearchModel;
//# sourceMappingURL=use-code-search.d.ts.map