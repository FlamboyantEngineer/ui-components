import { describe, expect, it } from 'vitest';
import { FileAudioGlyph, FileImageGlyph, FileVideoGlyph } from '../core/drawn-glyphs.js';
import { FileGlyph } from '../core/glyphs.js';
import { getFileGlyph } from './file-glyph.js';

describe('getFileGlyph', () => {
  it('UIC-FILE-UPLOAD-3.7 picks the glyph of a MIME family, else the file glyph', () => {
    expect(getFileGlyph('image/png')).toBe(FileImageGlyph);
    expect(getFileGlyph('Video/MP4')).toBe(FileVideoGlyph);
    expect(getFileGlyph('audio/ogg')).toBe(FileAudioGlyph);
    expect(getFileGlyph('application/pdf')).toBe(FileGlyph);
    expect(getFileGlyph('')).toBe(FileGlyph);
    expect(getFileGlyph(undefined)).toBe(FileGlyph);
  });
});
