import { isTextItem, type PdfTextContent } from './pdf-engine.js';

/** A page's searchable text: its runs joined, with a line break after each run that ends a line. */
export interface PdfPageText {
  text: string;
  /** Where each run starts in `text`. */
  starts: number[];
  lengths: number[];
}

/** One occurrence of the query, as offsets into its page's text. */
export interface PdfMatch {
  pageIndex: number;
  start: number;
  end: number;
}

/** How the find matches the query. */
export interface PdfSearchOptions {
  /** Highlights every match, not only the current one. Defaults to true. */
  highlightAll?: boolean | undefined;
  /** Tells upper and lower case apart. */
  matchCase?: boolean | undefined;
  /** Folds accented letters to their base letter, so `cafe` finds `café`. */
  ignoreAccents?: boolean | undefined;
  /** Finds the query only where it is a whole word or words. */
  wholeWords?: boolean | undefined;
}

/** The part of a match that lies in one text run, as offsets into that run. */
export interface PdfMatchRange {
  run: number;
  start: number;
  end: number;
  isCurrent: boolean;
}

const combiningMarks = /\p{M}/gu;
// A letter, mark, digit or underscore on either side of a match makes it part of a longer word.
const wordBefore = '(?<![\\p{L}\\p{M}\\p{N}_])';
const wordAfter = '(?![\\p{L}\\p{M}\\p{N}_])';

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Accented letters as their base letter, one character at a time, so an index in the result is the
 * same index in `text`. A letter whose base form has another length is kept.
 */
function foldAccents(text: string): string {
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
function createQueryPattern(query: string, options: PdfSearchOptions): RegExp | null {
  const text = options.ignoreAccents ? query.normalize('NFD').replace(combiningMarks, '') : query;
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  const mark = options.ignoreAccents ? '\\p{M}*' : '';
  const body = words
    .map((word) => [...word].map((character) => escapeRegExp(character) + mark).join(''))
    .join('\\s+');
  const source = options.wholeWords ? `${wordBefore}${body}${wordAfter}` : body;
  return new RegExp(source, options.matchCase ? 'gu' : 'giu');
}

function toRunRanges(page: PdfPageText, match: PdfMatch, isCurrent: boolean): PdfMatchRange[] {
  const ranges: PdfMatchRange[] = [];
  page.starts.forEach((runStart, run) => {
    const start = Math.max(match.start, runStart);
    const end = Math.min(match.end, runStart + (page.lengths[run] ?? 0));
    if (start < end) ranges.push({ run, start: start - runStart, end: end - runStart, isCurrent });
  });
  return ranges;
}

export function createPageText(content: PdfTextContent): PdfPageText {
  const page: PdfPageText = { text: '', starts: [], lengths: [] };
  for (const item of content.items) {
    if (!isTextItem(item)) continue;
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
export function findTextMatches(
  pages: readonly PdfPageText[],
  query: string,
  options: PdfSearchOptions = {},
): PdfMatch[] {
  const pattern = createQueryPattern(query, options);
  if (!pattern) return [];
  return pages.flatMap((page, pageIndex) =>
    [...(options.ignoreAccents ? foldAccents(page.text) : page.text).matchAll(pattern)].map(
      (found) => ({
        pageIndex,
        start: found.index,
        end: found.index + found[0].length,
      }),
    ),
  );
}

/** The first match on `pageIndex` or after it, wrapping to the first match. */
export function findMatchFrom(matches: readonly PdfMatch[], pageIndex: number): number {
  return Math.max(
    0,
    matches.findIndex((match) => match.pageIndex >= pageIndex),
  );
}

/**
 * The match ranges of every page that has highlighted matches, keyed by page index: every match,
 * or only the current one without `highlightAll`.
 */
export function groupMatchRanges(
  pages: readonly PdfPageText[],
  matches: readonly PdfMatch[],
  { current, highlightAll = true }: { current: number; highlightAll?: boolean | undefined },
): Map<number, PdfMatchRange[]> {
  const groups = new Map<number, PdfMatchRange[]>();
  matches.forEach((match, index) => {
    const page = pages[match.pageIndex];
    if (!page || (!highlightAll && index !== current)) return;
    const ranges = groups.get(match.pageIndex) ?? [];
    ranges.push(...toRunRanges(page, match, index === current));
    groups.set(match.pageIndex, ranges);
  });
  return groups;
}
