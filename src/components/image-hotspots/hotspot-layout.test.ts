import { describe, expect, it } from 'vitest';
import { clampHotspotRect } from './hotspot-layout.js';

describe('clampHotspotRect', () => {
  it('UIC-IMAGE-HOTSPOTS-1.3 keeps a rectangle on the image', () => {
    expect(clampHotspotRect({ x: 10, y: 20, width: 30, height: 40 })).toEqual({
      x: 10,
      y: 20,
      width: 30,
      height: 40,
    });
    expect(clampHotspotRect({ x: -5, y: 90, width: 120, height: 25 })).toEqual({
      x: 0,
      y: 90,
      width: 100,
      height: 10,
    });
    expect(clampHotspotRect({ x: Number.NaN, y: 150, width: Infinity, height: -3 })).toEqual({
      x: 0,
      y: 100,
      width: 0,
      height: 0,
    });
  });
});
