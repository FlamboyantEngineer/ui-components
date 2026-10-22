// Aligns the blocks of two rich documents (specs/REDLINE-COMPARE.md): a block-level redline.

import type { Key } from '../core/props.js';
import { diffSequences, diffWords, type WordDiffHunk } from './diff.js';
import { toKeyIdentity } from './to-key-identity.js';

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

/** The deletes and inserts between two runs of shared blocks, by index. */
interface ChangeRun {
  deleted: number[];
  inserted: number[];
}

type Segment = { kind: 'equal'; pairs: Array<[number, number]> } | ({ kind: 'run' } & ChangeRun);

interface Alignment<B extends DocumentBlock> {
  oldBlocks: readonly B[];
  newBlocks: readonly B[];
  /** Old index → new index of each moved block, and the reverse. */
  movedTo: Map<number, number>;
  movedFrom: Map<number, number>;
  counts: BlockChangeCounts;
}

/** Paired blocks without ids share at least this fraction of their characters. */
const similarityThreshold = 0.5;

const toIdentity = (block: DocumentBlock) =>
  block.id === undefined ? `text:${block.text}` : `id:${toKeyIdentity(block.id)}`;

const toRowKey = (block: DocumentBlock, side: 'old' | 'new', index: number) =>
  block.id === undefined ? `${side}:${index}` : toIdentity(block);

/** The equal pairs and the change runs of two block lists, in reading order. */
function segmentBlocks(oldBlocks: readonly DocumentBlock[], newBlocks: readonly DocumentBlock[]) {
  const segments: Segment[] = [];
  let oldIndex = 0;
  let newIndex = 0;
  const hunks = diffSequences(oldBlocks.map(toIdentity), newBlocks.map(toIdentity));
  for (const { kind, items } of hunks) {
    const indices = (start: number) => items.map((_, offset) => start + offset);
    const last = segments.at(-1);
    if (kind === 'equal') {
      segments.push({
        kind,
        pairs: items.map((_, offset) => [oldIndex + offset, newIndex + offset]),
      });
      oldIndex += items.length;
      newIndex += items.length;
    } else if (kind === 'delete') {
      segments.push({ kind: 'run', deleted: indices(oldIndex), inserted: [] });
      oldIndex += items.length;
    } else if (last?.kind === 'run') {
      last.inserted = indices(newIndex);
      newIndex += items.length;
    } else {
      segments.push({ kind: 'run', deleted: [], inserted: indices(newIndex) });
      newIndex += items.length;
    }
  }
  return segments;
}

/**
 * Blocks deleted in one place and inserted in another with the same identity moved. Blank blocks
 * without ids never count as moved.
 */
function findMoves<B extends DocumentBlock>(alignment: Alignment<B>, runs: readonly ChangeRun[]) {
  const { oldBlocks, newBlocks, movedTo, movedFrom } = alignment;
  const waiting = new Map<string, number[]>();
  for (const run of runs) {
    for (const index of run.inserted) {
      const block = newBlocks[index]!;
      if (block.id === undefined && block.text.trim() === '') continue;
      const identity = toIdentity(block);
      const indices = waiting.get(identity);
      if (indices) indices.push(index);
      else waiting.set(identity, [index]);
    }
  }
  for (const indices of waiting.values()) indices.reverse();
  for (const run of runs) {
    for (const index of run.deleted) {
      const target = waiting.get(toIdentity(oldBlocks[index]!))?.pop();
      if (target === undefined) continue;
      movedTo.set(index, target);
      movedFrom.set(target, index);
    }
  }
}

/** The fraction of the two texts' characters their word diff keeps. */
function measureSimilarity(oldText: string, newText: string): number {
  const total = oldText.length + newText.length;
  if (total === 0) return 1;
  const kept = diffWords(oldText, newText)
    .filter((hunk) => hunk.kind === 'equal')
    .reduce((sum, hunk) => sum + hunk.text.length, 0);
  return (2 * kept) / total;
}

/**
 * Pairs the deleted and inserted blocks of a run that have no ids and read alike, in order: each
 * deleted block takes the first similar inserted block after the last one taken.
 */
function* pairSimilar<B extends DocumentBlock>(alignment: Alignment<B>, run: ChangeRun) {
  const { oldBlocks, newBlocks, movedTo, movedFrom } = alignment;
  const isFree = (block: B) => block.id === undefined;
  let from = 0;
  for (let deleted = 0; deleted < run.deleted.length; deleted += 1) {
    const oldIndex = run.deleted[deleted]!;
    const oldBlock = oldBlocks[oldIndex]!;
    if (!isFree(oldBlock) || movedTo.has(oldIndex)) continue;
    for (let inserted = from; inserted < run.inserted.length; inserted += 1) {
      const newIndex = run.inserted[inserted]!;
      const newBlock = newBlocks[newIndex]!;
      if (!isFree(newBlock) || movedFrom.has(newIndex)) continue;
      if (measureSimilarity(oldBlock.text, newBlock.text) < similarityThreshold) continue;
      yield [deleted, inserted] as const;
      from = inserted + 1;
      break;
    }
  }
}

function haveSameMarks(oldBlock: DocumentBlock, newBlock: DocumentBlock): boolean {
  const normalize = (block: DocumentBlock) =>
    (block.marks ?? [])
      .filter((mark) => mark.end > mark.start)
      .map((mark) => `${mark.type}:${mark.start}:${mark.end}:${mark.href ?? ''}`)
      .sort()
      .join('|');
  return normalize(oldBlock) === normalize(newBlock);
}

