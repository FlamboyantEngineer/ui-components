import { describe, expect, it } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import { createFilterMatcher, matchesFilterCondition } from './filter-matching.js';
import type { FilterCondition, FilterField, FilterValue } from './filter-model.js';

const fields: Record<string, FilterField> = {
  title: { id: 'title', label: 'Title', type: 'text' },
  pages: { id: 'pages', label: 'Pages', type: 'number' },
  published: { id: 'published', label: 'Published', type: 'date' },
  genre: { id: 'genre', label: 'Genre', type: 'choice' },
  readers: { id: 'readers', label: 'Reader', type: 'person' },
  available: { id: 'available', label: 'Available', type: 'boolean' },
};

function test(field: string, operator: FilterCondition['operator'], value: FilterValue) {
  const condition = { field, operator, value };
  return (recordValue: Parameters<typeof matchesFilterCondition>[0]) =>
    matchesFilterCondition(recordValue, condition, requireDefined(fields[field]));
}

describe('filter matching', () => {
  it('UIC-FILTER-BAR-3.1 matches text without case', () => {
    expect(test('title', 'contains', 'SEA')('A Lantern at Sea')).toBe(true);
    expect(test('title', 'not-contains', 'sea')('A Lantern at Sea')).toBe(false);
    expect(test('title', 'equals', 'the salt road')('The Salt Road')).toBe(true);
    expect(test('title', 'not-equals', 'the salt road')('The Salt')).toBe(true);
    expect(test('title', 'starts-with', 'the')('The Salt Road')).toBe(true);
    expect(test('title', 'starts-with', 'salt')('The Salt Road')).toBe(false);
  });

  it('UIC-FILTER-BAR-3.1 compares text as written, spaces included', () => {
    expect(test('title', 'equals', ' Alpha ')(' alpha ')).toBe(true);
    expect(test('title', 'equals', ' Alpha ')('Alpha')).toBe(false);
    expect(test('title', 'not-equals', ' Alpha ')(' Alpha ')).toBe(false);
    expect(test('title', 'not-equals', ' Alpha ')('Alpha')).toBe(true);
    expect(test('title', 'starts-with', ' Al')(' Alpha')).toBe(true);
    expect(test('title', 'starts-with', ' Al')('Alpha')).toBe(false);
    expect(test('title', 'contains', 'salt ')('The Salt Road')).toBe(true);
    expect(test('title', 'contains', ' salt')('Salt')).toBe(false);
    expect(test('title', 'not-contains', ' salt')('Salt')).toBe(true);
    expect(test('title', 'equals', ' Alpha ')(['Blue', ' ALPHA '])).toBe(true);
    // A blank operand is incomplete: it passes every record.
    expect(test('title', 'equals', '   ')('anything')).toBe(true);
  });

  it('UIC-FILTER-BAR-3.1 compares numbers and inclusive ranges', () => {
    expect(test('pages', 'equals', 300)(300)).toBe(true);
    expect(test('pages', 'not-equals', 300)(300)).toBe(false);
    expect(test('pages', 'less-than', 300)(300)).toBe(false);
    expect(test('pages', 'at-most', 300)(300)).toBe(true);
    expect(test('pages', 'greater-than', 300)(301)).toBe(true);
    expect(test('pages', 'at-least', 300)(299)).toBe(false);
    const between = test('pages', 'between', { min: 100, max: 200 });
    expect([99, 100, 200, 201].map(between)).toEqual([false, true, true, false]);
    expect(test('pages', 'equals', 300)('300')).toBe(false);
  });

  it('UIC-FILTER-BAR-3.1 compares dates by day', () => {
    expect(test('published', 'equals', '2024-03-02')('2024-03-02T23:10:00')).toBe(true);
    expect(test('published', 'equals', '2024-03-02')(new Date(2024, 2, 2, 18))).toBe(true);
    expect(test('published', 'before', '2024-03-02')('2024-03-01')).toBe(true);
    expect(test('published', 'after', '2024-03-02')('2024-03-02')).toBe(false);
    const within = test('published', 'between', { start: '2024-03-01', end: '2024-03-31' });
    expect(['2024-02-29', '2024-03-01', '2024-03-31', '2024-04-01'].map(within)).toEqual([
      false,
      true,
      true,
      false,
    ]);
    expect(test('published', 'after', '2024-03-02')('soon')).toBe(false);
    expect(test('published', 'after', '2024-03-02')(new Date(Number.NaN))).toBe(false);
  });

  it.each([1, 99, 999, 1000, 2024])(
    'UIC-FILTER-BAR-3.1 reads a Date in year %i as the same day as its ISO text',
    (year) => {
      const date = new Date(2000, 0, 2, 12);
      date.setFullYear(year);
      const day = `${String(year).padStart(4, '0')}-01-02`;
      expect(test('published', 'equals', day)(date)).toBe(true);
      expect(test('published', 'equals', day)(day)).toBe(true);
      expect(test('published', 'before', '1000-01-01')(date)).toBe(year < 1000);
      expect(test('published', 'after', '0050-06-01')(date)).toBe(year > 50);
      const within = test('published', 'between', { start: '0001-01-01', end: '0999-12-31' });
      expect(within(date)).toBe(year < 1000);
    },
  );

  it('UIC-FILTER-BAR-3.1 gives a Date outside years 1 to 9999 no day', () => {
    const ancient = new Date(2000, 0, 2);
    ancient.setFullYear(0);
    expect(test('published', 'before', '0001-01-01')(ancient)).toBe(false);
    expect(test('published', 'not-empty', null)(ancient)).toBe(true);
  });

  it('UIC-FILTER-BAR-3.1 matches options, lists, booleans and emptiness', () => {
    expect(test('genre', 'any-of', ['history', 'travel'])('travel')).toBe(true);
    expect(test('genre', 'none-of', ['history', 'travel'])('travel')).toBe(false);
    expect(test('readers', 'any-of', ['jon'])(['maria', 'jon'])).toBe(true);
    expect(test('readers', 'none-of', ['jon'])(['maria', 'jon'])).toBe(false);
    expect(test('readers', 'none-of', ['jon'])([])).toBe(true);
    expect(test('available', 'equals', false)(false)).toBe(true);
    expect(test('available', 'equals', false)(true)).toBe(false);
    for (const empty of [null, undefined, '', []]) {
      expect(test('readers', 'empty', null)(empty)).toBe(true);
      expect(test('readers', 'not-empty', null)(empty)).toBe(false);
    }
    expect(test('readers', 'not-empty', null)(['sam'])).toBe(true);
  });

  it('UIC-FILTER-BAR-3.1 lets an incomplete condition pass every record', () => {
    expect(test('title', 'contains', '')('anything')).toBe(true);
    expect(test('genre', 'any-of', [])(null)).toBe(true);
  });

  it('UIC-FILTER-BAR-3.2 tests a record against every condition on known fields', () => {
    const books = [
      { title: 'The Salt Road', pages: 312, genre: 'history' },
      { title: 'Bread Without Haste', pages: 240, genre: 'cooking' },
      { title: 'Rivers and Bridges', pages: 150, genre: 'travel' },
    ];
    const matches = createFilterMatcher({
      conditions: [
        { field: 'pages', operator: 'at-least', value: 200 },
        { field: 'genre', operator: 'none-of', value: ['cooking'] },
        { field: 'colour', operator: 'equals', value: 'red' },
      ],
      fields: Object.values(fields),
      getValue: (book: (typeof books)[number], id) => book[id as keyof typeof book],
    });
    expect(books.filter(matches).map((book) => book.title)).toEqual(['The Salt Road']);
    const all = createFilterMatcher({ conditions: [], fields: [], getValue: () => null });
    expect(books.every(all)).toBe(true);
  });
});
