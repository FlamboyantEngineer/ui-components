import { type KeyboardEvent, type RefObject } from 'react';
import type { CodeRange } from './code-ranges.js';
/** The fields of an inserted snippet the reader steps through with Tab and Shift+Tab. */
export interface CodeSnippetSession {
    /**
     * Starts stepping: `stops` are the fields, then the end of the insertion, in the text of
     * `length` characters the insertion makes; the first stop is selected.
     */
    start(stops: CodeRange[], length: number): void;
    /** Tab and Shift+Tab move between the stops; returns whether the key was used. */
    handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): boolean;
    end(): void;
}
/**
 * Stepping through a snippet's fields. The reader edits only the current field, so the fields
 * before it keep their offsets and those after it move by however much the text grew.
 */
export declare function useCodeSnippet(inputRef: RefObject<HTMLTextAreaElement | null>): CodeSnippetSession;
//# sourceMappingURL=use-code-snippet.d.ts.map