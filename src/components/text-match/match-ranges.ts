// Pure query matching for TextMatch: normalization, term splitting, ranges and whole-word rules.

export interface TextMatchRange {
  start: number;
  end: number;
}

export interface FindTermRangesOptions {
  /** Match terms as words (see `isWordMatchAt`) instead of anywhere in the text. */
  matchWords?: boolean | undefined;
}

/** Terms at least this long also match the start of a longer word. */
const wordPrefixMinLength = 3;
const wordCharacter = /[\p{L}\p{N}]/u;
const separators = /[/_-]/g;

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

/**
 * Lower-cases `text` and turns `/`, `_` and `-` into spaces, one code unit at a time, so an index
 * in the result is the same index in the original. Characters whose lower-case form has a
 * different length are kept unchanged.
 */
export function normalizeMatchText(text: string): string {
  let normalized = '';
  for (const character of text) {
    const lower = character.toLowerCase();
    normalized += (lower.length === character.length ? lower : character).replace(separators, ' ');
  }
  return normalized;
}

/** Splits a typed query into normalized, non-empty terms. */
export function splitMatchTerms(query: string): string[] {
  return normalizeMatchText(query).split(/\s+/).filter(Boolean);
}

/** The ranges of `text` where any term occurs, sorted, with overlapping or touching ranges merged. */
export function findTermRanges(
  text: string,
  terms: readonly string[],
  { matchWords = false }: FindTermRangesOptions = {},
): TextMatchRange[] {
  const haystack = normalizeMatchText(text);
  const ranges: TextMatchRange[] = [];
  for (const term of terms) {
    if (!term) continue;
    let from = 0;
    while (from + term.length <= haystack.length) {
      const index = haystack.indexOf(term, from);
      if (index < 0) break;
      if (matchWords && !isWordMatchAt(haystack, index, term)) {
        from = index + 1;
        continue;
      }
      ranges.push({ start: index, end: index + term.length });
      from = index + term.length;
    }
  }
  ranges.sort((left, right) => left.start - right.start || left.end - right.end);
  const merged: TextMatchRange[] = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push({ ...range });
  }
  return merged;
}

/** Whether every term occurs in `text`. No terms means no filter, so any text matches. */
export function textMatchesTerms(text: string, terms: readonly string[]): boolean {
  const haystack = normalizeMatchText(text);
  return terms.every((term) => term.length > 0 && haystack.includes(term));
}
