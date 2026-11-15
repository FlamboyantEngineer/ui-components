import type { ComponentHooks } from '../../core/hooks.js';
import type { ProgressBarShape } from './progress-bar.js';

/** The share of the ring an indeterminate ring and the spinner leave open: a quarter arc is drawn. */
export const spinnerGap = 75;

/** The ring's circumference, normalised through `pathLength` so offsets read as percentages. */
const ringLength = 100;

/**
 * The decorative ring: an optional full track and a fill arc whose dash offset leaves `gap` percent
 * empty, starting at the top. A full ring draws its fill undashed, a closed stroke, since a dash that
 * ends where it starts leaves a hairline seam at the top on some pixel ratios. The spinner draws the
 * same ring without a track.
 */
export function ProgressRing({
  gap,
  hooks,
  trackClass,
}: {
  gap: number;
  hooks: ComponentHooks<'ring' | 'fill'>;
  /** The track circle's class; without it the ring draws only its fill arc. */
  trackClass?: string | undefined;
}) {
  const dash = gap > 0 ? { strokeDasharray: ringLength, strokeDashoffset: gap } : {};
  return (
    <svg
      className={hooks.slotClass('ring')}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      {trackClass ? <circle className={trackClass} cx="16" cy="16" r="13" fill="none" /> : null}
      <circle
        className={hooks.slotClass('fill')}
        cx="16"
        cy="16"
        r="13"
        fill="none"
        transform="rotate(-90 16 16)"
        pathLength={ringLength}
        {...dash}
      />
    </svg>
  );
}

/**
 * The bar's track and fill, or its ring, filled to `percentage`; `null` while the amount is not
 * known, when the bar's fill takes no width and the ring draws the spinner's quarter arc.
 */
export function ProgressGauge({
  hooks,
  shape,
  percentage,
}: {
  hooks: ComponentHooks<'ring' | 'fill' | 'track'>;
  shape: ProgressBarShape;
  percentage: number | null;
}) {
  if (shape === 'circular') {
    return (
      <ProgressRing
        hooks={hooks}
        trackClass={hooks.slotClass('track')}
        gap={percentage === null ? spinnerGap : 100 - percentage}
      />
    );
  }
  return (
    <div {...hooks.slot('track')}>
      <div
        {...hooks.slot('fill')}
        style={percentage === null ? undefined : { width: `${percentage}%` }}
      />
    </div>
  );
}
