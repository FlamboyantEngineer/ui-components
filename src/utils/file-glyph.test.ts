import { describe, expect, it } from 'vitest';
import { AudioGlyph, FileGlyph, ImageGlyph, VideoGlyph } from '../core/glyphs.js';
import { getFileGlyph } from './file-glyph.js';

describe('getFileGlyph', () => {
  it('UIC-FILE-UPLOAD-3.7 picks the glyph of a MIME family, else the file glyph', () => {
    expect(getFileGlyph('image/png')).toBe(ImageGlyph);
    expect(getFileGlyph('Video/MP4')).toBe(VideoGlyph);
    expect(getFileGlyph('audio/ogg')).toBe(AudioGlyph);
    expect(getFileGlyph('application/pdf')).toBe(FileGlyph);
    expect(getFileGlyph('')).toBe(FileGlyph);
    expect(getFileGlyph(undefined)).toBe(FileGlyph);
  });
});
