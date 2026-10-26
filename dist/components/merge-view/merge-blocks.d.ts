import type { MergeChunk } from '../../utils/three-way-merge.js';
/** A side of a merge view's input: our text, the common base or their text. */
export type MergeSide = 'ours' | 'base' | 'theirs';
/** How a side's line relates to the base: left alone, changed cleanly, or part of a conflict. */
export type MergeLineChange = 'unchanged' | 'changed' | 'conflict';
/**
 * How a conflict was resolved: not yet, by taking our lines, their lines, ours then theirs, the
 * base's lines, or by editing its result.
 */
export type MergeResolution = 'unresolved' | 'ours' | 'theirs' | 'both' | 'base' | 'edited';
/** A conflict's resolution, with the text the reader typed once edited. */
export type ConflictState = {
    resolution: Exclude<MergeResolution, 'edited'>;
} | {
    resolution: 'edited';
    text: string;
};
/** One line of a side. */
export interface MergeLine {
    /** Its 1-based number in the side's text. */
    number: number;
    text: string;
    change: MergeLineChange;
}
/** One chunk as a merge view draws it: each side's lines and the rows the sides line up on. */
export interface MergeBlock {
    index: number;
    chunk: MergeChunk;
    /** The conflict's 0-based number, or `null` for a clean chunk. */
    conflict: number | null;
    lines: Readonly<Record<MergeSide, readonly MergeLine[]>>;
    /** Rows each side draws for the chunk: the most lines any side has in it. */
    rows: number;
}
/** The marker lines that frame an unresolved conflict's sides, named by the sides' labels. */
export interface ConflictMarkers {
    ours: string;
    theirs: string;
}
/** The blocks of a merge, each side's lines numbered through the text and conflicts in order. */
export declare function createMergeBlocks(chunks: readonly MergeChunk[]): MergeBlock[];
/** The lines a clean chunk merges to: the side that changed, or the base when none did. */
export declare function getCleanLines(chunk: MergeChunk): readonly string[];
/** A conflict's result text: the lines its resolution takes, the edited text, or framed sides. */
export declare function getConflictText(chunk: MergeChunk, state: ConflictState, markers: ConflictMarkers): string;
/**
 * The merged text: clean chunks' lines and each conflict's result text in order, ending with a
 * line break when our text does.
 */
export declare function createMergeText(options: {
    blocks: readonly MergeBlock[];
    states: readonly ConflictState[];
    markers: ConflictMarkers;
    hasFinalBreak: boolean;
}): string;
//# sourceMappingURL=merge-blocks.d.ts.map