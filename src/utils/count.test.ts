import { describe, expect, it } from 'vitest';
import { formatCount, normalizeCount } from './count.js';

describe('normalizeCount', () => {
  it('UIC-COUNT-1.1 floors finite counts at zero and rejects values that are not finite', () => {
    expect(normalizeCount(0)).toBe(0);
    expect(normalizeCount(12)).toBe(12);
    expect(normalizeCount(1.9)).toBe(1);
    expect(normalizeCount(-3)).toBe(0);
    expect(normalizeCount(Number.NaN)).toBeUndefined();
    expect(normalizeCount(Number.POSITIVE_INFINITY)).toBeUndefined();
    expect(normalizeCount(undefined)).toBeUndefined();
    expect(normalizeCount(null)).toBeUndefined();
  });
});

describe('formatCount', () => {
  it('UIC-COUNT-1.2 shows exact counts and caps larger counts as max+', () => {
    const cases: Array<[number, number | undefined, string]> = [
      [0, undefined, '0'],
      [1, 9, '1'],
      [9, 9, '9'],
      [10, 9, '9+'],
      [120, undefined, '120'],
      [100, 99, '99+'],
      [12.9, 9.8, '9+'],
      [-3, undefined, '0'],
      [Number.NaN, 9, ''],
      [Number.POSITIVE_INFINITY, 9, ''],
      [10, Number.NaN, '10'],
      [10, -1, '10'],
      [1, 0, '0+'],
    ];
    for (const [count, max, expected] of cases) {
      expect(formatCount(count, { max })).toBe(expected);
    }
  });

  it('UIC-COUNT-1.3 marks a partial count with + unless a cap applies', () => {
    expect(formatCount(12, { more: true })).toBe('12+');
    expect(formatCount(120, { max: 99, more: true })).toBe('99+');
    expect(formatCount(5, { max: 9, more: true })).toBe('5+');
    expect(formatCount(12, { more: false })).toBe('12');
    expect(formatCount(Number.NaN, { more: true })).toBe('');
  });
});
