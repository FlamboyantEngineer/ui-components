import type { ReactNode } from 'react';
import type { GlyphName } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';

export type IconSize = 'sm' | 'md' | 'lg';

export interface IconProps {
  /** A built-in glyph, drawn from the provider's glyph map. */
  glyph?: GlyphName | undefined;
  /** Any icon node (an SVG element, an image), used when no `glyph` is given. */
  children?: ReactNode;
  /** Box size. Defaults to `md`. */
  size?: IconSize | undefined;
  /** Accessible name. Without one the icon is decorative and hidden from assistive technology. */
  label?: string | undefined;
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('icon', ['glyph']);

/** One icon box: a built-in glyph or any icon node, decorative unless it has a label. */
export function Icon({ glyph, children, size = 'md', label, className, id, ...rest }: IconProps) {
  const named = Boolean(label);
  return (
    <span
      {...hooks.root({ className, props: rest, data: { size, glyph } })}
      id={id}
      {...(named ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {glyph ? <Glyph name={glyph} className={hooks.slotClass('glyph')} /> : children}
    </span>
  );
}
