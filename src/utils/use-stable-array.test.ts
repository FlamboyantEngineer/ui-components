import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { isSameArray, useStableArray } from './use-stable-array.js';

describe('isSameArray', () => {
  it('compares the items in order, objects by their fields', () => {
    expect(isSameArray(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(isSameArray([{ id: 'a', start: 0 }], [{ id: 'a', start: 0 }])).toBe(true);
    expect(isSameArray(['a', 'b'], ['b', 'a'])).toBe(false);
    expect(isSameArray(['a'], ['a', 'a'])).toBe(false);
    expect(isSameArray([{ id: 'a', start: 0 }], [{ id: 'a', start: 1 }])).toBe(false);
    expect(isSameArray([{ id: 'a' }], [{ id: 'a', label: undefined }])).toBe(false);
    expect(isSameArray([null], [{}])).toBe(false);
    expect(isSameArray([Number.NaN], [Number.NaN])).toBe(true);
  });
});

describe('useStableArray', () => {
  it('keeps the first array while a rebuilt one holds the same items', () => {
    const { result, rerender } = renderHook(({ items }) => useStableArray(items), {
      initialProps: { items: [{ id: 'maria', start: 0, end: 6 }] as readonly object[] },
    });
    const first = result.current;
    rerender({ items: [{ id: 'maria', start: 0, end: 6 }] });
    expect(result.current).toBe(first);
    const moved = [{ id: 'maria', start: 2, end: 8 }];
    rerender({ items: moved });
    expect(result.current).toBe(moved);
  });

  it('keeps an empty array across renders', () => {
    const { result, rerender } = renderHook(({ items }) => useStableArray(items), {
      initialProps: { items: [] as readonly string[] },
    });
    const first = result.current;
    rerender({ items: [] });
    expect(result.current).toBe(first);
  });
});
