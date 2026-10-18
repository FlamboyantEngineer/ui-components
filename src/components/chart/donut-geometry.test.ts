import { describe, expect, it } from 'vitest';
import { resolveDonutGeometry } from './donut-geometry.js';

describe('resolveDonutGeometry', () => {
  it('UIC-CHART-7.1 lays slices clockwise from the top, each its share of the total', () => {
    const geometry = resolveDonutGeometry({
      values: [
        { series: 0, value: 1 },
        { series: 1, value: Number.NaN },
        { series: 2, value: 1 },
        { series: 3, value: -3 },
      ],
      diameter: 100,
    });
    expect(geometry.total).toBe(2);
    expect(geometry.slices.map((slice) => [slice.key, slice.index, slice.share])).toEqual([
      ['0', 0, 0.5],
      ['2', 1, 0.5],
    ]);
    expect(geometry.slices.map((slice) => slice.path)).toEqual([
      'M50,0A50,50 0 0 1 50,100L50,80A30,30 0 0 0 50,20Z',
      'M50,100A50,50 0 0 1 50,0L50,20A30,30 0 0 0 50,80Z',
    ]);
  });

  it('UIC-CHART-7.1 takes the large arc past half a turn and draws a whole ring in two halves', () => {
    const [large] = resolveDonutGeometry({
      values: [
        { series: 0, value: 3 },
        { series: 1, value: 1 },
      ],
      diameter: 100,
    }).slices;
    expect(large?.path).toBe('M50,0A50,50 0 1 1 0,50L20,50A30,30 0 1 0 50,20Z');
    const [whole] = resolveDonutGeometry({
      values: [{ series: 0, value: 5 }],
      diameter: 100,
    }).slices;
    expect(whole?.path).toBe(
      'M50,0A50,50 0 0 1 50,100L50,80A30,30 0 0 0 50,20ZM50,100A50,50 0 0 1 50,0L50,20A30,30 0 0 0 50,80Z',
    );
  });
});
