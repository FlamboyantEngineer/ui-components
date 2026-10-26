/** What a hunk does to the old text: keeps, inserts or deletes its content. */
export type DiffKind = 'equal' | 'insert' | 'delete';
/** A run of lines that the two texts share, or that one of them adds. */
export interface LineDiffHunk {
    kind: DiffKind;
    /** The hunk's lines, without their line breaks. */
    lines: string[];
    /** The 1-based number the hunk's first line has, or would have, in the old text. */
    oldStart: number;
    /** The 1-based number the hunk's first line has, or would have, in the new text. */
    newStart: number;
}
/** A run of words, spaces and punctuation that the two texts share, or that one of them adds. */
export interface WordDiffHunk {
    kind: DiffKind;
    text: string;
}
/** A run of items that two sequences share, or that one of them adds. */
export interface SequenceDiffHunk<T> {
    kind: DiffKind;
    items: T[];
}
/** Splits a text into lines at `\n`, `\r\n` or `\r`; a final line break ends the last line. */
export declare function splitLines(text: string): string[];
/**
 * The line diff of two texts: equal, deleted and inserted runs of lines in order, each with the
 * numbers its first line has in the old and the new text. A change deletes before it inserts.
 */
export declare function diffLines(oldText: string, newText: string): LineDiffHunk[];
/**
 * The word diff of two texts: equal, deleted and inserted runs of text in order. Words (letters,
 * digits and underscores), runs of spaces and single punctuation marks are compared whole.
 */
export declare function diffWords(oldText: string, newText: string): WordDiffHunk[];
/**
 * The diff of two sequences of items compared with `===`, such as ids: equal, deleted and inserted
 * runs in order. A change deletes before it inserts.
 */
export declare function diffSequences<T>(oldItems: readonly T[], newItems: readonly T[]): Array<SequenceDiffHunk<T>>;
//# sourceMappingURL=diff.d.ts.map