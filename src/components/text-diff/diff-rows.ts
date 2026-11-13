// The rows a text diff draws: changes and unchanged runs from `diffLines`, word changes inside
// paired lines from `diffWords`, and unchanged runs folded down to their context.

import { diffLines, diffWords, type WordDiffHunk } from '../../utils/diff.js';
import { requireDefined } from '../../utils/require-defined.js';

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
  /**
   * Names the line within this pair of texts, the same in both layouts and while folds open, so
   * a host can keep a widget's state by it. Another pair of texts reuses ids for other lines.
   */
  id: string;
}

/** A run of a line's text, and whether the word diff with its paired line changed it. */
interface WordPart {
  text: string;
  isChanged: boolean;
}

/** A line with its key and, when it pairs with a line on the other side, its word changes. */
export interface DiffLine extends TextDiffLine {
  words: WordPart[] | null;
}

/** A run of unchanged lines, or one change: the lines it removes, then the lines it adds. */
export type DiffBlock =
  | { kind: 'unchanged'; index: number; lines: DiffLine[] }
  | { kind: 'change'; index: number; change: number; removed: DiffLine[]; added: DiffLine[] };

/** A row that stands for unchanged lines folded away. */
export interface FoldRow {
  kind: 'fold';
  key: string;
  /** The unchanged block it folds. */
  block: number;
  count: number;
  /** The id of the first line it hides, which takes focus when the fold opens. */
  firstId: string;
}

/** A unified row: one line, with the change it belongs to. */
interface UnifiedLineRow {
  kind: 'line';
  key: string;
  line: DiffLine;
  change: number | null;
}

