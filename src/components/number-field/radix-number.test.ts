import { describe, expect, it } from 'vitest';
import { formatRadixNumber, parseRadixNumber } from './radix-number.js';

describe('radix numbers', () => {
  it('UIC-NUMBER-FIELD-4.1 formats and parses signed integers with matching optional prefixes', () => {
    for (const radix of [2, 8, 16] as const) {
      for (const value of [0, 42, -42, Number.MAX_SAFE_INTEGER]) {
        const text = formatRadixNumber(value, radix);
        expect(parseRadixNumber(text, radix)).toBe(value);
        expect(parseRadixNumber(text.toUpperCase(), radix)).toBe(value);
      }
      expect(parseRadixNumber('10', radix)).toBe(radix);
      expect(formatRadixNumber(null, radix)).toBe('');
      expect(parseRadixNumber('  ', radix)).toBeNull();
      expect(parseRadixNumber('1.5', radix)).toBeNaN();
      expect(parseRadixNumber('Infinity', radix)).toBeNaN();
    }
    expect(parseRadixNumber('0x10', 2)).toBeNaN();
    expect(parseRadixNumber('0b2', 2)).toBeNaN();
    expect(parseRadixNumber('0o8', 8)).toBeNaN();
    expect(parseRadixNumber('0x20000000000000', 16)).toBeNaN();
  });
});
