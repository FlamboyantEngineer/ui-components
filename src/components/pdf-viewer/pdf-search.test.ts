import { describe, expect, it } from 'vitest';
import { createPageText, findMatchFrom, findTextMatches, groupMatchRanges } from './pdf-search.js';

const pages = [
  createPageText({
    items: [
      { str: 'The apple harvest began', hasEOL: true },
      { type: 'beginMarkedContent' },
      { str: 'and the pear', hasEOL: false },
      { str: ' Harvest followed.', hasEOL: true },
    ],
  }),
  createPageText({ items: [{ str: 'No fruit here.', hasEOL: false }] }),
  createPageText({ items: [{ str: 'A late harvest', hasEOL: true }] }),
];

describe('PDF search', () => {
  it('UIC-PDF-VIEWER-5.1 joins a page’s runs with line breaks and finds matches ignoring case', () => {
    expect(pages[0]?.text).toBe('The apple harvest began\nand the pear Harvest followed.\n');
    expect(pages[0]?.starts).toEqual([0, 24, 36]);
    expect(findTextMatches(pages, 'HARVEST')).toEqual([
      { pageIndex: 0, start: 10, end: 17 },
      { pageIndex: 0, start: 37, end: 44 },
      { pageIndex: 2, start: 7, end: 14 },
    ]);
    expect(findTextMatches(pages, '   ')).toEqual([]);
    expect(findTextMatches(pages, 'a.b')).toEqual([]);
  });

  it('UIC-PDF-VIEWER-5.1 matches a phrase across a line break and splits it over its runs', () => {
    const matches = findTextMatches(pages, 'began   and');
    expect(matches).toEqual([{ pageIndex: 0, start: 18, end: 27 }]);
    expect(groupMatchRanges(pages, matches, 0).get(0)).toEqual([
      { run: 0, start: 18, end: 23, isCurrent: true },
      { run: 1, start: 0, end: 3, isCurrent: true },
    ]);
  });

  it('UIC-PDF-VIEWER-5.3 starts at the first match on or after a page, wrapping to the first', () => {
    const matches = findTextMatches(pages, 'harvest');
    expect(findMatchFrom(matches, 0)).toBe(0);
    expect(findMatchFrom(matches, 1)).toBe(2);
    expect(findMatchFrom(matches, 3)).toBe(0);
    const ranges = groupMatchRanges(pages, matches, 2);
    expect(ranges.get(0)?.map((range) => range.isCurrent)).toEqual([false, false]);
    expect(ranges.get(2)).toEqual([{ run: 0, start: 7, end: 14, isCurrent: true }]);
    expect(ranges.has(1)).toBe(false);
  });
});
