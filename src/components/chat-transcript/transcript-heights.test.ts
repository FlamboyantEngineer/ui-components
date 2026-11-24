import { describe, expect, it, vi } from 'vitest';
import { createTranscriptHeights } from './transcript-heights.js';

function createOrder(keys: readonly string[]) {
  return { keys, indexOf: new Map(keys.map((key, index) => [key, index])) };
}

describe('Virtual transcript height estimates', () => {
  it('UIC-CHAT-TRANSCRIPT-1.6 probes logarithmically many offsets in a long history', () => {
    const heights = createTranscriptHeights();
    const keys = Array.from({ length: 50_000 }, (_, index) => `row-${index}`);
    const index = heights.inOrder(createOrder(keys));
    const beforeEdge = vi.fn((_end: number, height: number) => height < 25_000 * 64);
    expect(index.findPrefix(beforeEdge)).toBe(24_999);
    expect(beforeEdge.mock.calls.length).toBeLessThanOrEqual(Math.ceil(Math.log2(keys.length)));
  });

  it('UIC-CHAT-TRANSCRIPT-1.6 keeps measurements by key through a prepend and clears them on reset', () => {
    const heights = createTranscriptHeights();
    const original = createOrder(['a', 'b', 'c', 'd', 'e']);
    const prepended = createOrder(['older', 'a', 'b', 'c', 'd', 'e']);
    expect(heights.inOrder(original).heightBetween(0, 5)).toBe(5 * 64);
    heights.set('a', 45.25);
    heights.set('d', 0);
    heights.set('e', 63.5);
    const average = (45.25 + 63.5) / 3;
    const placed = heights.inOrder(prepended);
    expect(placed.heightBetween(0, 2)).toBeCloseTo(average + 45.25);
    expect(placed.heightBetween(3, 5)).toBeCloseTo(average);
    expect(placed.heightBetween(4, 6)).toBeCloseTo(63.5);
    const prefixHeights = [0, average, average + 45.25, 2 * average + 45.25];
    prefixHeights.push(3 * average + 45.25, 3 * average + 45.25, 3 * average + 108.75);
    for (let edge = 0; edge < 240; edge += 0.5) {
      const expected = prefixHeights.findLastIndex((height) => height <= edge);
      expect(placed.findPrefix((_end, height) => height <= edge)).toBe(expected);
    }
    const shortened = createOrder(['e', 'new', 'a']);
    expect(heights.inOrder(shortened).heightBetween(0, 3)).toBeCloseTo(108.75 + average);
    heights.set('a', 93);
    expect(heights.inOrder(shortened).heightBetween(0, 3)).toBeCloseTo(156.5 + 156.5 / 3);
    heights.reset();
    expect(heights.inOrder(prepended).heightBetween(0, 6)).toBe(6 * 64);
  });
});
