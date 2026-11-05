import type { GlyphComponent, GlyphName } from '../../src/core/index.js';
import * as core from '../../src/core/index.js';

const isGlyph = (value: unknown): value is Required<GlyphComponent> =>
  typeof value === 'function' && 'glyphName' in value;

export const glyphCatalog = Object.fromEntries(
  Object.values(core as Record<string, unknown>).flatMap((value) =>
    isGlyph(value) ? [[value.glyphName, value]] : [],
  ),
) as Record<GlyphName, GlyphComponent>;
export const glyphNames = Object.keys(glyphCatalog) as GlyphName[];
