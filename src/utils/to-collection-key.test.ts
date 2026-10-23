import { describe, expect, it } from 'vitest';
import { toCollectionKey } from './to-collection-key.js';

describe('toCollectionKey', () => {
  it('UIC-COMPOSITION-4.1 keeps typed and whitespace-normalized collection keys distinct', () => {
    const keys = [1, '1', 'a b', 'ab', '', '["string","a b"]', '%5B', '\t\n'];
    const encoded = keys.map(toCollectionKey);
    expect(new Set(encoded).size).toBe(keys.length);
    expect(encoded.every((key) => !/\s/.test(key))).toBe(true);
  });
});
