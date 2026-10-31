'use client';

import type { GlyphComponentProps, GlyphName } from './glyph-types.js';
import { useGlyph } from './provider.js';

/**
 * Binds one default icon, an outline path from `glyph-paths.ts`, to its provider override without
 * retaining the icon catalog. `strokeLinecap` is `butt` for the few icons drawn with square ends.
 */
export function createGlyph(
  name: GlyphName,
  path: string,
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
        <path strokeLinecap={strokeLinecap} strokeLinejoin="round" d={path} />
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
