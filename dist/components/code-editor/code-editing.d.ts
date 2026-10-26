/** A selection in the source, as text offsets; `start === end` is a caret. */
export interface CodeSelection {
    start: number;
    end: number;
}
/** Replaces `start` to `end` with `text`, then selects `selection`. */
export interface CodeEdit {
    start: number;
    end: number;
    text: string;
    selection: CodeSelection;
}
/**
 * Tab: a caret takes spaces up to the next indentation stop; a selection indents each non-empty
 * line it touches by one level.
 */
export declare function indentSelection(value: string, selection: CodeSelection, size: number): CodeEdit;
/** Shift+Tab: removes one level of indentation from each line the selection touches. */
export declare function outdentSelection(value: string, selection: CodeSelection, size: number): CodeEdit | null;
/**
 * Enter: the new line keeps the indentation of the current one, one level more after an opening
 * bracket, and a closing bracket right after the caret moves to a line of its own.
 */
export declare function breakLine(value: string, selection: CodeSelection, size: number): CodeEdit;
/**
 * An opening bracket or quote typed over a selection wraps it; typed at a caret before space or a
 * closer, it inserts its partner too and leaves the caret between them.
 */
export declare function insertPair(value: string, selection: CodeSelection, character: string): CodeEdit | null;
/** Typing the closer that already follows the caret steps over it. */
export declare function skipCloser(value: string, selection: CodeSelection, character: string): CodeEdit | null;
/** Backspace between an empty bracket or quote pair deletes both. */
export declare function deletePair(value: string, selection: CodeSelection): CodeEdit | null;
/** The leading spaces and tabs of the line holding `offset`. */
export declare function indentationAt(value: string, offset: number): string;
//# sourceMappingURL=code-editing.d.ts.map