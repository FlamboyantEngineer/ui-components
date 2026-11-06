'use client';

import type { CSSProperties, ReactNode } from 'react';
import { type GlyphComponent, StarGlyph } from '../../core/glyphs.js';
import type { ComponentHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';

/** How much of one glyph a value fills. */
export type RatingGlyphFill = 'full' | 'partial' | 'empty';

/** The glyphs a rating draws. */
export interface RatingIcons {
  /** The glyph each position draws, outlined when empty and filled up to the value. Defaults to a star. */
  icon?: GlyphComponent | undefined;
  /** A different glyph for the empty part, such as an outlined heart. Defaults to `icon`. */
  emptyIcon?: GlyphComponent | undefined;
}

interface RatingGlyphsProps extends RatingIcons {
  hooks: ComponentHooks<'item' | 'glyph' | 'fill'>;
  /** The value the glyphs show, bounded to the range; `null` fills none. */
  value: number | null;
  /** How many glyphs to draw. */
  count: number;
  /** Extra content inside each position, such as its radios, from its 1-based position. */
  renderItem?: ((position: number) => ReactNode) | undefined;
}

/** The share of the glyph at `position` (from 1) that `value` fills, from 0 to 1. */
export function toGlyphShare(value: number | null, position: number): number {
  return value === null || !Number.isFinite(value) ? 0 : clamp(value - (position - 1), 0, 1);
}

function toFill(share: number): RatingGlyphFill {
  if (share >= 1) return 'full';
  return share > 0 ? 'partial' : 'empty';
}

/**
 * One position per glyph: an empty glyph and, over it, a filled one that the stylesheet clips to the
 * position's share (`--ui-rating-fill` while partial). Filled and empty glyphs differ in shape as
 * well as colour, so the value never depends on colour alone. Both glyphs are decorative.
 */
export function RatingGlyphs({
  hooks,
  value,
  count,
  icon = StarGlyph,
  emptyIcon = icon,
  renderItem,
}: RatingGlyphsProps) {
  return Array.from({ length: count }, (_, index) => {
    const position = index + 1;
    const share = toGlyphShare(value, position);
    const fill = toFill(share);
    const style =
      fill === 'partial'
        ? ({ '--ui-rating-fill': `${Math.round(share * 1000) / 10}%` } as CSSProperties)
        : undefined;
    return (
      <span key={position} {...hooks.slot('item', { fill })} style={style}>
        <Glyph icon={emptyIcon} className={hooks.slotClass('glyph')} />
        <Glyph icon={icon} className={hooks.slotClass('fill')} />
        {renderItem?.(position)}
      </span>
    );
  });
}
