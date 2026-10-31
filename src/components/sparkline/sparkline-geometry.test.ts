import { describe, expect, it } from 'vitest';
import { resolveSparklineGeometry } from './sparkline-geometry.js';

const box = { width: 46, height: 26 };

describe('resolveSparklineGeometry', () => {
  it('UIC-SPARKLINE-1.2 spaces values evenly and places higher values higher, inside the inset', () => {
    const geometry = resolveSparklineGeometry({ ...box, values: [0, 10, 5] });
    expect(geometry.line).toBe('M3,23L23,3L43,13');
    expect(geometry.area).toBe('M3,23L23,3L43,13L43,23L3,23Z');
  });

  it('UIC-SPARKLINE-1.2 takes the caller range and keeps values beyond it at the edges', () => {
    const geometry = resolveSparklineGeometry({
      ...box,
      values: [-5, 50, 150],
      minValue: 0,
      maxValue: 100,
    });
    expect(geometry.line).toBe('M3,23L23,13L43,3');
    expect(geometry.points.max?.value).toBe(150);
  });

  it('UIC-SPARKLINE-1.2 centres equal values and a single value', () => {
    expect(resolveSparklineGeometry({ ...box, values: [4, 4] }).line).toBe('M3,13L43,13');
    const single = resolveSparklineGeometry({ ...box, values: [7] });
    expect(single.line).toBe('');
    expect(single.dots).toEqual([{ index: 0, value: 7, x: 23, y: 13 }]);
  });

  it('UIC-SPARKLINE-1.2 fills equal values to the edge nearest zero, or to zero itself', () => {
    expect(resolveSparklineGeometry({ ...box, values: [5, 5, 5] }).area).toBe(
      'M3,13L23,13L43,13L43,23L3,23Z',
    );
    expect(resolveSparklineGeometry({ ...box, values: [-5, -5] }).area).toBe(
      'M3,13L43,13L43,3L3,3Z',
    );
    expect(resolveSparklineGeometry({ ...box, values: [0, 0] }).area).toBe(
      'M3,13L43,13L43,13L3,13Z',
    );
    const pinned = { ...box, values: [5, 5], minValue: 5, maxValue: 5 };
    expect(resolveSparklineGeometry(pinned).area).toBe('M3,13L43,13L43,23L3,23Z');
    const reversed = { ...box, values: [15, 25], minValue: 30, maxValue: 10 };
    expect(resolveSparklineGeometry(reversed).area).toBe('M3,8L43,18L43,3L3,3Z');
  });

  it('UIC-SPARKLINE-1.2 fills the area toward zero, to the edge nearest zero outside the range', () => {
    const crossing = resolveSparklineGeometry({ ...box, values: [-10, 10] });
    expect(crossing.area).toBe('M3,23L43,3L43,13L3,13Z');
    const negative = resolveSparklineGeometry({ ...box, values: [-10, -20] });
    expect(negative.area).toBe('M3,3L43,23L43,3L3,3Z');
    const positive = resolveSparklineGeometry({ ...box, values: [10, 20] });
    expect(positive.area).toBe('M3,23L43,3L43,23L3,23Z');
  });

  it('UIC-SPARKLINE-1.2 rounds coordinates to two decimals', () => {
    const geometry = resolveSparklineGeometry({ width: 10, height: 10, values: [0, 1, 3] });
    expect(geometry.line).toBe('M3,7L5,5.67L7,3');
  });

  it('UIC-SPARKLINE-1.3 breaks the line and area at values that are not finite', () => {
    const geometry = resolveSparklineGeometry({
      ...box,
      values: [0, 10, Number.NaN, 10, Infinity],
    });
    expect(geometry.line).toBe('M3,23L13,3');
    expect(geometry.area).toBe('M3,23L13,3L13,23L3,23Z');
    expect(geometry.dots).toEqual([{ index: 3, value: 10, x: 33, y: 3 }]);
    expect(resolveSparklineGeometry({ ...box, values: [Number.NaN] })).toEqual({
      line: '',
      area: '',
      dots: [],
      points: {},
    });
    expect(resolveSparklineGeometry({ ...box, values: [] }).points).toEqual({});
  });

  it('UIC-SPARKLINE-1.3 draws each finite value between gaps as a dot, joining none', () => {
    const geometry = resolveSparklineGeometry({
      ...box,
      values: [1, Number.NaN, 2, -Infinity, 3],
    });
    expect(geometry.line).toBe('');
    expect(geometry.area).toBe('');
    expect(geometry.dots.map(({ x, y }) => [x, y])).toEqual([
      [3, 23],
      [23, 13],
      [43, 3],
    ]);
    expect(geometry.points.last?.value).toBe(3);
  });

  it('UIC-SPARKLINE-1.4 finds the first lowest, the first highest and the last finite values', () => {
    const { points } = resolveSparklineGeometry({ ...box, values: [3, 1, 9, 1, 9, 4, Number.NaN] });
    expect(points.min).toMatchObject({ index: 1, value: 1 });
    expect(points.max).toMatchObject({ index: 2, value: 9 });
    expect(points.last).toMatchObject({ index: 5, value: 4 });
  });
});
