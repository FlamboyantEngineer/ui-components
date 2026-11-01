import { describe, expect, it } from 'vitest';
import { toValueIdentity } from './chart-identity.js';
import {
  createLineValueScale,
  resolveLineGeometry,
  type LineGeometryInput,
} from './line-geometry.js';

const base = {
  width: 120,
  height: 120,
  margin: { top: 10, right: 10, bottom: 10, left: 10 },
  timeZone: 'UTC',
  locale: 'en-US',
} satisfies Partial<LineGeometryInput>;

describe('resolveLineGeometry', () => {
  it('UIC-CHART-6.3 spans a large series without a function-argument limit', () => {
    const input = {
      ...base,
      series: [
        {
          series: 0,
          id: 0,
          points: Array.from({ length: 200_000 }, (_, x) => ({ x, y: x - 100_000 })),
        },
      ],
    };
    const scale = createLineValueScale(input, { top: 10, bottom: 110, left: 10, right: 110 });
    expect(scale.domain).toEqual([-100_000, 100_000]);
  });

  it('UIC-CHART-6.1 UIC-CHART-6.2 draws numeric x values in order, with an area toward zero', () => {
    const geometry = resolveLineGeometry({
      ...base,
      series: [
        {
          series: 0,
          id: 0,
          points: [
            { x: 2, y: 10 },
            { x: 0, y: 0 },
            { x: 4, y: 5 },
            { x: 'late', y: 7 },
          ],
        },
      ],
    });
    const [line] = geometry.lines;
    expect(line?.line).toBe('M10,110L60,10L110,60');
    expect(line?.area).toBe('M10,110L60,10L110,60L110,110L10,110Z');
    expect(line?.points.map((point) => [point.key, point.at, point.value])).toEqual([
      [toValueIdentity(0, '[0,0]'), 0, 0],
      [toValueIdentity(0, '[2,0]'), 2, 10],
      [toValueIdentity(0, '[4,0]'), 4, 5],
    ]);
    expect(geometry.xAxis.ticks.map((tick) => tick.label)).toEqual(['0', '2', '4']);
    expect(geometry.xAxis.format(1500)).toBe('1,500');
    expect(geometry.yTicks.map((tick) => tick.value)).toEqual([0, 5, 10]);
  });

  it('UIC-CHART-6.2 breaks the line at values that are not finite numbers', () => {
    const geometry = resolveLineGeometry({
      ...base,
      series: [
        {
          series: 1,
          id: 1,
          points: [
            { x: 0, y: 1 },
            { x: 1, y: Number.NaN },
            { x: 2, y: 3 },
          ],
        },
      ],
    });
    const [line] = geometry.lines;
    expect(line?.line.match(/M/g)).toHaveLength(2);
    expect(line?.points.map((point) => point.key)).toEqual([
      toValueIdentity(1, '[0,0]'),
      toValueIdentity(1, '[2,0]'),
    ]);
  });

  it.each([
    ['an unreadable date', ['2026-01-01', '2026-01-02', 'not-a-date']],
    ['a number on a date axis', ['2026-01-01', '2026-01-02', 7]],
    ['a text value on a number axis', [1, 2, '2026-01-03']],
    ['a number that is not finite', [1, 2, Number.NaN]],
  ] as const)('UIC-CHART-6.3 leaves %s out of the value axis', (_, xs) => {
    const geometry = resolveLineGeometry({
      ...base,
      series: [
        {
          series: 0,
          id: 0,
          points: [
            { x: xs[0], y: 1 },
            { x: xs[1], y: 2 },
            { x: xs[2], y: 1e9 },
          ],
        },
      ],
    });
    expect(geometry.yTicks.at(-1)?.value).toBe(2);
    expect(geometry.lines[0]?.points.map((point) => point.y)).toEqual([60, 10]);
  });

  it('UIC-CHART-6.2 UIC-CHART-6.3 keeps a missing value at a readable x as a break', () => {
    const geometry = resolveLineGeometry({
      ...base,
      series: [
        {
          series: 0,
          id: 0,
          points: [
            { x: 0, y: 4 },
            { x: 1, y: Number.NaN },
            { x: 2, y: 2 },
            { x: 'late', y: 100 },
          ],
        },
      ],
    });
    expect(geometry.yTicks.at(-1)?.value).toBe(4);
    expect(geometry.lines[0]?.line.match(/M/g)).toHaveLength(2);
  });

  it('UIC-CHART-6.3 keeps a fixed range and an all-unreadable series apart from this', () => {
    const fixed = createLineValueScale(
      {
        ...base,
        maxValue: 50,
        series: [
          {
            series: 0,
            id: 0,
            points: [
              { x: 0, y: 1 },
              { x: 'late', y: 1e9 },
            ],
          },
        ],
      },
      { top: 10, right: 110, bottom: 110, left: 10 },
    );
    expect(fixed.domain).toEqual([0, 50]);
    const unreadable = resolveLineGeometry({
      ...base,
      series: [{ series: 0, id: 0, points: [{ x: 'late', y: 1e9 }] }],
    });
    expect(unreadable.lines[0]?.points).toEqual([]);
    expect(unreadable.yTicks.at(-1)?.value).toBeLessThanOrEqual(1);
  });

  it('UIC-CHART-6.3 keeps values beyond a fixed range at its edges', () => {
    const geometry = resolveLineGeometry({
      ...base,
      minValue: 0,
      maxValue: 5,
      series: [
        {
          series: 0,
          id: 0,
          points: [
            { x: 0, y: 2.5 },
            { x: 1, y: 10 },
          ],
        },
      ],
    });
    expect(geometry.lines[0]?.points.map((point) => point.y)).toEqual([60, 10]);
    expect(geometry.yTicks.map((tick) => tick.value)).toEqual([0, 2, 4]);
  });

  it('UIC-CHART-6.1 UIC-SCALES-2.4 reads dates on a time axis in its time zone', () => {
    const geometry = resolveLineGeometry({
      ...base,
      width: 420,
      series: [
        {
          series: 0,
          id: 0,
          points: [
            { x: '2026-03-31', y: 2 },
            { x: '2026-03-01', y: 1 },
          ],
        },
      ],
    });
    expect(geometry.lines[0]?.points.map((point) => [point.at, point.x])).toEqual([
      ['2026-03-01', 10],
      ['2026-03-31', 410],
    ]);
    expect(geometry.xAxis.ticks.map((tick) => tick.label)).toEqual([
      'Mar 1',
      'Mar 8',
      'Mar 15',
      'Mar 22',
      'Mar 29',
    ]);
    expect(geometry.xAxis.format('2026-03-01')).toBe('Mar 1, 2026');
    expect(geometry.xAxis.format('2026-03-01T12:30:00Z')).toMatch(/^Mar 1, 2026, 12:30\sPM$/);
    expect(geometry.xAxis.format('not a date')).toBe('');
    expect(geometry.xAxis.read(3)).toBeNaN();
  });
  it('UIC-CHART-6.1 UIC-CHART-6.2 reads each source coordinate a bounded number of times before ordering', () => {
    const count = 1000;
    let reads = 0;
    const points = Array.from({ length: count }, (_, index) => ({
      get x() {
        reads++;
        return (index * 37) % count;
      },
      y: index,
    }));
    const geometry = resolveLineGeometry({ ...base, series: [{ series: 0, id: 0, points }] });
    expect(geometry.lines[0]?.points.map(({ at }) => at)).toEqual(
      Array.from({ length: count }, (_, x) => x),
    );
    expect(reads).toBeLessThanOrEqual(count * 4);
  });
});
