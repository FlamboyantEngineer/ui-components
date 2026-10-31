import { ErrorGlyph, InfoGlyph, SuccessGlyph, WarningGlyph } from './glyphs.js';
import type { GlyphComponent } from './glyph-types.js';
import type { Tone } from './props.js';

const toneGlyphs: Readonly<Record<Tone, GlyphComponent | null>> = {
  neutral: null,
  info: InfoGlyph,
  success: SuccessGlyph,
  warning: WarningGlyph,
  danger: ErrorGlyph,
};

/** The built-in glyph that introduces a message of `tone`; none for `neutral`. */
export function getToneGlyph(tone: Tone): GlyphComponent | null {
  return toneGlyphs[tone];
}
