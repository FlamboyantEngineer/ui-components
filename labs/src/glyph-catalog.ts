import * as glyphs from '../../src/core/glyphs.js';
import { type GlyphComponent, type GlyphName } from '../../src/core/glyphs.js';

export const glyphCatalog = Object.fromEntries(
  Object.values(glyphs).map((glyph) => [glyph.glyphName, glyph]),
) as Record<GlyphName, GlyphComponent>;
export const glyphNames = Object.keys(glyphCatalog) as GlyphName[];
