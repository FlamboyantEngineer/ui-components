import {
  AudioGlyph,
  FileGlyph,
  type GlyphComponent,
  ImageGlyph,
  VideoGlyph,
} from '../core/glyphs.js';
// The glyph that stands for a file of a given MIME type.

const families: ReadonlyArray<[prefix: string, glyph: GlyphComponent]> = [
  ['image/', ImageGlyph],
  ['video/', VideoGlyph],
  ['audio/', AudioGlyph],
];

/** `image`, `video` or `audio` for a file of that MIME family, else `file`. */
export function getFileGlyph(type: string | undefined): GlyphComponent {
  const lower = type?.toLowerCase() ?? '';
  return families.find(([prefix]) => lower.startsWith(prefix))?.[1] ?? FileGlyph;
}
