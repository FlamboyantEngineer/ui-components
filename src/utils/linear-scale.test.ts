import { describe, expect, it } from 'vitest';
import { createLinearScale } from './linear-scale.js';

const values = (scale: ReturnType<typeof createLinearScale>) =>
  scale.ticks().map((tick) => tick.value);

describe('createLinearScale', () => {
  it('UIC-SCALES-1.1 UIC-SCALES-1.2 maps finite domains and ranges whose span overflows', () => {
    const scale = createLinearScale({ domain: [-1e308, 1e308], range: [0, 100] });
    expect([scale.map(-1e308), scale.map(0), scale.map(1e308)]).toEqual([0, 50, 100]);
    expect([scale.invert(0), scale.invert(50), scale.invert(100)]).toEqual([-1e308, 0, 1e308]);
    const flat = createLinearScale({ domain: [1, 1], range: [1e308, 1.2e308] });
    expect(flat.map(1)).toBe(1.1e308);
    const small = createLinearScale({
      domain: [1, 1],
      range: [Number.MIN_VALUE, Number.MIN_VALUE],
    });
    expect(small.map(1)).toBe(Number.MIN_VALUE);
    const extrapolated = createLinearScale({ domain: [-1e308, 0], range: [0, 100] });
    expect(extrapolated.map(1e308)).toBe(200);
  });

  it('UIC-SCALES-1.3 bounds an excessive tick request and handles an overflowing step', () => {
    const many = createLinearScale({
      domain: [0, 1],
      range: [0, 100],
      tickCount: Number.MAX_VALUE,
    });
    expect(many.ticks().length).toBeLessThanOrEqual(2001);
    const wide = createLinearScale({
      domain: [0, Number.MAX_VALUE],
      range: [0, 100],
      tickCount: 1,
    });
    expect(wide.ticks()).toEqual([{ value: 0, position: 0, label: '0' }]);
  });

  it('UIC-SCALES-1.4 keeps nice domain endpoints finite when rounding would overflow', () => {
    const domain = [-Number.MAX_VALUE, Number.MAX_VALUE] as const;
    const scale = createLinearScale({ domain, range: [0, 100], nice: true });
    expect(scale.domain).toEqual(domain);
    expect(scale.map(domain[0])).toBe(0);
    expect(scale.map(domain[1])).toBe(100);
    expect(scale.ticks().length).toBeGreaterThan(0);
  });

  it.each([
    [1, 1 + Number.EPSILON],
    [1e-110, 2e-110],
    [1e-300, 2e-300],
    [0, Number.MIN_VALUE],
    [-1e308, 1e308],
  ])('UIC-SCALES-1.3 UIC-SCALES-1.5 makes finite, distinct ticks for [%s, %s]', (low, high) => {
    const scale = createLinearScale({ domain: [low, high], range: [0, 100], locale: 'en-US' });
    const ticks = scale.ticks();
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks.length).toBeLessThanOrEqual(11);
    expect(new Set(ticks.map((tick) => tick.value)).size).toBe(ticks.length);
    for (const tick of ticks) {
      expect(tick.value).toBeGreaterThanOrEqual(low);
      expect(tick.value).toBeLessThanOrEqual(high);
      expect(Number.isFinite(tick.position)).toBe(true);
    }
    if (low === 1e-110) expect(ticks[0]?.label).toBe('1E-110');
  });

  it('UIC-SCALES-1.1 maps values to positions in proportion, both ways', () => {
    const scale = createLinearScale({ domain: [0, 50], range: [0, 200] });
    expect(scale.map(0)).toBe(0);
    expect(scale.map(25)).toBe(100);
    expect(scale.map(75)).toBe(300);
    expect(scale.invert(100)).toBe(25);
    const flipped = createLinearScale({ domain: [0, 10], range: [40, 0] });
    expect(flipped.map(10)).toBe(0);
    expect(flipped.map(2.5)).toBe(30);
    expect(flipped.invert(30)).toBe(2.5);
    expect(scale.domain).toEqual([0, 50]);
    expect(scale.range).toEqual([0, 200]);
  });

  it('UIC-SCALES-1.1 clamps points beyond the domain or range when asked', () => {
    const scale = createLinearScale({ domain: [0, 10], range: [0, 100], clamp: true });
    expect(scale.map(-5)).toBe(0);
    expect(scale.map(20)).toBe(100);
    expect(scale.invert(150)).toBe(10);
    expect(scale.invert(-1)).toBe(0);
  });

  it('UIC-SCALES-1.2 keeps degenerate input truthful', () => {
    const flat = createLinearScale({ domain: [4, 4], range: [0, 10] });
    expect(flat.map(4)).toBe(5);
    expect(flat.map(100)).toBe(5);
    expect(flat.ticks()).toEqual([{ value: 4, position: 5, label: '4' }]);
    const broken = createLinearScale({ domain: [Number.NaN, 10], range: [0, Infinity] });
    expect(broken.domain).toEqual([0, 10]);
    expect(broken.range).toEqual([0, 0]);
    const scale = createLinearScale({ domain: [0, 10], range: [0, 100] });
    expect(scale.map(Number.NaN)).toBeNaN();
    expect(scale.map(Infinity)).toBeNaN();
    expect(scale.invert(Number.NaN)).toBeNaN();
  });

  it('UIC-SCALES-1.3 makes ticks at round steps of 1, 2 or 5 times a power of ten', () => {
    expect(values(createLinearScale({ domain: [0, 100], range: [0, 1] }))).toEqual([
      0, 20, 40, 60, 80, 100,
    ]);
    expect(values(createLinearScale({ domain: [3, 97], range: [0, 1] }))).toEqual([20, 40, 60, 80]);
    expect(values(createLinearScale({ domain: [0, 1], range: [0, 1], tickCount: 10 }))).toEqual([
      0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1,
    ]);
    expect(values(createLinearScale({ domain: [-12, 31], range: [0, 1], tickCount: 4 }))).toEqual([
      -10, 0, 10, 20, 30,
    ]);
    expect(values(createLinearScale({ domain: [100, 0], range: [0, 1] }))).toEqual([
      0, 20, 40, 60, 80, 100,
    ]);
    const ticks = createLinearScale({ domain: [0, 10], range: [100, 0], tickCount: 2 }).ticks();
    expect(ticks.map(({ value, position }) => [value, position])).toEqual([
      [0, 100],
      [5, 50],
      [10, 0],
    ]);
  });

  it('UIC-SCALES-1.4 extends the domain to whole steps when nice', () => {
    expect(createLinearScale({ domain: [3, 97], range: [0, 1], nice: true }).domain).toEqual([
      0, 100,
    ]);
    expect(createLinearScale({ domain: [0.13, 0.86], range: [0, 1], nice: true }).domain).toEqual([
      0, 1,
    ]);
    expect(createLinearScale({ domain: [97, 3], range: [0, 1], nice: true }).domain).toEqual([
      100, 0,
    ]);
    expect(createLinearScale({ domain: [5, 5], range: [0, 1], nice: true }).domain).toEqual([5, 5]);
  });

  it('UIC-SCALES-1.5 labels values with the decimals of the step for the locale', () => {
    const scale = createLinearScale({ domain: [0, 1], range: [0, 1], locale: 'en-US' });
    expect(scale.ticks().map((tick) => tick.label)).toEqual([
      '0.0',
      '0.2',
      '0.4',
      '0.6',
      '0.8',
      '1.0',
    ]);
    expect(scale.format(0.25)).toBe('0.3');
    const german = createLinearScale({ domain: [0, 1], range: [0, 1], locale: 'de-DE' });
    expect(german.format(0.5)).toBe('0,5');
    const large = createLinearScale({ domain: [0, 20000], range: [0, 1], locale: 'en-US' });
    expect(large.format(12000)).toBe('12,000');
  });

  it('UIC-SCALES-1.5 takes caller format options instead', () => {
    const scale = createLinearScale({
      domain: [0, 1],
      range: [0, 1],
      locale: 'en-US',
      formatOptions: { style: 'percent' },
    });
    expect(scale.ticks().map((tick) => tick.label)).toEqual([
      '0%',
      '20%',
      '40%',
      '60%',
      '80%',
      '100%',
    ]);
  });
});
