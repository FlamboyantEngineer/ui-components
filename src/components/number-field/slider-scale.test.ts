import { describe, expect, it } from 'vitest';
import { logarithmicScale, resolveSliderScale, toTrackPercent } from './slider-scale.js';

const bounds = { minValue: 1, maxValue: 1000 };

describe('slider scales', () => {
  it('UIC-NUMBER-FIELD-5.8 puts equal ratios at equal distances on a logarithmic scale', () => {
    const scale = resolveSliderScale('logarithmic', bounds);
    expect(scale).toBe(logarithmicScale);
    const positions = [1, 10, 100, 1000].map((value) => toTrackPercent(value, scale, bounds));
    expect(positions.map((position) => position.toFixed(6))).toEqual([
      '0.000000',
      '0.333333',
      '0.666667',
      '1.000000',
    ]);
    expect(logarithmicScale.toValue(0.5, bounds)).toBeCloseTo(Math.sqrt(1000));
    expect(logarithmicScale.toValue(logarithmicScale.toPosition(42, bounds), bounds)).toBeCloseTo(
      42,
    );
  });

  it('UIC-NUMBER-FIELD-5.8 keeps the linear default and clamps positions into the track', () => {
    expect(resolveSliderScale(undefined, bounds)).toBeNull();
    expect(resolveSliderScale('linear', bounds)).toBeNull();
    expect(toTrackPercent(25, null, { minValue: 0, maxValue: 100 })).toBe(0.25);
    expect(toTrackPercent(-5, logarithmicScale, bounds)).toBe(0);
    expect(toTrackPercent(5000, logarithmicScale, bounds)).toBe(1);
    const custom = { toPosition: () => 2, toValue: () => 0 };
    expect(resolveSliderScale(custom, bounds)).toBe(custom);
    expect(toTrackPercent(10, custom, bounds)).toBe(1);
  });

  it('UIC-NUMBER-FIELD-5.8 refuses a logarithmic scale over bounds that are not above zero', () => {
    expect(() => resolveSliderScale('logarithmic', { minValue: 0, maxValue: 100 })).toThrow(
      RangeError,
    );
    expect(() => resolveSliderScale('logarithmic', { minValue: -10, maxValue: -1 })).toThrow(
      RangeError,
    );
  });
});
