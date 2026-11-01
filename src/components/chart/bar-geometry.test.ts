import { describe, expect, it } from 'vitest';
import { toValueIdentity } from './chart-identity.js';
import { resolveBarGeometry, type BarGeometryInput } from './bar-geometry.js';

const margin = { top: 10, right: 10, bottom: 10, left: 10 };
const box = (bar: { x: number; y: number; width: number; height: number }) => [
  bar.x,
  bar.y,
  bar.width,
  bar.height,
];

describe('resolveBarGeometry', () => {
  it('UIC-CHART-5.1 UIC-CHART-5.2 splits each band between grouped series from zero', () => {
    const input: BarGeometryInput = {
      categories: ['A', 'B'],
      series: [
        { series: 0, id: 0, values: [10, 20] },
        { series: 1, id: 1, values: [5, -5] },
      ],
      layout: 'grouped',
      orientation: 'vertical',
      width: 220,
      height: 120,
      margin,
      locale: 'en-US',
    };
    const geometry = resolveBarGeometry(input);
    expect(geometry.plot).toEqual({ top: 10, right: 210, bottom: 110, left: 10 });
    expect(geometry.values.domain).toEqual([-10, 20]);
    expect(geometry.values.ticks().map((tick) => tick.label)).toEqual(['-10', '0', '10', '20']);
    expect(geometry.bars.map((bar) => [bar.key, ...box(bar)])).toEqual([
      [toValueIdentity(0, '["A",0]'), 22, 43.33, 36, 33.33],
      [toValueIdentity(1, '["A",0]'), 62, 60, 36, 16.67],
      [toValueIdentity(0, '["B",0]'), 122, 10, 36, 66.67],
      [toValueIdentity(1, '["B",0]'), 162, 76.67, 36, 16.67],
    ]);
  });

  it('UIC-CHART-5.1 UIC-CHART-5.2 stacks positive values up and negative values down, horizontally', () => {
    const geometry = resolveBarGeometry({
      categories: ['A'],
      series: [
        { series: 0, id: 0, values: [10] },
        { series: 1, id: 1, values: [5] },
        { series: 3, id: 3, values: [-4] },
      ],
      layout: 'stacked',
      orientation: 'horizontal',
      width: 220,
      height: 60,
      margin,
      locale: 'en-US',
    });
    expect(geometry.values.ticks().map((tick) => tick.value)).toEqual([-5, 0, 5, 10, 15]);
    expect(geometry.bars.map((bar) => [bar.series, ...box(bar)])).toEqual([
      [0, 60, 14, 100, 32],
      [1, 160, 14, 50, 32],
      [3, 20, 14, 40, 32],
    ]);
  });

  it('UIC-CHART-5.1 draws no bar for values that are not finite and keeps zero in an empty domain', () => {
    const geometry = resolveBarGeometry({
      categories: ['A', 'B'],
      series: [{ series: 0, id: 0, values: [Number.NaN, Infinity] }],
      layout: 'grouped',
      orientation: 'vertical',
      width: 100,
      height: 100,
      margin,
      locale: 'en-US',
      formatOptions: { style: 'percent' },
    });
    expect(geometry.bars).toEqual([]);
    expect(geometry.values.domain).toEqual([0, 1]);
    expect(geometry.values.ticks().at(-1)?.label).toBe('100%');
  });

  const large = (
    series: Array<{ id: number; values: number[] }>,
    options: Partial<BarGeometryInput> = {},
  ) =>
    resolveBarGeometry({
      categories: ['A', 'B'],
      series: series.map(({ id, values }) => ({ series: id, id, values })),
      layout: 'stacked',
      orientation: 'vertical',
      width: 220,
      height: 120,
      margin,
      locale: 'en-US',
      ...options,
    });
  const isFiniteBox = (bar: { x: number; y: number; width: number; height: number }) =>
    box(bar).every(Number.isFinite);

  it('UIC-CHART-5.1 stacks values whose total passes the largest number in proportion', () => {
    const geometry = large([
      { id: 0, values: [1e308, 1e308] },
      { id: 1, values: [1e308, Number.NaN] },
    ]);
    expect(geometry.bars.every(isFiniteBox)).toBe(true);
    const [first, second, alone] = geometry.bars;
    expect(first?.height).toBeGreaterThan(0);
    expect(second?.height).toBe(first?.height);
    expect(second?.y).toBeCloseTo((first?.y ?? 0) - (first?.height ?? 0), 1);
    expect(alone?.height).toBe(first?.height);
    expect(geometry.values.ticks().every((tick) => tick.label !== '')).toBe(true);
    expect(geometry.values.map(0)).toBe(110);
  });

  it('UIC-CHART-5.1 stacks huge positive and negative values from zero, horizontally', () => {
    const geometry = large(
      [
        { id: 0, values: [1.5e308, 1] },
        { id: 1, values: [1.5e308, 2] },
        { id: 2, values: [-1.5e308, -1e-300] },
      ],
      { orientation: 'horizontal' },
    );
    expect(geometry.bars.every(isFiniteBox)).toBe(true);
    const [up, upper, down] = geometry.bars;
    const zero = geometry.values.map(0);
    expect(up?.x).toBeCloseTo(zero, 1);
    expect(upper?.x).toBeCloseTo((up?.x ?? 0) + (up?.width ?? 0), 1);
    expect(down?.x).toBeCloseTo(zero - (down?.width ?? 0), 1);
    expect(down?.width).toBeCloseTo(up?.width ?? 0, 1);
    // Tiny values beside huge ones draw no length but stay finite.
    expect(geometry.bars.slice(3).every((bar) => bar.width === 0)).toBe(true);
  });

  it('UIC-CHART-5.1 keeps grouped huge values and ordinary stacks exact', () => {
    const grouped = large(
      [
        { id: 0, values: [1.7e308, 1] },
        { id: 1, values: [-1.7e308, 2] },
      ],
      { layout: 'grouped' },
    );
    expect(grouped.bars.every(isFiniteBox)).toBe(true);
    expect(grouped.bars[0]?.height).toBeCloseTo(grouped.bars[1]?.height ?? 0, 1);
    const ordinary = large([
      { id: 0, values: [10, 5] },
      { id: 1, values: [5, 5] },
    ]);
    expect(ordinary.values.domain).toEqual([0, 15]);
    expect(ordinary.bars.map((bar) => bar.height)).toEqual([66.67, 33.33, 33.33, 33.33]);
  });
});
