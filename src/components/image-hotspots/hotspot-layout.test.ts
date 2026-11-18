import { describe, expect, it } from 'vitest';
import { clampHotspotRect, fitImage } from './hotspot-layout.js';

describe('fitImage', () => {
  it('UIC-IMAGE-HOTSPOTS-1.2 fits the whole image inside the viewport at 100% and scales the fit', () => {
    const viewport = { width: 300, height: 300 };
    expect(fitImage({ width: 600, height: 200, viewport, zoom: 100 })).toEqual({
      width: 300,
      height: 100,
    });
    expect(fitImage({ width: 100, height: 400, viewport, zoom: 200 })).toEqual({
      width: 150,
      height: 600,
    });
    // A small image grows to the fit, so its hotspots stay large enough to press.
    expect(fitImage({ width: 30, height: 10, viewport, zoom: 100 })).toEqual({
      width: 300,
      height: 100,
    });
  });

  it('UIC-IMAGE-HOTSPOTS-1.2 takes the intrinsic size before the viewport is measured', () => {
    expect(fitImage({ width: 400, height: 200, viewport: null, zoom: 50 })).toEqual({
      width: 200,
      height: 100,
    });
    expect(
      fitImage({ width: 400, height: 200, viewport: { width: 0, height: 0 }, zoom: 100 }),
    ).toEqual({ width: 400, height: 200 });
  });
});

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
