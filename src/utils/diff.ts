// Line, word and sequence diffs (specs/DIFF.md): Myers' algorithm in linear space.

/** What a hunk does to the old text: keeps, inserts or deletes its content. */
export type DiffKind = 'equal' | 'insert' | 'delete';

/** A run of lines that the two texts share, or that one of them adds. */
export interface LineDiffHunk {
  kind: DiffKind;
  /** The hunk's lines, without their line breaks. */
  lines: string[];
  /** The 1-based number the hunk's first line has, or would have, in the old text. */
  oldStart: number;
  /** The 1-based number the hunk's first line has, or would have, in the new text. */
  newStart: number;
}

/** A run of words, spaces and punctuation that the two texts share, or that one of them adds. */
export interface WordDiffHunk {
  kind: DiffKind;
  text: string;
}

/** A run of items that two sequences share, or that one of them adds. */
export interface SequenceDiffHunk<T> {
  kind: DiffKind;
  items: T[];
}

/** An edit on token lists: a kind and the tokens it covers. */
interface TokenEdit<T> {
  kind: DiffKind;
  tokens: T[];
}

/** The search state of one bisection: both texts, the furthest reach on each diagonal, both ways. */
interface Bisection<T> {
  a: readonly T[];
  b: readonly T[];
  offset: number;
  delta: number;
  forward: Direction;
  backward: Direction;
}

/** One diagonal at one step of a search, forwards or backwards. */
interface DiagonalStep {
  d: number;
  k: number;
  isBackward: boolean;
}

/** The furthest reach on each diagonal of one direction, and the diagonals trimmed off the grid. */
interface Direction {
  reach: number[];
  trimStart: number;
  trimEnd: number;
}

// One search makes at most `maxSearchSteps` steps, whose diagonal bookkeeping grows with the
// square of the steps, and at most about `searchBudget` token comparisons, which grow with the
// steps times the texts' lengths: a tenth of a second or so on a typical machine either way.
const searchBudget = 200_000_000;
const maxSearchSteps = 1000;
const minSearchSteps = 64;

const wordToken = /[\p{L}\p{N}\p{M}_]+|\s+|[^\p{L}\p{N}\p{M}_\s]/gu;

function commonPrefixLength<T>(a: readonly T[], b: readonly T[]): number {
  let length = 0;
  while (length < a.length && length < b.length && a[length] === b[length]) length += 1;
  return length;
}

function commonSuffixLength<T>(a: readonly T[], b: readonly T[], prefix: number): number {
  let length = 0;
  while (
    length < a.length - prefix &&
    length < b.length - prefix &&
    a[a.length - 1 - length] === b[b.length - 1 - length]
  ) {
    length += 1;
  }
  return length;
}

/**
 * Extends diagonal `k` at step `d` in one direction and returns how far along the old text its
 * snake ends; the new text's position is that less `k`. Backwards, positions count from the ends of
 * both texts. It returns a number, with no result object or closure, since it runs once per diagonal and step.
 */
function extend<T>(search: Bisection<T>, { d, k, isBackward }: DiagonalStep): number {
  const { a, b, offset } = search;
  const { reach } = isBackward ? search.backward : search.forward;
  const index = offset + k;
  const below = reach[index - 1] ?? -1;
  const above = reach[index + 1] ?? -1;
  let x = k === -d || (k !== d && below < above) ? above : below + 1;
  let y = x - k;
  if (isBackward) {
    const aEnd = a.length - 1;
    const bEnd = b.length - 1;
    while (x < a.length && y < b.length && a[aEnd - x] === b[bEnd - y]) {
      x += 1;
      y += 1;
    }
  } else {
    while (x < a.length && y < b.length && a[x] === b[y]) {
      x += 1;
      y += 1;
    }
  }
  reach[index] = x;
  return x;
}

