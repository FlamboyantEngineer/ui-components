import { describe, expect, it } from 'vitest';
import { resolveMediaKey } from './media-layout.js';

const keyEvent = (key: string, extra: Partial<KeyboardEvent> = {}) => ({
  key,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  target: null,
  ...extra,
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

  it('UIC-MEDIA-VIEWER-1.4 leaves keys to editable content of any value but false', () => {
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', '');
    expect(resolveMediaKey(keyEvent('ArrowRight', { target: editable }), 'ltr')).toBeNull();
    editable.setAttribute('contenteditable', 'plaintext-only');
    expect(resolveMediaKey(keyEvent('-', { target: editable }), 'ltr')).toBeNull();
    editable.setAttribute('contenteditable', 'false');
    expect(resolveMediaKey(keyEvent('ArrowRight', { target: editable }), 'ltr')).toBe('next');
  });

  it('UIC-MEDIA-VIEWER-1.4 moves with Page Up and Page Down and leaves the arrows to panning', () => {
    expect(resolveMediaKey(keyEvent('PageDown'), 'ltr')).toBe('next');
    expect(resolveMediaKey(keyEvent('PageUp'), 'rtl')).toBe('previous');
    expect(resolveMediaKey(keyEvent('ArrowRight'), 'ltr', true)).toBeNull();
    expect(resolveMediaKey(keyEvent('ArrowLeft'), 'rtl', true)).toBeNull();
    expect(resolveMediaKey(keyEvent('PageDown'), 'ltr', true)).toBe('next');
    expect(resolveMediaKey(keyEvent('+'), 'ltr', true)).toBe('zoom-in');
  });
});
