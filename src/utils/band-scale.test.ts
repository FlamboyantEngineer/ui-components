import { describe, expect, it } from 'vitest';
import { createBandScale } from './band-scale.js';

describe('createBandScale', () => {
  it('UIC-SCALES-3.1 splits the range into one padded band per category', () => {
    const scale = createBandScale({
      domain: ['Apples', 'Pears', 'Plums', 'Figs'],
      range: [0, 200],
    });
    expect(scale.step).toBe(50);
    expect(scale.bandwidth).toBe(40);
    expect(scale.map('Apples')).toBe(5);
    expect(scale.map('Figs')).toBe(155);
    expect(scale.domain).toEqual(['Apples', 'Pears', 'Plums', 'Figs']);
    expect(scale.range).toEqual([0, 200]);
  });

  it('UIC-SCALES-3.1 takes a padding and lays reversed ranges out backwards', () => {
    const tight = createBandScale({ domain: ['a', 'b'], range: [0, 100], padding: 0 });
    expect([tight.map('a'), tight.map('b'), tight.bandwidth]).toEqual([0, 50, 50]);
    const reversed = createBandScale({ domain: ['a', 'b'], range: [100, 0], padding: 0.5 });
    expect([reversed.map('a'), reversed.map('b'), reversed.bandwidth]).toEqual([62.5, 12.5, 25]);
    const clamped = createBandScale({ domain: ['a'], range: [0, 10], padding: 3 });
    expect(clamped.bandwidth).toBe(0);
  });

  it('UIC-SCALES-3.2 ticks the middle of each band with its category', () => {
    const scale = createBandScale({ domain: ['Mon', 'Tue'], range: [0, 100] });
    expect(scale.ticks()).toEqual([
      { value: 'Mon', position: 25, label: 'Mon' },
      { value: 'Tue', position: 75, label: 'Tue' },
    ]);
  });

  it('UIC-SCALES-3.3 keeps unknown, repeated and empty input truthful', () => {
    const scale = createBandScale({ domain: ['a', 'b', 'a'], range: [0, Number.NaN] });
    expect(scale.domain).toEqual(['a', 'b']);
    expect(scale.range).toEqual([0, 0]);
    expect(scale.map('z')).toBeNaN();
    const empty = createBandScale({ domain: [], range: [0, 100] });
    expect([empty.step, empty.bandwidth, empty.ticks()]).toEqual([0, 0, []]);
  });
});