/** A split row: the old side's line and the new side's, either missing in a change. */
interface SplitLineRow {
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

/** Lines folded out of one unchanged block, and the lines kept before and after the fold. */
interface FoldedLines {
  head: DiffLine[];
  hidden: DiffLine[];
  tail: DiffLine[];
}

function toLine(change: TextDiffChange, numbers: { old: number | null; new: number | null }) {
  return (text: string): DiffLine => {
    const id = `${change[0]}${change === 'added' ? numbers.new : numbers.old}`;
    const line = { change, oldNumber: numbers.old, newNumber: numbers.new, text, id, words: null };
    if (numbers.old !== null) numbers.old += 1;
    if (numbers.new !== null) numbers.new += 1;
    return line;
  };
}

function toWordParts(hunks: readonly WordDiffHunk[], changed: 'delete' | 'insert'): WordPart[] {
  return hunks
    .filter((hunk) => hunk.kind === 'equal' || hunk.kind === changed)
    .map((hunk) => ({ text: hunk.text, isChanged: hunk.kind === changed }));
}

/**
 * The most text, in characters, that one comparison diffs by words, counting both lines of each
 * pair: many long changed lines would otherwise each take their own search.
 */
const wordDiffBudget = 100_000;

/**
 * Pairs the removed and added lines of a change in order and marks the words each pair changed,
 * unless the two lines share no word, where highlighting every word would say nothing. Each pair
 * spends its text from `budget`, shared by the whole comparison; a pair that does not fit gets no
 * word marks.
 */
function pairWords(removed: DiffLine[], added: DiffLine[], budget: { left: number }): void {
  removed.forEach((line, index) => {
    const other = added[index];
    if (!other) return;
    const size = line.text.length + other.text.length;
    if (size > budget.left) return;
    budget.left -= size;
    const hunks = diffWords(line.text, other.text);
    if (!hunks.some((hunk) => hunk.kind === 'equal' && hunk.text.trim() !== '')) return;
    line.words = toWordParts(hunks, 'delete');
    other.words = toWordParts(hunks, 'insert');
  });
}

/**
 * Folds an unchanged block down to `context` lines beside each change; the start and end of the
 * text keep none. A block the reader opened, and every block of texts without a change, stay whole.
 */
function foldLines(
  block: Extract<DiffBlock, { kind: 'unchanged' }>,
  blocks: readonly DiffBlock[],
  { context, expanded }: FoldOptions,
): FoldedLines {
  const { lines } = block;
  if (expanded.has(block.index) || blocks.length === 1)
    return { head: lines, hidden: [], tail: [] };
  const lead = block.index === 0 ? 0 : context;
  const trail = block.index === blocks.length - 1 ? 0 : context;
  if (lines.length <= lead + trail) return { head: lines, hidden: [], tail: [] };
  return {
    head: lines.slice(0, lead),
    hidden: lines.slice(lead, lines.length - trail),
    tail: lines.slice(lines.length - trail),
  };
}

function toFoldRow(block: number, hidden: DiffLine[]): FoldRow[] {
  const first = hidden[0];
  if (!first) return [];
  return [{ kind: 'fold', key: `f${block}`, block, count: hidden.length, firstId: first.id }];
}

/** The blocks of the line diff of two texts, changes numbered in order. */
export function createDiffBlocks(oldText: string, newText: string): DiffBlock[] {
  const blocks: DiffBlock[] = [];
  let changes = 0;
  for (const hunk of diffLines(oldText, newText)) {
    const numbers = {
      old: hunk.kind === 'insert' ? null : hunk.oldStart,
      new: hunk.kind === 'delete' ? null : hunk.newStart,
    };
    if (hunk.kind === 'equal') {
      const lines = hunk.lines.map(toLine('unchanged', numbers));
      blocks.push({ kind: 'unchanged', index: blocks.length, lines });
      continue;
    }
    let last = blocks.at(-1);
    if (last?.kind !== 'change') {
      last = { kind: 'change', index: blocks.length, change: changes, removed: [], added: [] };
      changes += 1;
      blocks.push(last);
    }
    if (hunk.kind === 'delete') last.removed = hunk.lines.map(toLine('removed', numbers));
    else last.added = hunk.lines.map(toLine('added', numbers));
  }
  const budget = { left: wordDiffBudget };
  for (const block of blocks) {
    if (block.kind === 'change') pairWords(block.removed, block.added, budget);
  }
  return blocks;
}

/** How many lines the texts add and remove, and in how many changes. */
export function countChanges(blocks: readonly DiffBlock[]) {
  const changes = blocks.filter((block) => block.kind === 'change');
  return {
    added: changes.reduce((sum, block) => sum + block.added.length, 0),
    removed: changes.reduce((sum, block) => sum + block.removed.length, 0),
    changes: changes.length,
  };
}

/** The rows of a unified diff: removed lines before added ones, unchanged runs folded. */
export function createUnifiedRows(blocks: readonly DiffBlock[], options: FoldOptions) {
  return blocks.flatMap((block): UnifiedRow[] => {
    const line = (change: number | null) => (entry: DiffLine) => ({
      kind: 'line' as const,
      key: entry.id,
      line: entry,
      change,
    });
    if (block.kind === 'change') return [...block.removed, ...block.added].map(line(block.change));
    const { head, hidden, tail } = foldLines(block, blocks, options);
    return [...head.map(line(null)), ...toFoldRow(block.index, hidden), ...tail.map(line(null))];
  });
}

/** The rows of a split diff: each change's lines side by side, unchanged runs folded. */
export function createSplitRows(blocks: readonly DiffBlock[], options: FoldOptions) {
  return blocks.flatMap((block): SplitRow[] => {
    if (block.kind === 'change') {
      const length = Math.max(block.removed.length, block.added.length);
      return Array.from({ length }, (_, index) => {
        const old = block.removed[index] ?? null;
        const next = block.added[index] ?? null;
        return {
          kind: 'line',
          key: requireDefined(old ?? next).id,
          old,
          new: next,
          change: block.change,
        };
      });
    }
    const line = (entry: DiffLine): SplitLineRow => ({
      kind: 'line',
      key: entry.id,
      old: entry,
      new: entry,
      change: null,
    });
    const { head, hidden, tail } = foldLines(block, blocks, options);
    return [...head.map(line), ...toFoldRow(block.index, hidden), ...tail.map(line)];
  });
}
