import { afterEach, describe, expect, it, vi } from 'vitest';
import { measureCanvasPixels } from './page-bitmap.js';

describe('measureCanvasPixels', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('UIC-PDF-VIEWER-2.1 draws at the device pixel ratio, capped at 2^25 device pixels', () => {
    vi.stubGlobal('devicePixelRatio', 2);
    const canvas = document.createElement('canvas');
    expect(measureCanvasPixels(560, 793.4, canvas)).toEqual({ width: 1120, height: 1586 });
    const huge = measureCanvasPixels(8000, 11000, canvas);
    expect(huge.width * huge.height).toBeLessThanOrEqual(2 ** 25);
    expect(huge.width / huge.height).toBeCloseTo(8000 / 11000, 2);
    expect(measureCanvasPixels(0, 100, canvas)).toEqual({ width: 0, height: 0 });
  });

  it("UIC-PDF-VIEWER-2.1 reads the pixel ratio of the canvas's own window", () => {
    vi.stubGlobal('devicePixelRatio', 1);
    const frame = document.createElement('iframe');
    document.body.append(frame);
    const view = frame.contentWindow;
    if (!view) throw new Error('The frame has no window');
    Object.defineProperty(view, 'devicePixelRatio', { value: 3, configurable: true });
    const canvas = view.document.createElement('canvas');
    expect(measureCanvasPixels(100, 100, canvas)).toEqual({ width: 300, height: 300 });
    expect(measureCanvasPixels(100, 100, null)).toEqual({ width: 100, height: 100 });
    frame.remove();
  });
});
