import { describe, expect, it } from 'vitest';
import { normalizeSliderValue, snapToStep } from './slider-values.js';

describe('slider values', () => {
  it.each([
    { minValue: 0.05, maxValue: 1, step: 0.1, given: 0.05, expected: 0.05 },
    { minValue: 0, maxValue: 0.099, step: 0.1, given: 0.099, expected: 0 },
    { minValue: 0.05, maxValue: 1, step: 0.1, given: 1, expected: 0.95 },
    { minValue: -0.05, maxValue: 1, step: 0.1, given: 0.15, expected: 0.15 },
    { minValue: -0.05, maxValue: 1, step: 0.1, given: -0.05, expected: -0.05 },
    { minValue: 0.25, maxValue: 3, step: 1, given: 1.25, expected: 1.25 },
    { minValue: 5e-8, maxValue: 1e-6, step: 1e-7, given: 2.5e-7, expected: 2.5e-7 },
    { minValue: 0, maxValue: 0.3, step: 0.1, given: 0.3, expected: 0.3 },
    {
      minValue: 0,
      maxValue: 4503599627370495.5,
      step: 2,
      given: 4503599627370495.5,
      expected: 4503599627370494,
    },
    {
      minValue: 0,
      maxValue: 4503599627370496,
      step: 2,
      given: 2251799813685248.5,
      expected: 2251799813685248,
    },
    {
      minValue: 0,
      maxValue: 4503599627370496,
      step: 2,
      given: 2251799813685249,
      expected: 2251799813685250,
    },
    {
      minValue: 0,
      maxValue: 4503599627370496,
      step: 2,
      given: 562949953421312.75,
      expected: 562949953421312,
    },
    { minValue: 0.05, maxValue: 1, step: 0.1, given: Number.NaN, expected: 0.05 },
    { minValue: 0.05, maxValue: 1, step: 0.1, given: Infinity, expected: 0.95 },
    { minValue: 0.05, maxValue: 1, step: 0.1, given: -Infinity, expected: 0.05 },
  ])(
    'UIC-NUMBER-FIELD-5.2 preserves origins and bounds for $given on $minValue/$step',
    ({ given, expected, ...grid }) => {
      const once = snapToStep(given, grid);
      expect(once).toBe(expected);
      expect(once).toBeGreaterThanOrEqual(grid.minValue);
      expect(once).toBeLessThanOrEqual(grid.maxValue);
      expect(snapToStep(once, grid)).toBe(once);
    },
  );

  it('UIC-NUMBER-FIELD-5.2 preserves large step counts at both range endpoints', () => {
    const grid = { minValue: 0, maxValue: 4503599627370495.5, step: 2 };
    const once = normalizeSliderValue([4503599627370495.5, 2251799813685248.5], grid);
    expect(once).toEqual([2251799813685248, 4503599627370494]);
    expect(normalizeSliderValue(once, grid)).toEqual(once);
  });

  it.each([
    { given: [0.05, 0.85], expected: [0.05, 0.85] },
    { given: [1, 0.05], expected: [0.05, 0.95] },
    { given: [0.85, 0.15], expected: [0.15, 0.85] },
    { given: [Number.NaN, Infinity], expected: [0.05, 0.95] },
  ])(
    'UIC-NUMBER-FIELD-5.2 normalizes both fractional endpoints idempotently: $given',
    ({ given, expected }) => {
      const grid = { minValue: 0.05, maxValue: 1, step: 0.1 };
      const once = normalizeSliderValue(given as [number, number], grid);
      expect(once).toEqual(expected);
      expect(normalizeSliderValue(once, grid)).toEqual(once);
    },
  );

  it('UIC-NUMBER-FIELD-5.2 snaps onto the step grid from the minimum, within the bounds', () => {
    const grid = { minValue: 0, maxValue: 100, step: 10 };
    expect(snapToStep(33, grid)).toBe(30);
    expect(snapToStep(35, grid)).toBe(40);
    expect(snapToStep(200, grid)).toBe(100);
    expect(snapToStep(-5, grid)).toBe(0);
    expect(snapToStep(10, { minValue: 0, maxValue: 10, step: 4 })).toBe(8);
    expect(snapToStep(7, { minValue: 1, maxValue: 10, step: 3 })).toBe(7);
    expect(snapToStep(0.1 + 0.2, { minValue: 0, maxValue: 1, step: 0.1 })).toBe(0.3);
    expect(snapToStep(0.19999999999999998, { minValue: 0, maxValue: 1, step: 0.1 })).toBe(0.2);
    expect(snapToStep(2e-7, { minValue: 0, maxValue: 1, step: 1e-7 })).toBe(2e-7);
  });

  it('UIC-NUMBER-FIELD-5.2 maps NaN to the minimum and an infinity to its end', () => {
    const grid = { minValue: 10, maxValue: 50, step: 7 };
    expect(snapToStep(Number.NaN, grid)).toBe(10);
    expect(snapToStep(Infinity, grid)).toBe(45);
    expect(snapToStep(-Infinity, grid)).toBe(10);
    expect(normalizeSliderValue([Number.NaN, 30], grid)).toEqual([10, 31]);
    expect(normalizeSliderValue([24, Infinity], grid)).toEqual([24, 45]);
  });

  it('UIC-NUMBER-FIELD-5.2 puts a range in order', () => {
    const grid = { minValue: 0, maxValue: 100, step: 1 };
    expect(normalizeSliderValue([80, 20], grid)).toEqual([20, 80]);
    expect(normalizeSliderValue(42.4, grid)).toBe(42);
  });
});
