import { afterEach, describe, expect, it, vi } from 'vitest';
import { measureCanvasPixels } from './use-page-render.js';

describe('measureCanvasPixels', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('UIC-PDF-VIEWER-2.1 draws at the device pixel ratio, capped at 2^25 device pixels', () => {
    vi.stubGlobal('devicePixelRatio', 2);
    expect(measureCanvasPixels(560, 793.4)).toEqual({ width: 1120, height: 1586 });
    const huge = measureCanvasPixels(8000, 11000);
    expect(huge.width * huge.height).toBeLessThanOrEqual(2 ** 25);
    expect(huge.width / huge.height).toBeCloseTo(8000 / 11000, 2);
    expect(measureCanvasPixels(0, 100)).toEqual({ width: 0, height: 0 });
  });
});
