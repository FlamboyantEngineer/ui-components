// The text a redline row draws on one side, as runs of kept, added and removed words with marks.

import type { ComparedBlockRow, DocumentBlock, DocumentMark } from '../../utils/compare-blocks.js';
import type { WordDiffHunk } from '../../utils/diff.js';

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

/** Where a hunk's text sits in a block: the block and the offset it starts at. */
interface Placed {
  change: RedlineWordChange;
  text: string;
  block: DocumentBlock;
  start: number;
}

const hunkChanges = { equal: 'equal', insert: 'added', delete: 'removed' } as const;

/** Cuts a block's text from `start` where a mark starts or ends, keeping the marks over each cut. */
export function cutAtMarks(
  text: string,
  { block, start }: { block: DocumentBlock; start: number },
): MarkedRun[] {
  const end = start + text.length;
  const marks = (block.marks ?? []).filter((mark) => mark.end > mark.start);
  const cuts = new Set([start, end]);
  for (const mark of marks) {
    if (mark.start > start && mark.start < end) cuts.add(mark.start);
    if (mark.end > start && mark.end < end) cuts.add(mark.end);
  }
  const points = [...cuts].sort((a, b) => a - b);
  return points.slice(1).map((to, index) => {
    const from = points[index]!;
    return {
      text: text.slice(from - start, to - start),
      marks: marks.filter((mark) => mark.start <= from && mark.end >= to),
    };
  });
}

/** The word hunks of a row placed in the old and new blocks, keeping those the side draws. */
function placeHunks(row: ComparedBlockRow, words: readonly WordDiffHunk[], side: RedlineSide) {
  const placed: Placed[] = [];
  let oldOffset = 0;
  let newOffset = 0;
  for (const { kind, text } of words) {
    const isDrawn =
      !(side === 'old' && kind === 'insert') && !(side === 'new' && kind === 'delete');
    const isOld = kind === 'delete' || (kind === 'equal' && side === 'old');
    if (isDrawn) {
      const block = isOld ? row.oldBlock! : row.newBlock!;
      placed.push({ change: hunkChanges[kind], text, block, start: isOld ? oldOffset : newOffset });
    }
    if (kind !== 'insert') oldOffset += text.length;
    if (kind !== 'delete') newOffset += text.length;
  }
  return placed;
}

/** The whole text of the block a side shows, kept, added or removed as the row's change says. */
function placeWhole(row: ComparedBlockRow, side: RedlineSide): Placed[] {
  const block =
    side === 'old' ? row.oldBlock : (row.newBlock ?? (side === 'both' ? row.oldBlock : undefined));
  if (!block) return [];
  const change = row.change === 'added' ? 'added' : row.change === 'removed' ? 'removed' : 'equal';
  return [{ change, text: block.text, block, start: 0 }];
}

/**
 * The words a row draws on one side: the old side keeps and removes words, the new side keeps and
 * adds them, and the inline side shows all three. A row without a word diff draws its block whole,
 * added or removed with the row; a moved block draws nothing on the side of its other position.
 */
export function createRedlineWords(row: ComparedBlockRow, side: RedlineSide): RedlineWords[] {
  if ((side === 'old' && row.move === 'to') || (side === 'new' && row.move === 'from')) return [];
  const placed = row.words ? placeHunks(row, row.words, side) : placeWhole(row, side);
  return placed.map(({ change, text, block, start }) => ({
    change,
    runs: cutAtMarks(text, { block, start }),
  }));
}
