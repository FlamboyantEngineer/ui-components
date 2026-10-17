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

/** The part of a match that lies in one text run, as offsets into that run. */
export interface PdfMatchRange {
  run: number;
  start: number;
  end: number;
  isCurrent: boolean;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
 * Every case-insensitive occurrence of `query` in page order. Whitespace in the query matches any
 * run of whitespace, including a line break, so a phrase is found across lines.
 */
export function findTextMatches(pages: readonly PdfPageText[], query: string): PdfMatch[] {
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const pattern = new RegExp(words.map(escapeRegExp).join('\\s+'), 'giu');
  return pages.flatMap((page, pageIndex) =>
    [...page.text.matchAll(pattern)].map((found) => ({
      pageIndex,
      start: found.index,
      end: found.index + found[0].length,
    })),
  );
}

/** The first match on `pageIndex` or after it, wrapping to the first match. */
export function findMatchFrom(matches: readonly PdfMatch[], pageIndex: number): number {
  return Math.max(
    0,
    matches.findIndex((match) => match.pageIndex >= pageIndex),
  );
}

/** The match ranges of every page that has matches, keyed by page index. */
export function groupMatchRanges(
  pages: readonly PdfPageText[],
  matches: readonly PdfMatch[],
  current: number,
): Map<number, PdfMatchRange[]> {
  const groups = new Map<number, PdfMatchRange[]>();
  matches.forEach((match, index) => {
    const page = pages[match.pageIndex];
    if (!page) return;
    const ranges = groups.get(match.pageIndex) ?? [];
    ranges.push(...toRunRanges(page, match, index === current));
    groups.set(match.pageIndex, ranges);
  });
  return groups;
}
