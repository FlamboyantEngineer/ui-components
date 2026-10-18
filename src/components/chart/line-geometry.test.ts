import { describe, expect, it } from 'vitest';
import { resolveLineGeometry, type LineGeometryInput } from './line-geometry.js';

const base = {
  width: 120,
  height: 120,
  margin: { top: 10, right: 10, bottom: 10, left: 10 },
  timeZone: 'UTC',
  locale: 'en-US',
} satisfies Partial<LineGeometryInput>;

describe('resolveLineGeometry', () => {
  it('UIC-CHART-6.1 UIC-CHART-6.2 draws numeric x values in order, with an area toward zero', () => {
    const geometry = resolveLineGeometry({
      ...base,
      series: [
        {
          series: 0,
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
      ['0:0', 0, 0],
      ['0:1', 2, 10],
      ['0:2', 4, 5],
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
    expect(line?.points.map((point) => point.key)).toEqual(['1:0', '1:1']);
  });

  it('UIC-CHART-6.3 keeps values beyond a fixed range at its edges', () => {
    const geometry = resolveLineGeometry({
      ...base,
      minValue: 0,
      maxValue: 5,
      series: [
        {
          series: 0,
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

  it('UIC-CHART-6.1 reads dates on a time axis in its time zone', () => {
    const geometry = resolveLineGeometry({
      ...base,
      width: 420,
      series: [
        {
          series: 0,
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
    expect(geometry.xAxis.ticks.map((tick) => tick.label)).toEqual(['Mar 2026']);
    expect(geometry.xAxis.format('2026-03-01')).toBe('Mar 1, 2026');
    expect(geometry.xAxis.format('2026-03-01T12:30:00Z')).toMatch(/^Mar 1, 2026, 12:30\sPM$/);
    expect(geometry.xAxis.format('not a date')).toBe('');
    expect(geometry.xAxis.read(3)).toBeNaN();
  });
});
