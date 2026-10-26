// Pure query matching for TextMatch: normalization, term splitting, ranges and whole-word rules.
/** Terms at least this long also match the start of a longer word. */
const wordPrefixMinLength = 3;
const wordCharacter = /[\p{L}\p{N}]/u;
const separators = /[/_-]/g;
const combiningMarks = /\p{M}/gu;
const combiningMark = /\p{M}/u;
function isWordCharacter(character) {
    return character !== undefined && wordCharacter.test(character);
}
/**
 * Whether `term`, found at `index` in `text`, counts as a word match: it starts a word, and either
 * ends it or is at least three characters long (so a partly typed word still matches).
 * `text` and `term` are compared as given; normalize both first.
 */
export function isWordMatchAt(text, index, term) {
    if (index < 0 || isWordCharacter(text[index - 1]))
        return false;
    return term.length >= wordPrefixMinLength || !isWordCharacter(text[index + term.length]);
}
/** Every index at which `term` is a word match in `text`. */
export function findWordMatches(text, term) {
    const positions = [];
    if (!term)
        return positions;
    for (let index = text.indexOf(term); index !== -1; index = text.indexOf(term, index + 1)) {
        if (isWordMatchAt(text, index, term))
            positions.push(index);
    }
    return positions;
}
/** One character, accent-folded and lower-cased where that keeps its length. */
function foldCharacter(character, ignoreAccents) {
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
export function normalizeMatchText(text, options = {}) {
    const ignoreAccents = options.ignoreAccents ?? false;
    let normalized = '';
    for (const character of text) {
        normalized += foldCharacter(character, ignoreAccents).replace(separators, ' ');
    }
    return normalized;
}
/** Splits a typed query into normalized, non-empty terms. */
export function splitMatchTerms(query, options = {}) {
    const normalized = normalizeMatchText(query, options);
    // Terms need no index alignment, so a decomposed accent typed in the query is dropped entirely.
    const folded = options.ignoreAccents
        ? normalized.normalize('NFD').replace(combiningMarks, '')
        : normalized;
    return folded.split(/\s+/).filter(Boolean);
}
/**
 * Whether an occurrence of `term` at `start` counts. Without `ignoreAccents` it may not stop before
 * a combining mark, so `cafe` does not match a decomposed `café` any more than a composed one.
 */
function isMatchAt(haystack, { start, term }, rules) {
    if (rules.matchWords && !isWordMatchAt(haystack, start, term))
        return false;
    return rules.ignoreAccents || !combiningMark.test(haystack[start + term.length] ?? '');
}
/** Whether `term` occurs in `haystack` by the rules, stopping at the first occurrence that counts. */
function hasOccurrence(haystack, term, rules) {
    for (let start = haystack.indexOf(term); start !== -1; start = haystack.indexOf(term, start + 1)) {
        if (isMatchAt(haystack, { start, term }, rules))
            return true;
    }
    return false;
}
/** Every occurrence of `term` in `haystack`, as ranges tagged with the term's index. */
function findOccurrences(haystack, { term, index }, rules) {
    const ranges = [];
    let from = 0;
    while (from + term.length <= haystack.length) {
        const start = haystack.indexOf(term, from);
        if (start < 0)
            break;
        if (!isMatchAt(haystack, { start, term }, rules)) {
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
export function findTermRanges(text, terms, { matchWords = false, ignoreAccents = false } = {}) {
    const haystack = normalizeMatchText(text, { ignoreAccents });
    const rules = { matchWords, ignoreAccents };
    const ranges = terms.flatMap((term, index) => term ? findOccurrences(haystack, { term, index }, rules) : []);
    ranges.sort((left, right) => left.start - right.start || left.end - right.end);
    const merged = [];
    for (const range of ranges) {
        while (combiningMark.test(text[range.end] ?? ''))
            range.end += 1;
        const last = merged.at(-1);
        if (last && range.start <= last.end)
            last.end = Math.max(last.end, range.end);
        else
            merged.push({ ...range });
    }
    return merged;
}
/** Whether every term occurs in `text`. No terms means no filter, so any text matches. */
export function textMatchesTerms(text, terms, options = {}) {
    const haystack = normalizeMatchText(text, options);
    const rules = { matchWords: false, ignoreAccents: options.ignoreAccents ?? false };
    return terms.every((term) => term.length > 0 && hasOccurrence(haystack, term, rules));
}
//# sourceMappingURL=match-ranges.js.map