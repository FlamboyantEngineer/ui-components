'use client';

import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, RefProps, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { ratingHooks as hooks } from './rating-field-hooks.js';
import { RatingGlyphs, type RatingIcons } from './rating-glyphs.js';

export type RatingSize = Extract<Size, 'sm' | 'md' | 'lg'>;

export interface RatingProps
  extends BaseProps, AriaLabellingProps, RatingIcons, RefProps<HTMLSpanElement> {
  /** The score, such as an average of 4.3; `null` or a non-finite number shows no rating. */
  value: number | null;
  /** The highest score, and how many glyphs are drawn. Defaults to 5. */
  maxValue?: number | undefined;
  /**
   * Plain text that replaces the spoken score (`4.3 out of 5, 120 reviews`). Blank text keeps the
   * provider's `ratingValue` or `ratingNone` text.
   */
  valueLabel?: string | undefined;
  /** Glyph size. Defaults to `md`. */
  size?: RatingSize | undefined;
}

/** The highest score a rating accepts: a whole number of glyphs, at least 1. Defaults to 5. */
export function resolveRatingMax(maxValue: number | undefined): number {
  return maxValue !== undefined && Number.isFinite(maxValue)
    ? Math.max(1, Math.round(maxValue))
    : 5;
}

/**
 * A score shown as glyphs filled up to it, fractions included, such as an aggregate of reviews. It
 * is one image named by the score, so a reader hears `4.3 out of 5` once rather than each glyph.
 */
export function Rating({
  value,
  maxValue,
  valueLabel,
  icon,
  emptyIcon,
  size = 'md',
  className,
  ...rest
}: RatingProps) {
  const strings = useUiStrings();
  const max = resolveRatingMax(maxValue);
  const score = value === null || !Number.isFinite(value) ? null : clamp(value, 0, max);
  const spoken =
    valueLabel?.trim() || (score === null ? strings.ratingNone : strings.ratingValue(score, max));
  return (
    <span
      {...rest}
      {...hooks.root({ className, data: { size, empty: score === null } })}
      role="img"
      aria-label={rest['aria-labelledby'] ? rest['aria-label'] : (rest['aria-label'] ?? spoken)}
    >
      <RatingGlyphs hooks={hooks} value={score} count={max} icon={icon} emptyIcon={emptyIcon} />
    </span>
  );
}
