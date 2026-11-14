import type { ComponentHooks } from '../../core/hooks.js';

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
