import { describe, expect, it } from 'vitest';
import { normalizeSliderValue, snapToStep } from './slider-values.js';

describe('slider values', () => {
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
