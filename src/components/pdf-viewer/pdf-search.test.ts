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
    expect(groupMatchRanges(pages, matches, { current: 0 }).get(0)).toEqual([
      { run: 0, start: 18, end: 23, isCurrent: true },
      { run: 1, start: 0, end: 3, isCurrent: true },
    ]);
  });

  it('UIC-PDF-VIEWER-5.3 starts at the first match on or after a page, wrapping to the first', () => {
    const matches = findTextMatches(pages, 'harvest');
    expect(findMatchFrom(matches, 0)).toBe(0);
    expect(findMatchFrom(matches, 1)).toBe(2);
    expect(findMatchFrom(matches, 3)).toBe(0);
    const ranges = groupMatchRanges(pages, matches, { current: 2 });
    expect(ranges.get(0)?.map((range) => range.isCurrent)).toEqual([false, false]);
    expect(ranges.get(2)).toEqual([{ run: 0, start: 7, end: 14, isCurrent: true }]);
    expect(ranges.has(1)).toBe(false);
  });

  it('UIC-PDF-VIEWER-5.7 matches case, accents and whole words as the options ask', () => {
    const texts = [
      createPageText({
        items: [
          { str: 'Café Pear and pear', hasEOL: true },
          { str: 'cafe\u0301 pears appear', hasEOL: true },
        ],
      }),
    ];
    const found = (query: string, options = {}) =>
      findTextMatches(texts, query, options).map(({ start, end }) =>
        texts[0]?.text.slice(start, end),
      );
    expect(found('pear')).toEqual(['Pear', 'pear', 'pear', 'pear']);
    expect(found('pear', { matchCase: true })).toEqual(['pear', 'pear', 'pear']);
    expect(found('pear', { wholeWords: true })).toEqual(['Pear', 'pear']);
    expect(found('pear', { matchCase: true, wholeWords: true })).toEqual(['pear']);
    expect(found('cafe')).toEqual(['cafe']);
    expect(found('cafe', { ignoreAccents: true })).toEqual(['Café', 'cafe\u0301']);
    expect(found('CAFÉ', { ignoreAccents: true, matchCase: true })).toEqual([]);
    expect(found('café', { ignoreAccents: true, wholeWords: true })).toEqual([
      'Café',
      'cafe\u0301',
    ]);
    expect(found('caf', { ignoreAccents: true, wholeWords: true })).toEqual([]);
    expect(found('e pear', { ignoreAccents: true })).toEqual(['é Pear', 'e\u0301 pear']);
  });

  it('UIC-PDF-VIEWER-5.7 highlights only the current match without highlight all', () => {
    const matches = findTextMatches(pages, 'harvest');
    const ranges = groupMatchRanges(pages, matches, { current: 1, highlightAll: false });
    expect([...ranges.keys()]).toEqual([0]);
    expect(ranges.get(0)).toEqual([{ run: 2, start: 1, end: 8, isCurrent: true }]);
  });
});