/** Runs step `d` forwards; returns the split point where a path meets the backward paths. */
function scanForward<T>(search: Bisection<T>, d: number): [number, number] | null {
  const { a, b, forward, backward, offset, delta } = search;
  for (let k = -d + forward.trimStart; k <= d - forward.trimEnd; k += 2) {
    const x = extend(search, { d, k, isBackward: false });
    const y = x - k;
    if (x > a.length) forward.trimEnd += 2;
    else if (y > b.length) forward.trimStart += 2;
    else if (delta % 2 !== 0) {
      const other = backward.reach[offset + delta - k] ?? -1;
      if (other !== -1 && x >= a.length - other) return [x, y];
    }
  }
  return null;
}

/** Runs step `d` backwards; returns the split point where a path meets the forward paths. */
function scanBackward<T>(search: Bisection<T>, d: number): [number, number] | null {
  const { a, b, forward, backward, offset, delta } = search;
  for (let k = -d + backward.trimStart; k <= d - backward.trimEnd; k += 2) {
    const x = extend(search, { d, k, isBackward: true });
    const y = x - k;
    if (x > a.length) backward.trimEnd += 2;
    else if (y > b.length) backward.trimStart += 2;
    else if (delta % 2 === 0) {
      const index = offset + delta - k;
      const other = forward.reach[index] ?? -1;
      if (other !== -1 && other >= a.length - x) return [other, offset + other - index];
    }
  }
  return null;
}

/**
 * Finds a point on a shortest edit path by searching from both ends until the paths meet (Myers'
 * middle snake), so the diff needs memory linear in the texts' lengths. The search gives up,
 * returning `null`, after `maxSearchSteps` steps, or sooner once its steps would pass
 * `searchBudget` token comparisons: inputs that differ in many places then diff coarsely instead
 * of blocking the page. Only the diagonals the steps can reach are kept.
 */
function findSplit<T>(a: readonly T[], b: readonly T[]): [number, number] | null {
  const length = a.length + b.length;
  const maxD = Math.ceil(length / 2);
  const steps = Math.min(
    maxD,
    maxSearchSteps,
    Math.max(minSearchSteps, Math.floor(searchBudget / length)),
  );
  const direction = (): Direction => {
    const reach = new Array<number>(2 * steps + 2).fill(-1);
    reach[steps + 1] = 0;
    return { reach, trimStart: 0, trimEnd: 0 };
  };
  const search: Bisection<T> = {
    a,
    b,
    offset: steps,
    delta: a.length - b.length,
    forward: direction(),
    backward: direction(),
  };
  for (let d = 0; d < steps; d += 1) {
    const split = scanForward(search, d) ?? scanBackward(search, d);
    if (split) return split;
  }
  return null;
}

/** Whether two sequences share no token, found in linear time. */
function isDisjoint<T>(a: readonly T[], b: readonly T[]): boolean {
  const seen = new Set(a);
  return !b.some((token) => seen.has(token));
}

function diffTokens<T>(
  a: readonly T[],
  b: readonly T[],
  edits: Array<TokenEdit<T>> = [],
): Array<TokenEdit<T>> {
  const prefix = commonPrefixLength(a, b);
  const suffix = commonSuffixLength(a, b, prefix);
  const oldMiddle = a.slice(prefix, a.length - suffix);
  const newMiddle = b.slice(prefix, b.length - suffix);
  edits.push({ kind: 'equal', tokens: a.slice(0, prefix) });
  // Middles with nothing in common have one shortest edit, which the search would take quadratic
  // time to find: delete the one and insert the other.
  if (oldMiddle.length === 0 || newMiddle.length === 0 || isDisjoint(oldMiddle, newMiddle)) {
    edits.push({ kind: 'delete', tokens: oldMiddle }, { kind: 'insert', tokens: newMiddle });
  } else {
    const split = findSplit(oldMiddle, newMiddle);
    if (split) {
      const [x, y] = split;
      diffTokens(oldMiddle.slice(0, x), newMiddle.slice(0, y), edits);
      diffTokens(oldMiddle.slice(x), newMiddle.slice(y), edits);
    } else {
      edits.push({ kind: 'delete', tokens: oldMiddle }, { kind: 'insert', tokens: newMiddle });
    }
  }
  edits.push({ kind: 'equal', tokens: a.slice(a.length - suffix) });
  return edits;
}

function appendTokens<T>(target: T[], source: readonly T[]) {
  for (const token of source) target.push(token);
}

