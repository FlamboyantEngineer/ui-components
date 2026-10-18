import { describe, expect, it } from 'vitest';
import { layoutMedia, resolveMediaKey } from './media-layout.js';

const keyEvent = (key: string, extra: Partial<KeyboardEvent> = {}) => ({
  key,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  target: null,
  ...extra,
});

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

describe('resolveMediaKey', () => {
  it('UIC-MEDIA-VIEWER-1.4 maps arrows, mirrored right to left, and the zoom keys', () => {
    expect(resolveMediaKey(keyEvent('ArrowRight'), 'ltr')).toBe('next');
    expect(resolveMediaKey(keyEvent('ArrowLeft'), 'ltr')).toBe('previous');
    expect(resolveMediaKey(keyEvent('ArrowRight'), 'rtl')).toBe('previous');
    expect(resolveMediaKey(keyEvent('ArrowLeft'), 'rtl')).toBe('next');
    expect(resolveMediaKey(keyEvent('+'), 'ltr')).toBe('zoom-in');
    expect(resolveMediaKey(keyEvent('='), 'ltr')).toBe('zoom-in');
    expect(resolveMediaKey(keyEvent('-'), 'ltr')).toBe('zoom-out');
    expect(resolveMediaKey(keyEvent('Enter'), 'ltr')).toBeNull();
  });

  it('UIC-MEDIA-VIEWER-1.4 leaves modified presses and key-owning elements alone', () => {
    expect(resolveMediaKey(keyEvent('ArrowRight', { altKey: true }), 'ltr')).toBeNull();
    expect(resolveMediaKey(keyEvent('-', { ctrlKey: true }), 'ltr')).toBeNull();
    expect(resolveMediaKey(keyEvent('+', { metaKey: true }), 'ltr')).toBeNull();
    const slider = document.createElement('input');
    slider.type = 'range';
    expect(resolveMediaKey(keyEvent('ArrowRight', { target: slider }), 'ltr')).toBeNull();
    const button = document.createElement('button');
    expect(resolveMediaKey(keyEvent('ArrowRight', { target: button }), 'ltr')).toBe('next');
  });
});
