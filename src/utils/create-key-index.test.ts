import { describe, expect, it } from 'vitest';
import { createKeyIndex } from './create-key-index.js';
import { toCollectionKey } from './to-collection-key.js';

describe('createKeyIndex', () => {
  it('UIC-COMPOSITION-4.1 resolves typed collection identities without string coercion', () => {
    const keys = [1, '1', 0, '', '["number","1"]', '"\\[]', 'a b', 'ab'];
    const index = createKeyIndex(keys);
    expect(index.size).toBe(keys.length);
    for (const key of keys) expect(index.get(toCollectionKey(key))).toBe(key);
    expect(index.get('1')).toBeUndefined();
  });
});
