import type { ComparedBlockRow, DocumentBlock, DocumentMark } from '../../utils/compare-blocks.js';
/** Which text a cell draws: the old block, the new block, or both inline. */
export type RedlineSide = 'old' | 'new' | 'both';
/** How a run of words fares: kept, added or removed. */
export type RedlineWordChange = 'equal' | 'added' | 'removed';
/** A piece of text under the same marks. */
export interface MarkedRun {
    text: string;
    marks: readonly DocumentMark[];
}
/** A run of words that the side keeps, adds or removes, cut where its marks change. */
export interface RedlineWords {
    change: RedlineWordChange;
    runs: MarkedRun[];
}
/** Cuts a block's text from `start` where a mark starts or ends, keeping the marks over each cut. */
export declare function cutAtMarks(text: string, { block, start }: {
    block: DocumentBlock;
    start: number;
}): MarkedRun[];
/**
 * The words a row draws on one side: the old side keeps and removes words, the new side keeps and
 * adds them, and the inline side shows all three. A row without a word diff draws its block whole,
 * added or removed with the row; a moved block draws nothing on the side of its other position.
 */
export declare function createRedlineWords(row: ComparedBlockRow, side: RedlineSide): RedlineWords[];
//# sourceMappingURL=redline-text.d.ts.map