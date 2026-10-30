import type { GlyphComponent, GlyphComponentProps, GlyphName } from './glyph-types.js';
import { useGlyph } from './provider.js';

/** Binds one default icon to its provider override without retaining the icon catalog. */
export function createGlyph(name: GlyphName, fallback: GlyphComponent) {
  function BuiltInGlyph(props: GlyphComponentProps) {
    const replacement = useGlyph(name, fallback);
    const Component = replacement === BuiltInGlyph ? fallback : replacement;
    return <Component {...props} />;
  }
  return Object.assign(BuiltInGlyph, { glyphName: name });
}
