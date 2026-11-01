import { describe, expect, it } from 'vitest';
import {
  fitColumns,
  normalizeDashboardLayout,
  placeDashboardItem,
  reflowDashboardLayout,
  type DashboardGridItem,
} from './dashboard-layout.js';

const at = (layout: readonly DashboardGridItem[]) =>
  layout.map(({ id, x, y, w, h }) => [id, x, y, w, h]);

describe('dashboard layouts', () => {
  it('UIC-DASHBOARD-GRID-1.2 fits tiles to whole cells inside the columns and settles overlaps', () => {
    const layout = normalizeDashboardLayout(
      [
        { id: 'a', x: 0, y: 0, w: 2, h: 2 },
        { id: 'b', x: 1, y: 1, w: 2, h: 1 },
        { id: 'c', x: 3.4, y: -1, w: 9, h: 0 },
        { id: 'a', x: 3, y: 3, w: 1, h: 1 },
      ],
      4,
    );
    expect(at(layout)).toEqual([
      ['a', 0, 0, 2, 2],
      ['b', 1, 3, 2, 1],
      ['c', 0, 2, 4, 1],
    ]);
    expect(at(normalizeDashboardLayout([{ id: 'd', x: Number.NaN, y: 1, w: 2, h: 2 }], 0))).toEqual(
      [['d', 0, 1, 1, 2]],
    );
  });

  it('UIC-DASHBOARD-GRID-2.4 pushes the tiles a placed tile overlaps down, in turn', () => {
    const layout = [
      { id: 'a', x: 0, y: 0, w: 2, h: 1 },
      { id: 'b', x: 2, y: 0, w: 2, h: 1 },
      { id: 'c', x: 0, y: 1, w: 4, h: 1 },
      { id: 'd', x: 0, y: 5, w: 1, h: 1 },
    ];
    expect(at(placeDashboardItem(layout, { id: 'a', x: 2, y: 0, w: 2, h: 1 }, 4))).toEqual([
      ['a', 2, 0, 2, 1],
      ['b', 2, 1, 2, 1],
      ['c', 0, 2, 4, 1],
      ['d', 0, 5, 1, 1],
    ]);
    expect(at(placeDashboardItem(layout, { id: 'b', x: 3, y: 0, w: 9, h: 1 }, 4))[1]).toEqual([
      'b',
      0,
      0,
      4,
      1,
    ]);
  });

  it('UIC-DASHBOARD-GRID-3.1 scales tiles onto fewer columns and settles them in reading order', () => {
    const layout = [
      { id: 'a', x: 0, y: 0, w: 6, h: 2 },
      { id: 'b', x: 6, y: 0, w: 6, h: 2 },
    ];
    expect(at(reflowDashboardLayout(layout, { from: 12, to: 6 }))).toEqual([
      ['a', 0, 0, 3, 2],
      ['b', 3, 0, 3, 2],
    ]);
    expect(at(reflowDashboardLayout(layout, { from: 12, to: 1 }))).toEqual([
      ['a', 0, 0, 1, 2],
      ['b', 0, 2, 1, 2],
    ]);
  });

  it('UIC-DASHBOARD-GRID-3.1 counts the gaps between the columns that fit', () => {
    // Six 100 pixel columns and five 12 pixel gaps need 660 pixels.
    expect(fitColumns(600, 100, 12)).toBe(5);
    expect(fitColumns(660, 100, 12)).toBe(6);
    expect(fitColumns(659.5, 100, 12)).toBe(5);
    // A measurement a hair short of a whole fit, as fractional layout gives, still fits.
    expect(fitColumns(659.9999999, 100, 12)).toBe(6);
    expect(fitColumns(600, 100, 0)).toBe(6);
    expect(fitColumns(599, 100, 0)).toBe(5);
    expect(fitColumns(40, 100, 12)).toBe(1);
  });
});
