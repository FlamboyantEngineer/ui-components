// Pure query matching for TextMatch: normalization, term splitting, ranges and whole-word rules.

export interface TextMatchRange {
  start: number;
  end: number;
  /** The index, in the terms searched for, of the term that starts the range. */
  term: number;
}

export interface MatchTextOptions {
  /** Fold accented letters to their base letter, so `cafe` matches `café`. */
  ignoreAccents?: boolean | undefined;
}

export interface FindTermRangesOptions extends MatchTextOptions {
  /** Match terms as words (see `isWordMatchAt`) instead of anywhere in the text. */
  matchWords?: boolean | undefined;
}

/** Terms at least this long also match the start of a longer word. */
const wordPrefixMinLength = 3;
const wordCharacter = /[\p{L}\p{N}]/u;
const separators = /[/_-]/g;
const combiningMarks = /\p{M}/gu;
const combiningMark = /\p{M}/u;

function isWordCharacter(character: string | undefined): boolean {
  return character !== undefined && wordCharacter.test(character);
}

/**
 * Whether `term`, found at `index` in `text`, counts as a word match: it starts a word, and either
 * ends it or is at least three characters long (so a partly typed word still matches).
 * `text` and `term` are compared as given; normalize both first.
 */
export function isWordMatchAt(text: string, index: number, term: string): boolean {
  if (index < 0 || isWordCharacter(text[index - 1])) return false;
  return term.length >= wordPrefixMinLength || !isWordCharacter(text[index + term.length]);
}

/** Every index at which `term` is a word match in `text`. */
export function findWordMatches(text: string, term: string): number[] {
  const positions: number[] = [];
  if (!term) return positions;
  for (let index = text.indexOf(term); index !== -1; index = text.indexOf(term, index + 1)) {
    if (isWordMatchAt(text, index, term)) positions.push(index);
  }
  return positions;
}

/** One character, accent-folded and lower-cased where that keeps its length. */
function foldCharacter(character: string, ignoreAccents: boolean): string {
  const base = ignoreAccents ? character.normalize('NFD').replace(combiningMarks, '') : character;
  const folded = base.length === character.length ? base : character;
  const lower = folded.toLowerCase();
  return lower.length === folded.length ? lower : folded;
}

/**
 * Lower-cases `text` and turns `/`, `_` and `-` into spaces, one code unit at a time, so an index
 * in the result is the same index in the original. With `ignoreAccents`, an accented letter becomes
 * its base letter (`é` → `e`). Characters whose folded form has a different length are kept.
 */
export function normalizeMatchText(text: string, options: MatchTextOptions = {}): string {
  const ignoreAccents = options.ignoreAccents ?? false;
  let normalized = '';
  for (const character of text) {
    normalized += foldCharacter(character, ignoreAccents).replace(separators, ' ');
  }
  return normalized;
}

/** Splits a typed query into normalized, non-empty terms. */
export function splitMatchTerms(query: string, options: MatchTextOptions = {}): string[] {
  const normalized = normalizeMatchText(query, options);
  // Terms need no index alignment, so a decomposed accent typed in the query is dropped entirely.
  const folded = options.ignoreAccents
    ? normalized.normalize('NFD').replace(combiningMarks, '')
    : normalized;
  return folded.split(/\s+/).filter(Boolean);
}

/** Every occurrence of `term` in `haystack`, as ranges tagged with the term's index. */
function findOccurrences(
  haystack: string,
  { term, index }: { term: string; index: number },
  matchWords: boolean,
) {
  const ranges: TextMatchRange[] = [];
  let from = 0;
  while (from + term.length <= haystack.length) {
    const start = haystack.indexOf(term, from);
    if (start < 0) break;
    if (matchWords && !isWordMatchAt(haystack, start, term)) {
      from = start + 1;
      continue;
    }
    ranges.push({ start, end: start + term.length, term: index });
    from = start + term.length;
  }
  return ranges;
}

/**
 * The ranges of `text` where any term occurs, sorted, with overlapping or touching ranges merged
 * (keeping the term that starts first). A range never ends between a letter and its combining mark.
 */
export function findTermRanges(
  text: string,
  terms: readonly string[],
  { matchWords = false, ignoreAccents = false }: FindTermRangesOptions = {},
): TextMatchRange[] {
  const haystack = normalizeMatchText(text, { ignoreAccents });
  const ranges = terms.flatMap((term, index) =>
    term ? findOccurrences(haystack, { term, index }, matchWords) : [],
  );
  ranges.sort((left, right) => left.start - right.start || left.end - right.end);
  const merged: TextMatchRange[] = [];
  for (const range of ranges) {
    while (combiningMark.test(text[range.end] ?? '')) range.end += 1;
    const last = merged.at(-1);
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push({ ...range });
  }
  return merged;
}

/** Whether every term occurs in `text`. No terms means no filter, so any text matches. */
export function textMatchesTerms(
  text: string,
  terms: readonly string[],
  options: MatchTextOptions = {},
): boolean {
  const haystack = normalizeMatchText(text, options);
  return terms.every((term) => term.length > 0 && haystack.includes(term));
}
