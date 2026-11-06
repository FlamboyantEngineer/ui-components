import { describe, expect, it } from 'vitest';
import { resolveScatterGeometry, type ScatterGeometryInput } from './scatter-geometry.js';

const input = (
  series: ScatterGeometryInput['series'],
  extra: Partial<ScatterGeometryInput> = {},
) => ({
  series,
  width: 400,
  height: 200,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  locale: 'en-US',
  ...extra,
});

describe('resolveScatterGeometry', () => {
  it('UIC-CHART-10.1 keys observations by series and id, apart from where they sit', () => {
    const { marks } = resolveScatterGeometry(
      input([
        {
          series: 0,
          id: 'a',
          points: [
            { id: 1, x: 2, y: 2 },
            { id: 2, x: 2, y: 2 },
            { id: 1, x: 9, y: 9 },
          ],
        },
        { series: 1, id: 'b', points: [{ id: 1, x: 2, y: 2 }] },
      ]),
    );
    const keys = marks.map((mark) => mark.key);
    expect(new Set(keys).size).toBe(3);
    expect(marks.filter((mark) => mark.series === 0).map((mark) => mark.point.id)).toEqual([1, 2]);
  });

  it('UIC-CHART-10.1 leaves out values that are not finite and orders by x then y', () => {
    const { marks, xScale } = resolveScatterGeometry(
      input([
        {
          series: 0,
          id: 'a',
          points: [
            { id: 'c', x: 3, y: 1 },
            { id: 'n', x: null, y: 4 },
            { id: 'i', x: 100, y: Number.NaN },
            { id: 'b', x: 1, y: 5 },
            { id: 'a', x: 1, y: 2 },
          ],
        },
      ]),
    );
    expect(marks.map((mark) => mark.point.id)).toEqual(['a', 'b', 'c']);
    expect(marks.map((mark) => mark.index)).toEqual([0, 1, 2]);
    expect(xScale.ticks().at(-1)?.value).toBeLessThan(100);
    for (const mark of marks) {
      expect(Number.isFinite(mark.x) && Number.isFinite(mark.y)).toBe(true);
    }
  });

  it('UIC-CHART-10.1 widens one value and pins values beyond fixed bounds to the edge', () => {
    const one = resolveScatterGeometry(
      input([{ series: 0, id: 'a', points: [{ id: 1, x: 0, y: 50 }] }]),
    );
    expect(one.marks[0]?.x).toBeGreaterThan(0);
    expect(one.marks[0]?.x).toBeLessThan(400);
    const fixed = resolveScatterGeometry(
      input([{ series: 0, id: 'a', points: [{ id: 1, x: 20, y: -5 }] }], {
        minX: 0,
        maxX: 10,
        minY: 0,
        maxY: 10,
      }),
    );
    expect(fixed.marks[0]).toMatchObject({ x: 400, y: 200, at: 20, value: -5 });
  });
});
