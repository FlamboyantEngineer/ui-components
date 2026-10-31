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

/** Terms of at least this many characters also match the start of a longer word. */
const wordPrefixMinLength = 3;
/** Letters, digits and the combining marks that belong to them. */
const wordCharacter = /^[\p{L}\p{N}\p{M}]/u;
const separators = /[/_-]/g;
const combiningMarks = /\p{M}/gu;
const combiningMark = /\p{M}/u;
/** A character as matching sees it: one code point and the combining marks after it. */
const characterCluster = /\P{M}\p{M}*|\p{M}+/gsu;

/** The code point that ends right before `index`, keeping a surrogate pair whole. */
function characterBefore(text: string, index: number): string | undefined {
  if (index <= 0) return undefined;
  const unit = text.charCodeAt(index - 1);
  const isLowSurrogate = unit >= 0xdc00 && unit <= 0xdfff;
  return text.slice(isLowSurrogate && index >= 2 ? index - 2 : index - 1, index);
}

function isWordCharacter(character: string | undefined): boolean {
  return character !== undefined && wordCharacter.test(character);
}

/**
 * Whether `term`, found at `index` in `text`, counts as a word match: it starts a word, and either
 * ends it or is at least three characters long (so a partly typed word still matches). Characters
 * are whole code points, and a combining mark belongs to the word of its letter.
 * `text` and `term` are compared as given; normalize both first.
 */
export function isWordMatchAt(text: string, index: number, term: string): boolean {
  if (index < 0 || isWordCharacter(characterBefore(text, index))) return false;
  if ([...term].length >= wordPrefixMinLength) return true;
  return !isWordCharacter(text.slice(index + term.length, index + term.length + 2));
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

/** One character cluster as matching sees it: composed or accent-free, lower case, separators as spaces. */
function foldCluster(cluster: string, ignoreAccents: boolean): string {
  const base = ignoreAccents
    ? cluster.normalize('NFD').replace(combiningMarks, '')
    : cluster.normalize('NFC');
  return base.toLowerCase().normalize('NFC').replace(separators, ' ');
}

/** Searchable text, and for each of its code units the range of the original it came from. */
interface Searchable {
  text: string;
  starts: number[];
  ends: number[];
}

function toSearchable(text: string, ignoreAccents: boolean): Searchable {
  const searchable: Searchable = { text: '', starts: [], ends: [] };
  for (const { 0: cluster, index } of text.matchAll(characterCluster)) {
    const folded = foldCluster(cluster, ignoreAccents);
    searchable.text += folded;
    for (let unit = 0; unit < folded.length; unit += 1) {
      searchable.starts.push(index);
      searchable.ends.push(index + cluster.length);
    }
  }
  return searchable;
}

/**
 * Lower-cases `text`, composes each letter with its combining marks and turns `/`, `_` and `-` into
 * spaces. With `ignoreAccents`, an accented letter becomes its base letter (`é` → `e`), whether
 * the text writes it composed or with combining marks.
 */
export function normalizeMatchText(text: string, options: MatchTextOptions = {}): string {
  return toSearchable(text, options.ignoreAccents ?? false).text;
}

/** Splits a typed query into normalized, non-empty terms. */
export function splitMatchTerms(query: string, options: MatchTextOptions = {}): string[] {
  return normalizeMatchText(query, options).split(/\s+/).filter(Boolean);
}

/** How occurrences count: as words, and whether accents may be left out. */
interface MatchRules {
  matchWords: boolean;
  ignoreAccents: boolean;
}

/** A term found at an index of the normalized text. */
interface Occurrence {
  start: number;
  term: string;
}

/**
 * Whether an occurrence of `term` at `start` counts. Without `ignoreAccents` it may not stop before
 * a combining mark left after composing, so `q` does not match `q` with an accent.
 */
function isMatchAt(haystack: string, { start, term }: Occurrence, rules: MatchRules): boolean {
  if (rules.matchWords && !isWordMatchAt(haystack, start, term)) return false;
  return rules.ignoreAccents || !combiningMark.test(haystack[start + term.length] ?? '');
}

/** Whether `term` occurs in `haystack` by the rules, stopping at the first occurrence that counts. */
function hasOccurrence(haystack: string, term: string, rules: MatchRules): boolean {
  for (
    let start = haystack.indexOf(term);
    start !== -1;
    start = haystack.indexOf(term, start + 1)
  ) {
    if (isMatchAt(haystack, { start, term }, rules)) return true;
  }
  return false;
}

/** Every occurrence of `term` in `haystack`, as ranges tagged with the term's index. */
function findOccurrences(
  haystack: string,
  { term, index }: { term: string; index: number },
  rules: MatchRules,
) {
  const ranges: TextMatchRange[] = [];
  let from = 0;
  while (from + term.length <= haystack.length) {
    const start = haystack.indexOf(term, from);
    if (start < 0) break;
    if (!isMatchAt(haystack, { start, term }, rules)) {
      from = start + 1;
      continue;
    }
    ranges.push({ start, end: start + term.length, term: index });
    from = start + term.length;
  }
  return ranges;
}

/** The terms as the text is searched: folded the same way, empty ones kept so indexes hold. */
function foldTerms(terms: readonly string[], ignoreAccents: boolean): string[] {
  return terms.map((term) => normalizeMatchText(term, { ignoreAccents }));
}

/**
 * The ranges of `text` where any term occurs, sorted, with overlapping or touching ranges merged
 * (keeping the term that starts first). Text and terms match whatever their composition, and a
 * range always covers whole characters: never half a surrogate pair, never a letter without its
 * combining marks.
 */
export function findTermRanges(
  text: string,
  terms: readonly string[],
  { matchWords = false, ignoreAccents = false }: FindTermRangesOptions = {},
): TextMatchRange[] {
  const searchable = toSearchable(text, ignoreAccents);
  const rules = { matchWords, ignoreAccents };
  const ranges = foldTerms(terms, ignoreAccents).flatMap((term, index) =>
    term ? findOccurrences(searchable.text, { term, index }, rules) : [],
  );
  ranges.sort((left, right) => left.start - right.start || left.end - right.end);
  const merged: TextMatchRange[] = [];
  for (const { start, end, term } of ranges) {
    const range = {
      start: searchable.starts[start] ?? 0,
      end: searchable.ends[end - 1] ?? text.length,
      term,
    };
    const last = merged.at(-1);
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push(range);
  }
  return merged;
}

/** Whether every term occurs in `text`. No terms means no filter, so any text matches. */
export function textMatchesTerms(
  text: string,
  terms: readonly string[],
  options: MatchTextOptions = {},
): boolean {
  const ignoreAccents = options.ignoreAccents ?? false;
  const haystack = normalizeMatchText(text, options);
  const rules = { matchWords: false, ignoreAccents };
  return foldTerms(terms, ignoreAccents).every(
    (term) => term.length > 0 && hasOccurrence(haystack, term, rules),
  );
}
