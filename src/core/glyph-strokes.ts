// Glyphs drawn from several strokes of their own width and dash pattern: the table border glyphs,
// a dotted grid of thin strokes with the chosen edges solid. Drawn for this library in the
// Heroicons outline style.

import type { GlyphStroke } from './glyph-types.js';

/** The dotted grid every border glyph draws: the frame and the cross through its middle. */
const dottedGrid: readonly GlyphStroke[] = [
  { d: 'M2.25 4.5h19.5v15H2.25Z', strokeWidth: 1, dashArray: '0.5 1.8', dashOffset: 2 },
  { d: 'M2.25 12h19.5', strokeWidth: 1, dashArray: '0.5 2', dashOffset: 0.5 },
  { d: 'M12 4.5v15', strokeWidth: 1, dashArray: '0.5 2', dashOffset: 0.2 },
];

export const borderNoneStrokes: readonly GlyphStroke[] = dottedGrid;
export const borderBottomStrokes: readonly GlyphStroke[] = [
  ...dottedGrid,
  { d: 'M2.25 19.5h19.5' },
];
export const borderLeftStrokes: readonly GlyphStroke[] = [...dottedGrid, { d: 'M2.25 4.5v15' }];
export const borderRightStrokes: readonly GlyphStroke[] = [...dottedGrid, { d: 'M21.75 4.5v15' }];
export const borderTopStrokes: readonly GlyphStroke[] = [...dottedGrid, { d: 'M2.25 4.5h19.5' }];
export const borderOutsideStrokes: readonly GlyphStroke[] = [
  ...dottedGrid,
  { d: 'M2.25 19.5h19.5M2.25 4.5h19.5M2.25 4.5v15M21.75 4.5v15' },
];