/**
 * Merges edits into hunks: empty edits go, neighbours of one kind join, and each run of changes
 * between two equal hunks becomes one deletion followed by one insertion.
 */
function toHunks<T>(edits: Array<TokenEdit<T>>): Array<TokenEdit<T>> {
  const hunks: Array<TokenEdit<T>> = [];
  let deleted: T[] = [];
  let inserted: T[] = [];
  const flush = () => {
    if (deleted.length > 0) hunks.push({ kind: 'delete', tokens: deleted });
    if (inserted.length > 0) hunks.push({ kind: 'insert', tokens: inserted });
    deleted = [];
    inserted = [];
  };
  for (const edit of edits) {
    if (edit.kind === 'delete') appendTokens(deleted, edit.tokens);
    else if (edit.kind === 'insert') appendTokens(inserted, edit.tokens);
    else if (edit.tokens.length > 0) {
      flush();
      const last = hunks.at(-1);
      if (last?.kind === 'equal') appendTokens(last.tokens, edit.tokens);
      else hunks.push({ kind: 'equal', tokens: edit.tokens });
    }
  }
  flush();
  return hunks;
}

/** Splits a text into lines at `\n`, `\r\n` or `\r`; a final line break ends the last line. */
export function splitLines(text: string): string[] {
  if (text === '') return [];
  const lines = text.split(/\r\n|\r|\n/);
  if (lines.at(-1) === '') lines.pop();
  return lines;
}

/**
 * Folds a run of only spaces between two changes into them, so "quick brown" replaced by
 * "slow red" reads as one change rather than two around a shared space.
 */
function joinSpacedChanges(hunks: Array<TokenEdit<string>>): Array<TokenEdit<string>> {
  const edits = hunks.flatMap((hunk, index): Array<TokenEdit<string>> => {
    const isSpace = hunk.kind === 'equal' && hunk.tokens.every((token) => token.trim() === '');
    const isBetweenChanges =
      index > 0 && index < hunks.length - 1 && hunks[index + 1]?.kind !== 'equal';
    if (!isSpace || !isBetweenChanges) return [hunk];
    return [
      { kind: 'delete', tokens: hunk.tokens },
      { kind: 'insert', tokens: hunk.tokens },
    ];
  });
  return toHunks(edits);
}

/**
 * The line diff of two texts: equal, deleted and inserted runs of lines in order, each with the
 * numbers its first line has in the old and the new text. A change deletes before it inserts.
 */
export function diffLines(oldText: string, newText: string): LineDiffHunk[] {
  const hunks = toHunks(diffTokens(splitLines(oldText), splitLines(newText)));
  let oldStart = 1;
  let newStart = 1;
  return hunks.map(({ kind, tokens }) => {
    const hunk = { kind, lines: tokens, oldStart, newStart };
    if (kind !== 'insert') oldStart += tokens.length;
    if (kind !== 'delete') newStart += tokens.length;
    return hunk;
  });
}

/** The tokens `diffWords` compares whole: words, runs of spaces and single punctuation marks. */
export function splitWords(text: string): string[] {
  return text.match(wordToken) ?? [];
}

/**
 * The word diff of two texts: equal, deleted and inserted runs of text in order. Words (letters,
 * digits and underscores), runs of spaces and single punctuation marks are compared whole.
 */
export function diffWords(oldText: string, newText: string): WordDiffHunk[] {
  const oldTokens = splitWords(oldText);
  const newTokens = splitWords(newText);
  return joinSpacedChanges(toHunks(diffTokens(oldTokens, newTokens))).map(({ kind, tokens }) => ({
    kind,
    text: tokens.join(''),
  }));
}

/**
 * The diff of two sequences of items compared with `===`, such as ids: equal, deleted and inserted
 * runs in order. A change deletes before it inserts.
 */
export function diffSequences<T>(
  oldItems: readonly T[],
  newItems: readonly T[],
): Array<SequenceDiffHunk<T>> {
  return toHunks(diffTokens(oldItems, newItems)).map(({ kind, tokens }) => ({
    kind,
    items: tokens,
  }));
}
