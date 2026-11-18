import { describe, expect, it } from 'vitest';
import { layoutMedia } from './layout-media.js';

describe('layoutMedia', () => {
  it('UIC-MEDIA-VIEWER-2.1 fits the image in the stage, never larger than its own size, then zooms', () => {
    const natural = { width: 2000, height: 1000 };
    expect(
      layoutMedia({ natural, stage: { width: 800, height: 600 }, zoom: 100, rotation: 0 }),
    ).toEqual({
      image: { width: 800, height: 400 },
      canvas: { width: 800, height: 400 },
    });
    expect(
      layoutMedia({ natural, stage: { width: 800, height: 600 }, zoom: 200, rotation: 0 }).canvas,
    ).toEqual({ width: 1600, height: 800 });
    expect(
      layoutMedia({
        natural: { width: 200, height: 100 },
        stage: { width: 800, height: 600 },
        zoom: 100,
        rotation: 0,
      }).image,
    ).toEqual({ width: 200, height: 100 });
    expect(
      layoutMedia({ natural, stage: { width: 0, height: 0 }, zoom: 50, rotation: 0 }).image,
    ).toEqual({ width: 1000, height: 500 });
  });

  it('UIC-MEDIA-VIEWER-2.2 fits a sideways image by its turned size', () => {
    const layout = layoutMedia({
      natural: { width: 2000, height: 1000 },
      stage: { width: 800, height: 600 },
      zoom: 100,
      rotation: 90,
    });
    expect(layout.image).toEqual({ width: 600, height: 300 });
    expect(layout.canvas).toEqual({ width: 300, height: 600 });
    expect(
      layoutMedia({
        natural: { width: 2000, height: 1000 },
        stage: { width: 800, height: 600 },
        zoom: 100,
        rotation: 180,
      }).canvas,
    ).toEqual({ width: 800, height: 400 });
  });
});
