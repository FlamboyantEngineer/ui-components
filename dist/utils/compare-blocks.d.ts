import type { Key } from '../core/props.js';
import { type WordDiffHunk } from './diff.js';
/** The kind of a document block. */
export type DocumentBlockType = 'paragraph' | 'heading' | 'list-item' | 'quote' | 'code';
/** The kind of an inline mark on a run of a block's text. */
export type DocumentMarkType = 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'link';
/** An inline mark over the text from `start` up to `end` (UTF-16 offsets, `end` excluded). */
export interface DocumentMark {
    type: DocumentMarkType;
    start: number;
    end: number;
    /** The destination of a `link` mark. */
    href?: string | undefined;
}
/** One block of a rich document: a paragraph, a heading, a list item, a quote or a code block. */
export interface DocumentBlock {
    /** Identifies the block in both documents; unique within each. Without it, text matches blocks. */
    id?: Key | undefined;
    type: DocumentBlockType;
    /** A heading's level, or a list item's nesting depth, from 1. */
    level?: number | undefined;
    text: string;
    marks?: readonly DocumentMark[] | undefined;
}
/** How an aligned row differs between the old and the new document. */
export type BlockChange = 'unchanged' | 'changed' | 'added' | 'removed' | 'moved';
/** How many blocks were added, removed, changed and moved; a moved block counts once. */
export type BlockChangeCounts = Record<Exclude<BlockChange, 'unchanged'>, number>;
/** One aligned row: a block of the old document, of the new one, or of both. */
export interface ComparedBlockRow<B extends DocumentBlock = DocumentBlock> {
    /** Opaque identity, unique among the rows. */
    key: string;
    change: BlockChange;
    /** The block in the old document, when the row shows it or compares against it. */
    oldBlock?: B | undefined;
    /** The block in the new document, when the row shows it. */
    newBlock?: B | undefined;
    /** The old block's index in the old document. */
    oldIndex?: number | undefined;
    /** The new block's index in the new document. */
    newIndex?: number | undefined;
    /** The word diff of the old and new text, when the row holds both blocks and their texts differ. */
    words?: WordDiffHunk[] | undefined;
    /** The row holds both blocks and their type or level differs. */
    isTypeChanged: boolean;
    /** The row holds both blocks, their texts are equal and their marks differ. */
    isFormatChanged: boolean;
    /** For a moved block: `from` at its old position, `to` at its new one. */
    move?: 'from' | 'to' | undefined;
    /** For a moved block, the key of its row at the other position. */
    counterpartKey?: string | undefined;
}
export interface BlockComparison<B extends DocumentBlock = DocumentBlock> {
    rows: Array<ComparedBlockRow<B>>;
    counts: BlockChangeCounts;
}
/**
 * Aligns the blocks of two documents. Blocks match by `id`, or by equal text when they have none,
 * on the longest common run of matches; a matched block whose text, type, level or marks differ is
 * `changed`. Between two matches, a block that matches one elsewhere is `moved` and has two rows,
 * its old position (`move: 'from'`) and its new one (`move: 'to'`, with the word diff); other
 * blocks without ids that read alike pair as `changed`, and the rest are `removed` or `added`.
 */
export declare function compareBlocks<B extends DocumentBlock>(oldBlocks: readonly B[], newBlocks: readonly B[]): BlockComparison<B>;
//# sourceMappingURL=compare-blocks.d.ts.map