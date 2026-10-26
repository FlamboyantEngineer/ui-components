/**
 * What a chunk of a three-way merge holds: lines no side changed (`unchanged`), a change one side
 * made (`ours`, `theirs`), the same change on both sides (`both`), or different changes to the
 * same lines (`conflict`).
 */
export type MergeChunkKind = 'unchanged' | 'ours' | 'theirs' | 'both' | 'conflict';
/** A run of the base text and what each side made of it. */
export interface MergeChunk {
    kind: MergeChunkKind;
    /** The base's lines, without their line breaks. */
    base: string[];
    /** Our side's lines for the same run. */
    ours: string[];
    /** Their side's lines for the same run. */
    theirs: string[];
}
/**
 * The three-way merge of two texts that each changed a common `base`: chunks in reading order, each
 * a run the sides left alone, a change one side made, the same change on both sides, or a conflict
 * where they changed the same lines differently. Changes join a conflict when their base runs
 * overlap, or touch while one of them only inserts lines.
 */
export declare function mergeThreeWay(base: string, ours: string, theirs: string): MergeChunk[];
//# sourceMappingURL=three-way-merge.d.ts.map