import { describe, expect, it } from 'vitest';
import {
  type CalendarHeatmapDay,
  type HeatmapGeometryInput,
  resolveHeatmapGeometry,
  resolveHeatmapScale,
  toLevel,
} from './heatmap-geometry.js';

const layout = (
  days: readonly CalendarHeatmapDay[],
  extra: Partial<HeatmapGeometryInput> = {},
): HeatmapGeometryInput => ({
  days,
  locale: 'en-US',
  levels: 4,
  cellSize: 10,
  width: 2000,
  margin: { left: 20, top: 10 },
  isRtl: false,
  ...extra,
});

describe('resolveHeatmapGeometry', () => {
  it('UIC-CHART-11.1 tells values, missing values and absent days apart, zero included', () => {
    const geometry = resolveHeatmapGeometry(
      layout([
        { date: '2026-03-04', value: 0 },
        { date: '2026-03-02', value: 8 },
        { date: '2026-03-03', value: null },
        { date: '2026-03-06', value: Number.NaN },
        { date: '2026-03-02', value: 99 },
        { date: 'not a day', value: 5 },
      ]),
    );
    expect(geometry?.cells.map((cell) => [cell.key, cell.state, cell.level])).toEqual([
      ['2026-03-02', 'value', 4],
      ['2026-03-03', 'missing', undefined],
      ['2026-03-04', 'value', 0],
      ['2026-03-05', 'absent', undefined],
      ['2026-03-06', 'missing', undefined],
    ]);
  });

  it('UIC-CHART-11.1 places leap days and year ends in their week and weekday', () => {
    const geometry = resolveHeatmapGeometry(
      layout([], { start: '2027-12-30', end: '2028-03-01', firstDayOfWeek: 'mon' }),
    );
    const find = (key: string) => geometry?.cells.find((cell) => cell.key === key);
    // 2027-12-30 is a Thursday; 2028-01-03 a Monday; 2028-02-29 a Tuesday.
    expect(find('2027-12-30')).toMatchObject({ series: 3, index: 0 });
    expect(find('2028-01-03')).toMatchObject({ series: 0, index: 1 });
    expect(find('2028-02-29')).toMatchObject({ series: 1, index: 9 });
    expect(geometry?.cells).toHaveLength(63);
    const sunday = resolveHeatmapGeometry(layout([], { start: '2028-01-02', end: '2028-01-02' }));
    expect(sunday?.cells[0]).toMatchObject({ series: 0, index: 0 });
  });

  it('UIC-CHART-11.1 shrinks squares to fit, down to a floor, and mirrors columns right to left', () => {
    const days = [{ date: '2026-01-01', value: 1 }];
    const wide = resolveHeatmapGeometry(layout(days, { end: '2026-12-31' }));
    expect(wide?.cell).toBe(10);
    const narrow = resolveHeatmapGeometry(layout(days, { end: '2026-12-31', width: 300 }));
    expect(narrow?.cell).toBe(8);
    expect(narrow?.width).toBeGreaterThan(300);
    const rtl = resolveHeatmapGeometry(layout(days, { end: '2026-01-15', isRtl: true }));
    const first = rtl?.cells[0];
    const last = rtl?.cells.at(-1);
    expect(first?.x).toBeGreaterThan(last?.x ?? Infinity);
    expect(first?.index).toBeGreaterThan(last?.index ?? Infinity);
  });

  it('UIC-CHART-11.1 draws nothing for an empty or reversed range', () => {
    expect(resolveHeatmapGeometry(layout([]))).toBeNull();
    expect(
      resolveHeatmapGeometry(layout([], { start: '2026-03-05', end: '2026-03-01' })),
    ).toBeNull();
  });
});

describe('heatmap levels', () => {
  it('UIC-CHART-11.2 bounds the scale and marks outliers at the nearest level', () => {
    const scale = resolveHeatmapScale([0, 2, 40], { minValue: 0, maxValue: 20, levels: 4 });
    expect(scale).toEqual({ low: 0, high: 20, levels: 4, step: 5 });
    expect(toLevel(0, scale)).toEqual({ level: 0, outlier: undefined });
    expect(toLevel(5, scale)).toEqual({ level: 1, outlier: undefined });
    expect(toLevel(5.1, scale)).toEqual({ level: 2, outlier: undefined });
    expect(toLevel(40, scale)).toEqual({ level: 4, outlier: 'high' });
    expect(toLevel(-1, scale)).toEqual({ level: 0, outlier: 'low' });
    const flat = resolveHeatmapScale([3, 3], { levels: 4 });
    expect(toLevel(3, flat).level).toBe(4);
  });
});
