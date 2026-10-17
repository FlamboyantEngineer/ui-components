import { describe, expect, it } from 'vitest';
import { getColorIndex } from './color-index.js';

describe('getColorIndex', () => {
  it('UIC-COLOR-INDEX-1.1 returns the same slot for the same key and count', () => {
    expect(getColorIndex('apple', 8)).toBe(2);
    expect(getColorIndex('banana', 8)).toBe(3);
    expect(getColorIndex('apple', 50)).toBe(10);
    expect(getColorIndex('Maria Santos', 8)).toBe(getColorIndex('Maria Santos', 8));
  });

  it('UIC-COLOR-INDEX-1.1 stays in range for many keys and ignores surrounding whitespace', () => {
    for (const count of [1, 3, 8, 50]) {
      for (const key of ['', 'a', 'apple', 'Ines Duarte', 'x'.repeat(500), '\u{1F34E}']) {
        const index = getColorIndex(key, count);
        expect(Number.isInteger(index)).toBe(true);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(count);
      }
    }
    expect(getColorIndex('  apple \n', 8)).toBe(getColorIndex('apple', 8));
  });

  it('UIC-COLOR-INDEX-1.2 yields slot 0 for counts below one or not finite', () => {
    expect(getColorIndex('apple', 0)).toBe(0);
    expect(getColorIndex('apple', -4)).toBe(0);
    expect(getColorIndex('apple', Number.NaN)).toBe(0);
    expect(getColorIndex('apple', Number.POSITIVE_INFINITY)).toBe(0);
    expect(getColorIndex('apple', 8.9)).toBe(getColorIndex('apple', 8));
  });
});
