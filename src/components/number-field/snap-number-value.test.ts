import { describe, expect, it } from 'vitest';
import { snapNumberValue } from './snap-number-value.js';

describe('snapNumberValue', () => {
  it.each([
    { value: 0.05, bounds: { minValue: 0.05, maxValue: 1, step: 0.1 }, expected: 0.05 },
    { value: 0.099, bounds: { minValue: 0, maxValue: 0.099, step: 0.1 }, expected: 0 },
    { value: 1, bounds: { minValue: 0.05, maxValue: 1, step: 0.1 }, expected: 0.95 },
    { value: 0, bounds: { maxValue: 0.3, step: 0.1 }, expected: 0 },
    { value: 2.5e-7, bounds: { minValue: 5e-8, step: 1e-7 }, expected: 2.5e-7 },
    { value: 12, bounds: { minValue: 0, maxValue: 10 }, expected: 10 },
    { value: -2, bounds: { minValue: 0, maxValue: 10 }, expected: 0 },
    { value: 3.3, bounds: { step: 0.5 }, expected: 3.5 },
    { value: -3.25, bounds: { step: 0.5 }, expected: -3.5 },
    { value: 0.3, bounds: { minValue: 0.15, step: 0.1 }, expected: 0.35 },
    { value: 10, bounds: { minValue: 1, maxValue: 10, step: 2 }, expected: 9 },
    { value: 0.3, bounds: { maxValue: 0.3, step: 0.1 }, expected: 0.3 },
    { value: -5, bounds: { maxValue: -5, step: 2 }, expected: -6 },
    { value: 1.6e-7, bounds: { step: 1e-7 }, expected: 2e-7 },
    { value: 1e-101, bounds: { step: 1e-101 }, expected: 1e-101 },
    { value: Number.MAX_VALUE, bounds: { step: 1e-100 }, expected: Number.MAX_VALUE },
    { value: 4503599627370496, bounds: { step: 1 }, expected: 4503599627370496 },
    { value: -4503599627370496, bounds: { step: 1 }, expected: -4503599627370496 },
    {
      value: Number.MAX_SAFE_INTEGER,
      bounds: { step: 1 },
      expected: Number.MAX_SAFE_INTEGER,
    },
    {
      value: Number.MIN_SAFE_INTEGER,
      bounds: { step: 1, minValue: Number.MIN_SAFE_INTEGER },
      expected: Number.MIN_SAFE_INTEGER,
    },
    { value: 9e15, bounds: { step: 1, minValue: 3 }, expected: 9e15 },
    { value: 4.5e15, bounds: { step: 2, maxValue: 4.5e15 + 1 }, expected: 4.5e15 },
    { value: 0.30000000000000004, bounds: { step: 0.1 }, expected: 0.3 },
    { value: 0.15, bounds: { step: 0.1 }, expected: 0.2 },
    { value: -0.15, bounds: { step: 0.1 }, expected: -0.2 },
    { value: -0.3, bounds: { step: 0.2 }, expected: -0.4 },
    {
      value: 4503599627370495.5,
      bounds: { minValue: 0, maxValue: 4503599627370495.5, step: 2 },
      expected: 4503599627370494,
    },
    {
      value: 2251799813685248.5,
      bounds: { step: 2 },
      expected: 2251799813685248,
    },
    {
      value: -2251799813685248.5,
      bounds: { step: 2 },
      expected: -2251799813685248,
    },
    {
      value: 2251799813685249,
      bounds: { step: 2 },
      expected: 2251799813685250,
    },
    {
      value: -2251799813685249,
      bounds: { step: 2 },
      expected: -2251799813685250,
    },
  ])('UIC-NUMBER-FIELD-2.2 snaps $value to $expected', ({ value, bounds, expected }) => {
    expect(snapNumberValue(value, bounds)).toBe(expected);
  });

  it('UIC-NUMBER-FIELD-2.2 leaves a value on the grid as it is, however large', () => {
    for (const value of [2 ** 52, -(2 ** 52), 2 ** 53 - 1, 1e15 + 1]) {
      const once = snapNumberValue(value, { step: 1 });
      expect(once).toBe(value);
      expect(snapNumberValue(once, { step: 1 })).toBe(once);
    }
  });
});
