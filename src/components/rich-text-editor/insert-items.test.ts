import { describe, expect, it } from 'vitest';
import { type InsertMenuItem, matchInsertItems } from './insert-items.js';

const item = (id: string, label: string, keywords: readonly string[]): InsertMenuItem => ({
  id,
  label,
  keywords,
  command: { type: 'insert-text', text: label },
});

describe('matchInsertItems', () => {
  it('UIC-RICH-TEXT-EDITOR-8.1 orders label and keyword matches by score, preserving ties', () => {
    const items = [
      item('word', 'A note', []),
      item('keyword', 'Other', ['note']),
      item('label', 'Notes', []),
      item('absent', 'Plain', []),
    ];
    expect(matchInsertItems(items, 'note').map(({ id }) => id)).toEqual([
      'keyword',
      'label',
      'word',
    ]);
    expect(matchInsertItems(items, '')).toEqual(items);
    expect(matchInsertItems(items, 'missing')).toEqual([]);
  });

  it('UIC-RICH-TEXT-EDITOR-8.1 scans a large keyword list without allocating score arrays', () => {
    const keywords = Array.from({ length: 200_000 }, () => 'A note');
    const entry = item('large', 'Other', keywords);
    expect(matchInsertItems([entry], 'note')).toEqual([entry]);
  });

  it('UIC-RICH-TEXT-EDITOR-8.1 skips remaining keywords once it has a prefix match', () => {
    let reads = 0;
    const keywords = ['notes', 'other'];
    Object.defineProperty(keywords, 1, {
      get: () => {
        reads++;
        return 'other';
      },
    });
    const entry = item('early', 'Other', keywords);
    expect(matchInsertItems([entry], 'note')).toEqual([entry]);
    expect(reads).toBe(0);
  });
});
