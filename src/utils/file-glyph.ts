import { FileAudioGlyph, FileImageGlyph, FileVideoGlyph } from '../core/drawn-glyphs.js';
import { FileGlyph, type GlyphComponent } from '../core/glyphs.js';
// The glyph that stands for a file of a given MIME type.

const families: ReadonlyArray<[prefix: string, glyph: GlyphComponent]> = [
  ['image/', FileImageGlyph],
  ['video/', FileVideoGlyph],
  ['audio/', FileAudioGlyph],
];

/** `file-image`, `file-video` or `file-audio` for a file of that MIME family, else `file`. */
export function getFileGlyph(type: string | undefined): GlyphComponent {
  const lower = type?.toLowerCase() ?? '';
  return families.find(([prefix]) => lower.startsWith(prefix))?.[1] ?? FileGlyph;
}
