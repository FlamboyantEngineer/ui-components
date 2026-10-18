// Three-way merge of texts (specs/DIFF.md): both sides' line diffs against their common base,
// walked together into clean chunks and conflicts.

import { diffSequences, splitLines } from './diff.js';

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

/** One side's change: the base lines `start` to `end` (exclusive) replaced by `lines`. */
interface SideChange {
  start: number;
  end: number;
  lines: string[];
}

/** Each side's changes still to place, in order. */
interface ChangeQueues {
  ours: SideChange[];
  theirs: SideChange[];
}

/** The changes one side made to the base, in order: each run of deleted and inserted lines. */
function findChanges(base: readonly string[], side: readonly string[]): SideChange[] {
  const changes: SideChange[] = [];
  let position = 0;
  let open: SideChange | null = null;
  for (const hunk of diffSequences(base, side)) {
    if (hunk.kind === 'equal') {
      open = null;
      position += hunk.items.length;
      continue;
    }
    if (!open) {
      open = { start: position, end: position, lines: [] };
      changes.push(open);
    }
    if (hunk.kind === 'delete') {
      position += hunk.items.length;
      open.end = position;
    } else {
      open.lines = hunk.items;
    }
  }
  return changes;
}

/**
 * Whether a change joins the span of the chunk being built: their base runs overlap, or they touch
 * and one of them only inserts, so the order of the two would be a guess.
 */
function joins(span: { start: number; end: number }, change: SideChange): boolean {
  if (change.start < span.end && span.start < change.end) return true;
  const touches = change.start <= span.end && span.start <= change.end;
  return touches && (change.start === change.end || span.start === span.end);
}

/** A side's lines for the base run `start` to `end`, with that side's changes in it applied. */
function applyChanges(
  base: readonly string[],
  span: { start: number; end: number },
  changes: readonly SideChange[],
): string[] {
  const lines: string[] = [];
  let position = span.start;
  for (const change of changes) {
    lines.push(...base.slice(position, change.start), ...change.lines);
    position = change.end;
  }
  lines.push(...base.slice(position, span.end));
  return lines;
}

function isSameLines(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((line, index) => line === b[index]);
}

function toChunk(
  base: readonly string[],
  span: { start: number; end: number },
  changes: ChangeQueues,
): MergeChunk {
  const ours = applyChanges(base, span, changes.ours);
  const theirs = applyChanges(base, span, changes.theirs);
  const baseLines = base.slice(span.start, span.end);
  let kind: MergeChunkKind = 'conflict';
  if (changes.theirs.length === 0) kind = 'ours';
  else if (changes.ours.length === 0) kind = 'theirs';
  else if (isSameLines(ours, theirs)) kind = 'both';
  return { kind, base: baseLines, ours, theirs };
}

/**
 * Takes the next chunk's changes off the queues: the earliest change, then every change of either
 * side that joins the span they cover, until none does.
 */
function takeChunk(queues: ChangeQueues) {
  const side =
    (queues.theirs[0]?.start ?? Infinity) < (queues.ours[0]?.start ?? Infinity) ? 'theirs' : 'ours';
  const first = queues[side].shift()!;
  const taken: ChangeQueues = { ours: [], theirs: [] };
  taken[side].push(first);
  const span = { start: first.start, end: first.end };
  const takeJoining = (from: keyof ChangeQueues) => {
    const next = queues[from][0];
    if (!next || !joins(span, next)) return false;
    taken[from].push(queues[from].shift()!);
    span.start = Math.min(span.start, next.start);
    span.end = Math.max(span.end, next.end);
    return true;
  };
  let grew = true;
  while (grew) grew = takeJoining('ours') || takeJoining('theirs');
  return { span, taken };
}

/**
 * The three-way merge of two texts that each changed a common `base`: chunks in reading order, each
 * a run the sides left alone, a change one side made, the same change on both sides, or a conflict
 * where they changed the same lines differently. Changes join a conflict when their base runs
 * overlap, or touch while one of them only inserts lines.
 */
export function mergeThreeWay(base: string, ours: string, theirs: string): MergeChunk[] {
  const baseLines = splitLines(base);
  const queues: ChangeQueues = {
    ours: findChanges(baseLines, splitLines(ours)),
    theirs: findChanges(baseLines, splitLines(theirs)),
  };
  const chunks: MergeChunk[] = [];
  let position = 0;
  const pushUnchanged = (end: number) => {
    if (end <= position) return;
    const lines = baseLines.slice(position, end);
    chunks.push({ kind: 'unchanged', base: lines, ours: lines, theirs: lines });
  };
  while (queues.ours.length > 0 || queues.theirs.length > 0) {
    const { span, taken } = takeChunk(queues);
    pushUnchanged(span.start);
    chunks.push(toChunk(baseLines, span, taken));
    position = span.end;
  }
  pushUnchanged(baseLines.length);
  return chunks;
}
