import { describe, expect, it } from 'vitest';
import { requireDefined } from './require-defined.js';
import {
  SCROLL_OVERVIEW_MIN_MARKER,
  buildScrollOverviewImage,
  resolveLayeredScrollOverviewSegments,
  resolveScrollOverviewSegments,
} from './scroll-overview.js';

describe('scroll overview', () => {
  it('UIC-SCROLL-REGION-3.2 maps markers over the whole content with a two-pixel minimum', () => {
    expect(
      resolveScrollOverviewSegments(
        [
          { top: 0, height: 1, color: 'red', priority: 0 },
          { top: 5000, height: 10, color: 'green', priority: 1 },
          { top: 9999, height: 1, color: 'purple', priority: 3 },
        ],
        1000,
        10000,
      ),
    ).toEqual([
      { top: 0, height: 2, color: 'red' },
      { top: 500, height: 2, color: 'green' },
      { top: 998, height: 2, color: 'purple' },
    ]);
    expect(SCROLL_OVERVIEW_MIN_MARKER).toBe(2);
  });

  it('UIC-SCROLL-REGION-3.2 resolves shared pixels by priority whatever the marker order', () => {
    const markers = [
      { top: 500, height: 10, color: 'blue', priority: 2 },
      { top: 500, height: 10, color: 'red', priority: 0 },
    ];
    const expected = [{ top: 50, height: 2, color: 'red' }];
    expect(resolveScrollOverviewSegments(markers, 100, 1000)).toEqual(expected);
    expect(resolveScrollOverviewSegments([...markers].reverse(), 100, 1000)).toEqual(expected);
  });

  it('UIC-SCROLL-REGION-3.2 skips invalid markers and paints nothing for content that fits', () => {
    expect(
      resolveScrollOverviewSegments([{ top: 0, height: 1, color: 'red', priority: 0 }], 100, 100),
    ).toEqual([]);
    expect(
      resolveScrollOverviewSegments(
        [
          { top: Number.NaN, height: 1, color: 'red', priority: 0 },
          { top: 10, height: 0, color: 'red', priority: 0 },
        ],
        100,
        1000,
      ),
    ).toEqual([]);
    expect(buildScrollOverviewImage([], 100)).toBe('none');
  });

  it('UIC-SCROLL-REGION-3.2 paints segments in the caller colours over a transparent ground', () => {
    expect(buildScrollOverviewImage([{ top: 50, height: 2, color: 'red' }], 100)).toBe(
      'linear-gradient(to bottom, transparent 0%, transparent 50%, red 50% 52%, transparent 52%, transparent 100%)',
    );
  });

  it('UIC-SCROLL-REGION-3.3 resolves priority inside each layer, then mixes layers equally in name order', () => {
    const layers = [
      { name: 'unread', markers: [{ top: 990, height: 1, color: 'yellow', priority: 0 }] },
      {
        name: 'changes',
        markers: [
          { top: 990, height: 1, color: 'green', priority: 2 },
          { top: 990, height: 1, color: 'blue', priority: 0 },
        ],
      },
    ];
    const expected = [{ top: 98, height: 2, color: 'color-mix(in srgb, blue 50%, yellow)' }];
    expect(resolveLayeredScrollOverviewSegments(layers, 100, 1000)).toEqual(expected);
    expect(resolveLayeredScrollOverviewSegments([...layers].reverse(), 100, 1000)).toEqual(
      expected,
    );
    expect(resolveLayeredScrollOverviewSegments([requireDefined(layers[1])], 100, 1000)).toEqual(
      resolveScrollOverviewSegments(requireDefined(layers[1]).markers, 100, 1000),
    );
  });

  it('UIC-SCROLL-REGION-3.3 gives three coincident layers a third each, even with repeated colours', () => {
    const layers = ['a', 'b', 'c'].map((name, index) => ({
      name,
      markers: [
        { top: 0, height: 1, color: requireDefined(['red', 'red', 'blue'][index]), priority: 0 },
      ],
    }));
    expect(resolveLayeredScrollOverviewSegments(layers, 100, 1000)[0]?.color).toBe(
      'color-mix(in srgb, color-mix(in srgb, red 50%, red) 66.66666666666666%, blue)',
    );
  });
});
