/** How a line of a text diff changed. */
export type TextDiffChange = 'added' | 'removed' | 'unchanged';
/** One line of a text diff. */
export interface TextDiffLine {
    /** How the line changed. */
    change: TextDiffChange;
    /** Its 1-based number in the old text, or `null` for an added line. */
    oldNumber: number | null;
    /** Its 1-based number in the new text, or `null` for a removed line. */
    newNumber: number | null;
    /** The line's text, without its line break. */
    text: string;
}
/** A run of a line's text, and whether the word diff with its paired line changed it. */
export interface WordPart {
    text: string;
    isChanged: boolean;
}
/** A line with its key and, when it pairs with a line on the other side, its word changes. */
export interface DiffLine extends TextDiffLine {
    key: string;
    words: WordPart[] | null;
}
/** A run of unchanged lines, or one change: the lines it removes, then the lines it adds. */
export type DiffBlock = {
    kind: 'unchanged';
    index: number;
    lines: DiffLine[];
} | {
    kind: 'change';
    index: number;
    change: number;
    removed: DiffLine[];
    added: DiffLine[];
};
/** A row that stands for unchanged lines folded away. */
export interface FoldRow {
    kind: 'fold';
    key: string;
    /** The unchanged block it folds. */
    block: number;
    count: number;
    /** The key of the first line it hides, which takes focus when the fold opens. */
    firstKey: string;
}
/** A unified row: one line, with the change it belongs to. */
export interface UnifiedLineRow {
    kind: 'line';
    key: string;
    line: DiffLine;
    change: number | null;
}
/** A split row: the old side's line and the new side's, either missing in a change. */
export interface SplitLineRow {
    kind: 'line';
    key: string;
    old: DiffLine | null;
    new: DiffLine | null;
    change: number | null;
}
export type UnifiedRow = UnifiedLineRow | FoldRow;
export type SplitRow = SplitLineRow | FoldRow;
export interface FoldOptions {
    /** Unchanged lines kept on each side of a change. */
    context: number;
    /** The unchanged blocks the reader opened. */
    expanded: ReadonlySet<number>;
}
/** The blocks of the line diff of two texts, changes numbered in order. */
export declare function createDiffBlocks(oldText: string, newText: string): DiffBlock[];
/** How many lines the texts add and remove, and in how many changes. */
export declare function countChanges(blocks: readonly DiffBlock[]): {
    added: number;
    removed: number;
    changes: number;
};
/** The rows of a unified diff: removed lines before added ones, unchanged runs folded. */
export declare function createUnifiedRows(blocks: readonly DiffBlock[], options: FoldOptions): UnifiedRow[];
/** The rows of a split diff: each change's lines side by side, unchanged runs folded. */
export declare function createSplitRows(blocks: readonly DiffBlock[], options: FoldOptions): SplitRow[];
//# sourceMappingURL=diff-rows.d.ts.map