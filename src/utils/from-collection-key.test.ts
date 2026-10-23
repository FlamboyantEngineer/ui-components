import { describe, expect, it } from 'vitest';
import { fromCollectionKey } from './from-collection-key.js';
import { toCollectionKey } from './to-collection-key.js';

describe('fromCollectionKey', () => {
  it('UIC-COMPOSITION-4.1 restores typed keys with whitespace, Unicode and encoded JSON text', () => {
    const keys = [
      1,
      '1',
      0,
      NaN,
      Infinity,
      -Infinity,
      '',
      'a b',
      'ab',
      'a\tb\nc',
      '🌳 café',
      '%20',
      '["number","1"]',
      toCollectionKey(1),
    ];
    for (const key of keys) expect(fromCollectionKey(toCollectionKey(key))).toBe(key);
  });

  it('UIC-COMPOSITION-4.1 leaves generated IDs and invalid encodings unchanged', () => {
    const keys = [
      2,
      'react-aria-1',
      '%',
      '["string","x"]',
      encodeURIComponent('["other","x"]'),
      encodeURIComponent('["string",1]'),
      encodeURIComponent('["number","01"]'),
      encodeURIComponent('["string","x","extra"]'),
      encodeURIComponent('{"key":"x"}'),
    ];
    for (const key of keys) expect(fromCollectionKey(key)).toBe(key);
  });
});
