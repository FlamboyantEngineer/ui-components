import { describe, expect, it } from 'vitest';
import { getFileGlyph } from './file-glyph.js';

describe('getFileGlyph', () => {
  it('UIC-FILE-UPLOAD-3.7 picks the glyph of a MIME family, else the file glyph', () => {
    expect(getFileGlyph('image/png')).toBe('image');
    expect(getFileGlyph('Video/MP4')).toBe('video');
    expect(getFileGlyph('audio/ogg')).toBe('audio');
    expect(getFileGlyph('application/pdf')).toBe('file');
    expect(getFileGlyph('')).toBe('file');
    expect(getFileGlyph(undefined)).toBe('file');
  });
});
