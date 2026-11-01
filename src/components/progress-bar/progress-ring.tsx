import { progressBarHooks as hooks } from './progress-bar-hooks.js';

/** The ring's circumference, normalised through `pathLength` so offsets read as percentages. */
const ringLength = 100;

/**
 * The decorative ring: a full track and a fill arc whose dash offset leaves `gap` percent empty. A
 * full ring draws its fill undashed, a closed stroke, since a dash that ends where it starts leaves
 * a hairline seam at the top on some pixel ratios.
 */
export function ProgressRing({ gap }: { gap: number }) {
  const dash = gap > 0 ? { strokeDasharray: ringLength, strokeDashoffset: gap } : {};
  return (
    <svg
      className={hooks.slotClass('ring')}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <circle className={hooks.slotClass('track')} cx="16" cy="16" r="13" fill="none" />
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
