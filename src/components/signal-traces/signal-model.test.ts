import { describe, expect, it } from 'vitest';
import {
  buildEnvelopePath,
  buildTracePath,
  findNearestSample,
  fitRange,
  getMinimumSpan,
  normalizeDomain,
  panRange,
  readChannelExtent,
  sliceVisible,
  zoomRange,
} from './signal-model.js';

const identity = { x: (time: number) => time, y: (value: number) => value };
const samples = [0, 1, 2, 3, 4].map((time) => ({ time, value: time * 10 }));

describe('signal model', () => {
  it('UIC-SIGNAL-TRACES-2.1 fits a range inside the window, in order and no narrower than its minimum span', () => {
    const domain = [0, 100] as const;
    expect(fitRange([80, 20], domain)).toEqual([20, 80]);
    expect(fitRange([-50, 400], domain)).toEqual([0, 100]);
    expect(fitRange([90, 120], domain)).toEqual([70, 100]);
    expect(fitRange([5, 5], domain)).toEqual([5, 5 + getMinimumSpan(domain)]);
    expect(fitRange([Number.NaN, 40], domain)).toEqual([0, 40]);
    expect(normalizeDomain([10, 2])).toEqual([2, 10]);
    expect(normalizeDomain([3, 3])).toEqual([2.5, 3.5]);
    expect(normalizeDomain([0, Infinity])).toEqual([0, 1]);
  });

  it('UIC-SIGNAL-TRACES-2.1 keeps a sub-microsecond window far above floating-point resolution', () => {
    const domain = [1000, 1000 + 4e-7] as const;
    const narrowest = zoomRange(domain, domain, { factor: 1e-12, anchor: 1000 + 2e-7 });
    const span = narrowest[1] - narrowest[0];
    expect(span).toBeGreaterThanOrEqual(1000 * Number.EPSILON * 64 * 0.999);
    expect(narrowest[0]).toBeGreaterThanOrEqual(domain[0]);
    expect(narrowest[1]).toBeLessThanOrEqual(domain[1]);
    const tiny = [0, 4e-7] as const;
    const zoomed = zoomRange(tiny, tiny, { factor: 0.5, anchor: 1e-7 });
    expect(zoomed[0]).toBeCloseTo(0.5e-7, 20);
    expect(zoomed[1]).toBeCloseTo(2.5e-7, 20);
  });

  it('UIC-SIGNAL-TRACES-2.2 zooms around the anchor and pans to the window ends', () => {
    const domain = [0, 100] as const;
    expect(zoomRange([0, 100], domain, { factor: 0.5, anchor: 50 })).toEqual([25, 75]);
    expect(zoomRange([0, 100], domain, { factor: 0.5, anchor: 0 })).toEqual([0, 50]);
    expect(zoomRange([20, 40], domain, { factor: 100, anchor: 30 })).toEqual([0, 100]);
    expect(panRange([20, 40], domain, 10)).toEqual([30, 50]);
    expect(panRange([20, 40], domain, 500)).toEqual([80, 100]);
    expect(panRange([20, 40], domain, -500)).toEqual([0, 20]);
  });

  it('UIC-SIGNAL-TRACES-3.2 finds the nearest sample, the earlier one on a tie', () => {
    expect(findNearestSample(samples, 2.4)?.time).toBe(2);
    expect(findNearestSample(samples, 2.6)?.time).toBe(3);
    expect(findNearestSample(samples, 2.5)?.time).toBe(2);
    expect(findNearestSample(samples, -9)?.time).toBe(0);
    expect(findNearestSample(samples, 99)?.time).toBe(4);
    expect(findNearestSample([], 1)).toBeUndefined();
  });

  it('UIC-SIGNAL-TRACES-1.4 draws the visible samples and one beyond each end, broken at gaps', () => {
    expect(sliceVisible(samples, [1.5, 2.5]).map((sample) => sample.time)).toEqual([1, 2, 3]);
    expect(sliceVisible(samples, [-1, 10])).toBe(samples);
    const gapped = [
      { time: 0, value: 1 },
      { time: 1, value: null },
      { time: 2, value: 3 },
      { time: 3, value: Number.NaN },
      { time: 4, value: 5 },
      { time: 5, value: 6 },
    ];
    expect(buildTracePath(gapped, identity)).toBe('M0 1 M2 3 M4 5 L5 6');
    const envelope = [
      { time: 0, lower: 0, upper: 2 },
      { time: 1, lower: 1, upper: 3 },
      { time: 2, lower: Number.NaN, upper: 3 },
      { time: 3, lower: 1, upper: 2 },
    ];
    expect(buildEnvelopePath(envelope, identity)).toBe('M0 2 L1 3 L1 1 L0 0 Z');
  });

  it('UIC-SIGNAL-TRACES-1.2 reads a channel extent from its samples, reference and envelope', () => {
    expect(
      readChannelExtent({
        id: 'a',
        label: 'A',
        samples: [{ time: 0, value: 2 }],
        reference: [{ time: 0, value: -1 }],
        envelope: [{ time: 0, lower: 0, upper: 5 }],
      }),
    ).toEqual([-1, 5]);
    expect(readChannelExtent({ id: 'b', label: 'B', samples: [{ time: 0, value: 20 }] })).toEqual([
      18, 22,
    ]);
    expect(readChannelExtent({ id: 'c', label: 'C', samples: [{ time: 0, value: 0 }] })).toEqual([
      -1, 1,
    ]);
  });

  it('UIC-SIGNAL-TRACES-1.5 has no extent for a channel without samples', () => {
    expect(readChannelExtent({ id: 'd', label: 'D', samples: [] })).toBeNull();
  });
});
