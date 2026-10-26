import { type KeyboardEvent, type RefObject } from 'react';
import { type CodeEdit } from './code-editing.js';
export interface CodeKeysOptions {
    inputRef: RefObject<HTMLTextAreaElement | null>;
    applyEdit: (edit: CodeEdit) => void;
    /** Spaces per indentation level. */
    indent: number;
    indentWithTab: boolean;
    autoCloseBrackets: boolean;
    /** `false` leaves Enter to the caller, without a line break. */
    multiline: boolean;
    /** A read-only or disabled editor makes no edits. */
    isLocked: boolean;
    /** Ctrl+F or Cmd+F, when the editor offers search. */
    onFind: (() => void) | undefined;
    /** F8 and Shift+F8 go to the next and previous problem; returns whether there is one. */
    onProblem: (delta: 1 | -1) => boolean;
}
/**
 * The editing keys of a code editor: Tab and Shift+Tab indentation (left by Escape then Tab or
 * Shift+Tab), Enter keeping the indentation, bracket and quote pairs, and the shortcuts for search
 * and problems. Returns a handler that reports whether it used the key.
 */
export declare function useCodeKeys(options: CodeKeysOptions): (event: KeyboardEvent<HTMLTextAreaElement>) => boolean;
//# sourceMappingURL=use-code-keys.d.ts.map