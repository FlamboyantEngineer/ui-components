// The glyph that stands for a file of a given MIME type.

import type { GlyphName } from '../core/glyphs.js';

const families: ReadonlyArray<[prefix: string, glyph: GlyphName]> = [
  ['image/', 'image'],
  ['video/', 'video'],
  ['audio/', 'audio'],
];

/** `image`, `video` or `audio` for a file of that MIME family, else `file`. */
export function getFileGlyph(type: string | undefined): GlyphName {
  const lower = type?.toLowerCase() ?? '';
  return families.find(([prefix]) => lower.startsWith(prefix))?.[1] ?? 'file';
}
