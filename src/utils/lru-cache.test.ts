import { describe, expect, it } from 'vitest';
import { createLruCache } from './lru-cache.js';

describe('bounded caches', () => {
  it('UIC-PROVIDER-3.6 evicts the least recently read entry', () => {
    const cache = createLruCache<string, number>(2);
    cache.set('first', 1);
    cache.set('second', 2);
    expect(cache.get('first')).toBe(1);
    cache.set('third', 3);
    expect(cache.get('second')).toBeUndefined();
    expect(cache.get('first')).toBe(1);
    expect(cache.get('third')).toBe(3);
  });

  it('UIC-SVG-MARKUP-1.3 updates recency without evicting an extra entry', () => {
    const cache = createLruCache<string, number>(2);
    cache.set('first', 1);
    cache.set('second', 2);
    cache.set('first', 3);
    expect(cache.get('second')).toBe(2);
    cache.set('third', 4);
    expect(cache.get('first')).toBeUndefined();
    expect(cache.get('second')).toBe(2);
    expect(cache.get('third')).toBe(4);
  });

  it('UIC-PROVIDER-3.6 bounds caches with undefined keys and values too', () => {
    const cache = createLruCache<string | undefined, number | undefined>(1);
    cache.set(undefined, undefined);
    expect(cache.get(undefined)).toBeUndefined();
    cache.set('next', 2);
    expect(cache.get('next')).toBe(2);
    cache.set(undefined, 3);
    expect(cache.get('next')).toBeUndefined();
    expect(cache.get(undefined)).toBe(3);
  });

  it('UIC-PROVIDER-3.6 refuses a capacity that cannot bound its entries', () => {
    for (const capacity of [0, -1, 1.5, Number.NaN, Infinity]) {
      expect(() => createLruCache(capacity)).toThrow(RangeError);
    }
  });
});