/** How a block holding both versions differs: its word diff, type and format changes. */
function compareVersions(oldBlock: DocumentBlock, newBlock: DocumentBlock) {
  const isTextChanged = oldBlock.text !== newBlock.text;
  return {
    words: isTextChanged ? diffWords(oldBlock.text, newBlock.text) : undefined,
    isTypeChanged: oldBlock.type !== newBlock.type || oldBlock.level !== newBlock.level,
    isFormatChanged: !isTextChanged && !haveSameMarks(oldBlock, newBlock),
  };
}

/** A row holding both versions of a block at the same place: unchanged or changed. */
function pairRow<B extends DocumentBlock>(
  alignment: Alignment<B>,
  [oldIndex, newIndex]: [number, number],
): ComparedBlockRow<B> {
  const oldBlock = alignment.oldBlocks[oldIndex]!;
  const newBlock = alignment.newBlocks[newIndex]!;
  const versions = compareVersions(oldBlock, newBlock);
  const isChanged = versions.words || versions.isTypeChanged || versions.isFormatChanged;
  if (isChanged) alignment.counts.changed += 1;
  const key = oldBlock.id === undefined ? `pair:${oldIndex}:${newIndex}` : toIdentity(oldBlock);
  const change = isChanged ? 'changed' : 'unchanged';
  return { key, change, oldBlock, newBlock, oldIndex, newIndex, ...versions };
}

/** A block only the old document holds here: removed, or the old position of a moved block. */
function oldRow<B extends DocumentBlock>(
  alignment: Alignment<B>,
  oldIndex: number,
): ComparedBlockRow<B> {
  const oldBlock = alignment.oldBlocks[oldIndex]!;
  const target = alignment.movedTo.get(oldIndex);
  const unchanged = { isTypeChanged: false, isFormatChanged: false };
  if (target === undefined) {
    alignment.counts.removed += 1;
    const key = toRowKey(oldBlock, 'old', oldIndex);
    return { key, change: 'removed', oldBlock, oldIndex, ...unchanged };
  }
  const counterpartKey = toRowKey(alignment.newBlocks[target]!, 'new', target);
  const key = `moved-from:${toRowKey(oldBlock, 'old', oldIndex)}`;
  return { key, change: 'moved', oldBlock, oldIndex, move: 'from', counterpartKey, ...unchanged };
}

/** A block only the new document holds here: added, or the new position of a moved block. */
function newRow<B extends DocumentBlock>(
  alignment: Alignment<B>,
  newIndex: number,
): ComparedBlockRow<B> {
  const newBlock = alignment.newBlocks[newIndex]!;
  const key = toRowKey(newBlock, 'new', newIndex);
  const source = alignment.movedFrom.get(newIndex);
  if (source === undefined) {
    alignment.counts.added += 1;
    return {
      key,
      change: 'added',
      newBlock,
      newIndex,
      isTypeChanged: false,
      isFormatChanged: false,
    };
  }
  alignment.counts.moved += 1;
  const oldBlock = alignment.oldBlocks[source]!;
  const counterpartKey = `moved-from:${toRowKey(oldBlock, 'old', source)}`;
  const versions = compareVersions(oldBlock, newBlock);
  return {
    key,
    change: 'moved',
    oldBlock,
    newBlock,
    oldIndex: source,
    newIndex,
    ...versions,
    move: 'to',
    counterpartKey,
  };
}

/**
 * The rows of a change run: before each similar pair, the deleted and then the inserted blocks
 * that come ahead of it, then the pair; after the last pair, the rest of each.
 */
function runRows<B extends DocumentBlock>(alignment: Alignment<B>, run: ChangeRun) {
  const rows: Array<ComparedBlockRow<B>> = [];
  let deleted = 0;
  let inserted = 0;
  const flush = (oldEnd: number, newEnd: number) => {
    for (; deleted < oldEnd; deleted += 1) rows.push(oldRow(alignment, run.deleted[deleted]!));
    for (; inserted < newEnd; inserted += 1) rows.push(newRow(alignment, run.inserted[inserted]!));
  };
  for (const [oldOffset, newOffset] of pairSimilar(alignment, run)) {
    flush(oldOffset, newOffset);
    rows.push(pairRow(alignment, [run.deleted[oldOffset]!, run.inserted[newOffset]!]));
    deleted += 1;
    inserted += 1;
  }
  flush(run.deleted.length, run.inserted.length);
  return rows;
}

/**
 * Aligns the blocks of two documents. Blocks match by `id`, or by equal text when they have none,
 * on the longest common run of matches; a matched block whose text, type, level or marks differ is
 * `changed`. Between two matches, a block that matches one elsewhere is `moved` and has two rows,
 * its old position (`move: 'from'`) and its new one (`move: 'to'`, with the word diff); other
 * blocks without ids that read alike pair as `changed`, and the rest are `removed` or `added`.
 */
export function compareBlocks<B extends DocumentBlock>(
  oldBlocks: readonly B[],
  newBlocks: readonly B[],
): BlockComparison<B> {
  const alignment: Alignment<B> = {
    oldBlocks,
    newBlocks,
    movedTo: new Map(),
    movedFrom: new Map(),
    counts: { added: 0, removed: 0, changed: 0, moved: 0 },
  };
  const segments = segmentBlocks(oldBlocks, newBlocks);
  findMoves(
    alignment,
    segments.filter((segment) => segment.kind === 'run'),
  );
  const rows = segments.flatMap((segment) =>
    segment.kind === 'equal'
      ? segment.pairs.map((pair) => pairRow(alignment, pair))
      : runRows(alignment, segment),
  );
  return { rows, counts: alignment.counts };
}
