// The blocks a merge view draws from the chunks of `mergeThreeWay`: each side's numbered lines per
// chunk, conflicts numbered in order, and the result text from the conflicts' resolutions.

import { requireDefined } from '../../utils/require-defined.js';
import type { MergeChunk } from '../../utils/three-way-merge.js';

/** A side of a merge view's input: our text, the common base or their text. */
export type MergeSide = 'ours' | 'base' | 'theirs';

/** How a side's line relates to the base: left alone, changed cleanly, or part of a conflict. */
type MergeLineChange = 'unchanged' | 'changed' | 'conflict';

/**
 * How a conflict was resolved: not yet, by taking our lines, their lines, ours then theirs, the
 * base's lines, or by editing its result.
 */
export type MergeResolution = 'unresolved' | 'ours' | 'theirs' | 'both' | 'base' | 'edited';

/** A conflict's resolution, with the text the reader typed once edited. */
export type ConflictState =
  { resolution: Exclude<MergeResolution, 'edited'> } | { resolution: 'edited'; text: string };

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

const sides: readonly MergeSide[] = ['ours', 'base', 'theirs'];

function lineChange(chunk: MergeChunk, side: MergeSide): MergeLineChange {
  if (chunk.kind === 'conflict') return 'conflict';
  if (chunk.kind === 'unchanged') return 'unchanged';
  if (side === 'base' || chunk.kind === 'both' || chunk.kind === side) return 'changed';
  return 'unchanged';
}

/** The blocks of a merge, each side's lines numbered through the text and conflicts in order. */
export function createMergeBlocks(chunks: readonly MergeChunk[]): MergeBlock[] {
  const next: Record<MergeSide, number> = { ours: 1, base: 1, theirs: 1 };
  let conflicts = 0;
  return chunks.map((chunk, index) => {
    const lines = Object.fromEntries(
      sides.map((side) => {
        const change = lineChange(chunk, side);
        const start = next[side];
        next[side] += chunk[side].length;
        return [
          side,
          chunk[side].map((text, offset) => ({ number: start + offset, text, change })),
        ];
      }),
    ) as Record<MergeSide, MergeLine[]>;
    const conflict = chunk.kind === 'conflict' ? conflicts : null;
    if (conflict !== null) conflicts += 1;
    const rows = Math.max(chunk.ours.length, chunk.base.length, chunk.theirs.length);
    return { index, chunk, conflict, lines, rows };
  });
}

/** The lines a clean chunk merges to: the side that changed, or the base when none did. */
export function getCleanLines(chunk: MergeChunk): readonly string[] {
  return chunk.kind === 'theirs' ? chunk.theirs : chunk.ours;
}

/**
 * A conflict's result lines: the lines its resolution takes, as they are, so an empty line stays a
 * line; the edited text's lines, none when it is empty; or the sides framed by markers.
 */
function getConflictLines(
  chunk: MergeChunk,
  state: ConflictState,
  markers: ConflictMarkers,
): readonly string[] {
  switch (state.resolution) {
    case 'edited':
      return state.text === '' ? [] : state.text.split(/\r\n|\r|\n/);
    case 'unresolved':
      return [
        `<<<<<<< ${markers.ours}`,
        ...chunk.ours,
        '=======',
        ...chunk.theirs,
        `>>>>>>> ${markers.theirs}`,
      ];
    case 'both':
      return [...chunk.ours, ...chunk.theirs];
    default:
      return chunk[state.resolution];
  }
}

/** A conflict's result text: its result lines joined by line breaks. */
export function getConflictText(
  chunk: MergeChunk,
  state: ConflictState,
  markers: ConflictMarkers,
): string {
  if (state.resolution === 'edited') return state.text;
  return getConflictLines(chunk, state, markers).join('\n');
}

/**
 * The merged text: clean chunks' lines and each conflict's result lines in order, joined by the
 * first line break `ours` uses (`\n` when it has none), and ending with one when `ours` does and the
 * merge has a line, even an empty one.
 */
export function createMergeText(options: {
  blocks: readonly MergeBlock[];
  states: readonly ConflictState[];
  markers: ConflictMarkers;
  ours: string;
}): string {
  const { blocks, states, markers, ours } = options;
  const lines = blocks.flatMap((block) =>
    block.conflict === null
      ? getCleanLines(block.chunk)
      : getConflictLines(block.chunk, requireDefined(states[block.conflict]), markers),
  );
  const lineBreak = /\r\n|\r|\n/.exec(ours)?.[0] ?? '\n';
  const text = lines.join(lineBreak);
  return finalBreak.test(ours) && lines.length > 0 ? `${text}${lineBreak}` : text;
}

const finalBreak = /(?:\r\n|\r|\n)$/;
