import { describe, expect, it } from 'vitest';
import * as core from '../core/index.js';
import { getColorIndex, placeColorIndexes } from './color-index.js';

function unsignedHash(key: string): number {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  return hash;
}

describe('getColorIndex', () => {
  it('UIC-COLOR-INDEX-1.1 returns the same slot for the same key and count', () => {
    expect(getColorIndex('apple', 8)).toBe(2);
    expect(getColorIndex('banana', 8)).toBe(5);
    // The unsigned hash an editor computes for a person's id gives the same slot.
    expect(getColorIndex('user-42', 8)).toBe(unsignedHash('user-42') % 8);
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

describe('placeColorIndexes', () => {
  it('UIC-COLOR-INDEX-1.3 gives each key its own slot, or the next free one when an earlier key has it', () => {
    const keys = ['b', 'j', 'r'];
    // All three hash to the same slot of 8.
    expect(keys.map((key) => getColorIndex(key, 8))).toEqual([2, 2, 2]);

    const placed = placeColorIndexes(['r', 'b', 'j', 'b'], 8);

    expect([...placed]).toEqual([
      ['b', 2],
      ['j', 3],
      ['r', 4],
    ]);
    expect(placeColorIndexes(['j', 'r', 'b'], 8)).toEqual(placed);
  });

  it('UIC-COLOR-INDEX-1.3 keeps a key on its own slot once every slot is taken', () => {
    const placed = placeColorIndexes(['b', 'j', 'r'], 2);

    expect([...placed.values()]).toEqual([0, 1, getColorIndex('r', 2)]);
    expect([...placeColorIndexes(['b'], 0)]).toEqual([['b', 0]]);
  });
});

describe('color index entry', () => {
  it('UIC-COLOR-INDEX-1.4 is exported from the core entry', () => {
    expect(core.getColorIndex).toBe(getColorIndex);
    expect(core.placeColorIndexes).toBe(placeColorIndexes);
  });
});
