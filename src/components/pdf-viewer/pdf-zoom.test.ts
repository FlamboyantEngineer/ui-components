import { describe, expect, it } from 'vitest';
import { findNextZoomLevel } from '../zoom-control/zoom-control.js';
import { findLargestPage, pdfZoomLevels, resolveZoomPercent, toCssScale } from './pdf-zoom.js';

const a5 = { width: 420, height: 595 };

describe('PDF zoom', () => {
  it('UIC-PDF-VIEWER-3.1 steps along a 25% grid from 25% to 1000%, also from a fitted zoom', () => {
    expect(pdfZoomLevels[0]).toBe(25);
    expect(pdfZoomLevels.at(-1)).toBe(1000);
    expect(pdfZoomLevels).toHaveLength(40);
    expect(findNextZoomLevel(pdfZoomLevels, 137.4, 1)).toBe(150);
    expect(findNextZoomLevel(pdfZoomLevels, 137.4, -1)).toBe(125);
    expect(findNextZoomLevel(pdfZoomLevels, 125, 1)).toBe(150);
    expect(findNextZoomLevel(pdfZoomLevels, 1000, 1)).toBeUndefined();
    expect(resolveZoomPercent({ zoom: 5000, page: a5, available: null })).toBe(1000);
    expect(resolveZoomPercent({ zoom: 10, page: a5, available: null })).toBe(25);
  });

  it('UIC-PDF-VIEWER-3.2 fits the width within 50–200% and the whole page into the column', () => {
    const pageWidth = 420 * (96 / 72);
    const fitWidth = (width: number) =>
      resolveZoomPercent({ zoom: 'page-width', page: a5, available: { width, height: 400 } });
    expect(fitWidth(pageWidth)).toBeCloseTo(100);
    expect(fitWidth(pageWidth * 1.5)).toBeCloseTo(150);
    expect(fitWidth(100)).toBe(50);
    expect(fitWidth(pageWidth * 4)).toBe(200);

    const fitPage = resolveZoomPercent({
      zoom: 'page-fit',
      page: a5,
      available: { width: pageWidth * 2, height: 595 * (96 / 72) },
    });
    expect(fitPage).toBeCloseTo(100);
    expect(resolveZoomPercent({ zoom: 'page-fit', page: null, available: null })).toBe(100);
    expect(findLargestPage([a5, { width: 595, height: 420 }])).toEqual({ width: 595, height: 595 });
    expect(findLargestPage([])).toBeNull();
    expect(toCssScale(150)).toBeCloseTo(2);
  });
  it('UIC-PDF-VIEWER-3.2 fits metadata for a large document without argument limits', () => {
    const sizes = Array.from({ length: 200_000 }, (_, index) => ({
      width: index,
      height: 200_000 - index,
    }));
    expect(findLargestPage(sizes)).toEqual({ width: 199_999, height: 200_000 });
  });
});
