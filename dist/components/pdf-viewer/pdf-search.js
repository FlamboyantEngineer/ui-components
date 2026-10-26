import { isTextItem } from './pdf-engine.js';
import { escapeRegExp } from '../../utils/escape-regexp.js';
const combiningMarks = /\p{M}/gu;
// A letter, mark, digit or underscore on either side of a match makes it part of a longer word.
const wordBefore = '(?<![\\p{L}\\p{M}\\p{N}_])';
const wordAfter = '(?![\\p{L}\\p{M}\\p{N}_])';
/**
 * Accented letters as their base letter, one character at a time, so an index in the result is the
 * same index in `text`. A letter whose base form has another length is kept.
 */
function foldAccents(text) {
    let folded = '';
    for (const character of text) {
        const base = character.normalize('NFD').replace(combiningMarks, '');
        folded += base.length === character.length ? base : character;
    }
    return folded;
}
/**
 * The query as a pattern: whitespace matches any whitespace; ignoring accents, any combining mark
 * may follow each character, so a decomposed accent in the page's text matches too.
 */
function createQueryPattern(query, options) {
    const text = options.ignoreAccents ? query.normalize('NFD').replace(combiningMarks, '') : query;
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0)
        return null;
    const mark = options.ignoreAccents ? '\\p{M}*' : '';
    const body = words
        .map((word) => [...word].map((character) => escapeRegExp(character) + mark).join(''))
        .join('\\s+');
    const source = options.wholeWords ? `${wordBefore}${body}${wordAfter}` : body;
    return new RegExp(source, options.matchCase ? 'gu' : 'giu');
}
function findFirstRun(page, offset) {
    let low = 0;
    let high = page.starts.length;
    while (low < high) {
        const middle = (low + high) >>> 1;
        const end = (page.starts[middle] ?? 0) + (page.lengths[middle] ?? 0);
        if (end <= offset)
            low = middle + 1;
        else
            high = middle;
    }
    return low;
}
function appendRunRanges(page, match, { ranges, isCurrent }) {
    for (let run = findFirstRun(page, match.start); run < page.starts.length; run += 1) {
        const runStart = page.starts[run] ?? 0;
        if (runStart >= match.end)
            break;
        const start = Math.max(match.start, runStart);
        const end = Math.min(match.end, runStart + (page.lengths[run] ?? 0));
        if (start < end)
            ranges.push({ run, start: start - runStart, end: end - runStart, isCurrent });
    }
}
export function createPageText(content) {
    const page = { text: '', starts: [], lengths: [] };
    for (const item of content.items) {
        if (!isTextItem(item))
            continue;
        page.starts.push(page.text.length);
        page.lengths.push(item.str.length);
        page.text += item.hasEOL ? `${item.str}\n` : item.str;
    }
    return page;
}
/**
 * Every occurrence of `query` in page order, ignoring case unless `matchCase`. Whitespace in the
 * query matches any run of whitespace, including a line break, so a phrase is found across lines.
 */
export function findTextMatches(pages, query, options = {}) {
    const pattern = createQueryPattern(query, options);
    if (!pattern)
        return [];
    return pages.flatMap((page, pageIndex) => [...(options.ignoreAccents ? foldAccents(page.text) : page.text).matchAll(pattern)].map((found) => ({
        pageIndex,
        start: found.index,
        end: found.index + found[0].length,
    })));
}
/** The first match on `pageIndex` or after it, wrapping to the first match. */
export function findMatchFrom(matches, pageIndex) {
    return Math.max(0, matches.findIndex((match) => match.pageIndex >= pageIndex));
}
/**
 * The match ranges of every page that has highlighted matches, keyed by page index: every match,
 * or only the current one without `highlightAll`.
 */
export function groupMatchRanges(pages, matches, { current, highlightAll = true }) {
    const groups = new Map();
    matches.forEach((match, index) => {
        const page = pages[match.pageIndex];
        if (!page || (!highlightAll && index !== current))
            return;
        const ranges = groups.get(match.pageIndex) ?? [];
        appendRunRanges(page, match, { ranges, isCurrent: index === current });
        groups.set(match.pageIndex, ranges);
    });
    return groups;
}
//# sourceMappingURL=pdf-search.js.map