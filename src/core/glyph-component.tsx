'use client';

import type { GlyphComponentProps, GlyphName, GlyphStroke } from './glyph-types.js';
import { useGlyph } from './provider.js';

/** A glyph's strokes: one path, or several (`glyph-strokes.ts`) each with its width and dashes. */
function renderStrokes(path: string | readonly GlyphStroke[], linecap: 'round' | 'butt') {
  if (typeof path === 'string') {
    return <path strokeLinecap={linecap} strokeLinejoin="round" d={path} />;
  }
  return path.map((stroke) => (
    <path
      key={stroke.d}
      strokeLinecap={linecap}
      strokeLinejoin="round"
      d={stroke.d}
      strokeWidth={stroke.strokeWidth}
      strokeDasharray={stroke.dashArray}
      strokeDashoffset={stroke.dashOffset}
    />
  ));
}

/**
 * Binds one default icon, an outline path from `glyph-paths.ts` or the strokes of one from
 * `glyph-strokes.ts`, to its provider override without retaining the icon catalog.
 * `strokeLinecap` is `butt` for the few icons drawn with square ends.
 */
export function createGlyph(
  name: GlyphName,
  path: string | readonly GlyphStroke[],
  strokeLinecap: 'round' | 'butt' = 'round',
) {
  function OutlineIcon(props: GlyphComponentProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
        {...props}
      >
        {renderStrokes(path, strokeLinecap)}
      </svg>
    );
  }
  function BuiltInGlyph(props: GlyphComponentProps) {
    const replacement = useGlyph(name, OutlineIcon);
    const Component = replacement === BuiltInGlyph ? OutlineIcon : replacement;
    return <Component {...props} />;
  }
  return Object.assign(BuiltInGlyph, { glyphName: name });
}
