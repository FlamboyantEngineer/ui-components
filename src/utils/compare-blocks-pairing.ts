// Pairs the similar blocks of a change run in compareBlocks (specs/REDLINE-COMPARE.md,
// UIC-REDLINE-COMPARE-1.2), weighing a bounded number of candidates per block.

import type { DocumentBlock } from './compare-blocks.js';
import { diffWords, splitWords } from './diff.js';
import { requireDefined } from './require-defined.js';

/** The deleted and inserted blocks between two runs of shared blocks, by index. */
interface ChangeRun {
  deleted: readonly number[];
  inserted: readonly number[];
}

/** Both documents' blocks, and the blocks already paired as moves (old index ↔ new index). */
export interface PairingBlocks<B extends DocumentBlock> {
  oldBlocks: readonly B[];
  newBlocks: readonly B[];
  movedTo: ReadonlyMap<number, number>;
  movedFrom: ReadonlyMap<number, number>;
}

/** Paired blocks without ids share at least this fraction of their characters. */
const similarityThreshold = 0.5;

/** The most word diffs a deleted block runs against inserted blocks while looking for its pair. */
const maxSimilarityDiffs = 8;

/** How many inserted blocks right after the last pair each deleted block always considers. */
const nearbyCandidates = 16;

/**
 * A word more inserted blocks of a run hold than this is too common to find candidates by: it
 * would make every block a candidate, as a Cartesian scan does.
 */
const maxWordBlocks = 64;

/** The most inserted blocks a deleted block weighs while looking for its pair, nearest first. */
const maxCandidates = 128;

/** The fraction of the two texts' characters their word diff keeps. */
function measureSimilarity(oldText: string, newText: string): number {
  const total = oldText.length + newText.length;
  if (total === 0) return 1;
  const kept = diffWords(oldText, newText)
    .filter((hunk) => hunk.kind === 'equal')
    .reduce((sum, hunk) => sum + hunk.text.length, 0);
  return (2 * kept) / total;
}

/** How many times a text holds each of its word tokens. */
type TokenCounts = ReadonlyMap<string, number>;

function countTokens(text: string): TokenCounts {
  const counts = new Map<string, number>();
  for (const token of splitWords(text)) counts.set(token, (counts.get(token) ?? 0) + 1);
  return counts;
}

/**
 * Whether two texts could reach the similarity threshold, checked without a diff: a word diff
 * keeps at most the shorter text, and at most the tokens both texts hold, as often as both do.
 */
function couldBeSimilar(
  [oldText, oldCounts]: readonly [string, TokenCounts],
  [newText, newCounts]: readonly [string, TokenCounts],
): boolean {
  const needed = similarityThreshold * (oldText.length + newText.length);
  if (2 * Math.min(oldText.length, newText.length) < needed) return false;
  const [fewer, more] =
    oldCounts.size <= newCounts.size ? [oldCounts, newCounts] : [newCounts, oldCounts];
  let shared = 0;
  for (const [token, count] of fewer) {
    shared += Math.min(count, more.get(token) ?? 0) * token.length;
  }
  return 2 * shared >= needed;
}

/** Each block's text with its token counts, counted once, on first use. */
function createTokenCache(blocks: readonly DocumentBlock[]) {
  const cache = new Map<number, readonly [string, TokenCounts]>();
  return (index: number) => {
    let entry = cache.get(index);
    if (!entry) {
      const { text } = requireDefined(blocks[index]);
      entry = [text, countTokens(text)];
      cache.set(index, entry);
    }
    return entry;
  };
}

/** The run's positions of the inserted blocks free to pair that hold each word, in order. */
function indexWords(
  run: ChangeRun,
  isCandidate: (newIndex: number) => boolean,
  tokens: ReturnType<typeof createTokenCache>,
) {
  const positions = new Map<string, number[]>();
  run.inserted.forEach((newIndex, position) => {
    if (!isCandidate(newIndex)) return;
    for (const token of tokens(newIndex)[1].keys()) {
      const list = positions.get(token);
      if (!list) positions.set(token, [position]);
      else if (list.length <= maxWordBlocks) list.push(position);
    }
  });
  return positions;
}

/**
 * The run's positions a deleted block considers, from `from` on and in order: the next few after
 * the last pair, and those holding one of its words that few inserted blocks hold.
 */
function findCandidates(
  counts: TokenCounts,
  words: ReadonlyMap<string, readonly number[]>,
  { from, end }: { from: number; end: number },
): number[] {
  const found = new Set<number>();
  for (let position = from; position < Math.min(end, from + nearbyCandidates); position += 1) {
    found.add(position);
  }
  for (const token of counts.keys()) {
    const list = words.get(token);
    if (!list || list.length > maxWordBlocks) continue;
    for (const position of list) if (position >= from) found.add(position);
  }
  return [...found].sort((a, b) => a - b).slice(0, maxCandidates);
}

/**
 * Pairs the deleted and inserted blocks of a run that have no ids and read alike, in order: each
 * deleted block takes the first similar inserted block after the last one taken. It considers only
 * the few inserted blocks right after the last pair and those sharing a word few blocks hold, at
 * most `maxCandidates` of them, so unrelated blocks never form a Cartesian scan. Candidates whose lengths or shared words rule the
 * threshold out are skipped without a diff, and a deleted block runs at most `maxSimilarityDiffs`
 * diffs, so a long rewritten run stays near linear.
 */
export function* pairSimilar<B extends DocumentBlock>(alignment: PairingBlocks<B>, run: ChangeRun) {
  const { oldBlocks, newBlocks, movedTo, movedFrom } = alignment;
  const isFree = (block: B) => block.id === undefined;
  const isCandidate = (newIndex: number) =>
    isFree(requireDefined(newBlocks[newIndex])) && !movedFrom.has(newIndex);
  const oldTokens = createTokenCache(oldBlocks);
  const newTokens = createTokenCache(newBlocks);
  const words = indexWords(run, isCandidate, newTokens);
  let from = 0;
  for (let deleted = 0; deleted < run.deleted.length; deleted += 1) {
    const oldIndex = requireDefined(run.deleted[deleted]);
    const oldBlock = requireDefined(oldBlocks[oldIndex]);
    if (!isFree(oldBlock) || movedTo.has(oldIndex)) continue;
    const candidates = findCandidates(oldTokens(oldIndex)[1], words, {
      from,
      end: run.inserted.length,
    });
    let diffs = 0;
    for (const inserted of candidates) {
      const newIndex = requireDefined(run.inserted[inserted]);
      if (!isCandidate(newIndex)) continue;
      if (!couldBeSimilar(oldTokens(oldIndex), newTokens(newIndex))) continue;
      if (diffs === maxSimilarityDiffs) break;
      diffs += 1;
      const newBlock = requireDefined(newBlocks[newIndex]);
      if (measureSimilarity(oldBlock.text, newBlock.text) < similarityThreshold) continue;
      yield [deleted, inserted] as const;
      from = inserted + 1;
      break;
    }
  }
}
