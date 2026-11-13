import { describe, expect, it } from 'vitest';
import { capCanvasPixels } from './page-bitmap.js';

describe('capCanvasPixels', () => {
  it('UIC-PDF-VIEWER-2.1 draws at the device pixel ratio, capped at 2^25 device pixels', () => {
    expect(capCanvasPixels(560, 793.4, 2)).toEqual({ width: 1120, height: 1586 });
    const huge = capCanvasPixels(8000, 11000, 2);
    expect(huge.width * huge.height).toBeLessThanOrEqual(2 ** 25);
    expect(huge.width / huge.height).toBeCloseTo(8000 / 11000, 2);
    expect(capCanvasPixels(0, 100, 2)).toEqual({ width: 0, height: 0 });
    expect(capCanvasPixels(100, 100)).toEqual({ width: 100, height: 100 });
  });
});
