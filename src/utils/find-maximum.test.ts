import { describe, expect, it } from 'vitest';
import { findMaximum } from './find-maximum.js';

describe('findMaximum', () => {
  it('UIC-PDF-VIEWER-3.2 UIC-STATE-MACHINE-VIEW-2.1 projects large inputs without argument limits', () => {
    const values = Array.from({ length: 200_000 }, (_, value) => ({ value: value - 100_000 }));
    let reads = 0;
    expect(
      findMaximum(values, ({ value }) => {
        reads++;
        return value;
      }),
    ).toBe(99_999);
    expect(reads).toBe(values.length);
  });

  it('UIC-TABLE-14.3 UIC-PDF-VIEWER-3.2 retains empty defaults and non-finite values', () => {
    const read = (value: number) => value;
    expect(findMaximum([], read)).toBe(-Infinity);
    expect(findMaximum([], read, 1)).toBe(1);
    expect(findMaximum([-4, -2], read)).toBe(-2);
    expect(findMaximum([-4, -2], read, 0)).toBe(0);
    expect(findMaximum([1, Infinity, 3], read)).toBe(Infinity);
    expect(findMaximum([Infinity, Number.NaN], read)).toBeNaN();
    expect(findMaximum([-0], read)).toBe(-0);
    expect(findMaximum([-0, 0], read)).toBe(0);
    expect(findMaximum(new Set([1, 4, 2]), read)).toBe(4);
  });
});
