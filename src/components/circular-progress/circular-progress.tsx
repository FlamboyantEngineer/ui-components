import { createHooks } from '../../core/hooks.js';
import type { Size } from '../../core/props.js';
import { ProgressRoot, ProgressText, type ProgressBarProps } from '../progress-bar/progress-bar.js';

export type CircularProgressSize = Extract<Size, 'sm' | 'md' | 'lg'>;

export interface CircularProgressProps extends Omit<ProgressBarProps, 'showValueLabel' | 'size'> {
  /** Show the value text next to the ring. Defaults to `false`. */
  showValueLabel?: boolean | undefined;
  /** Ring size. Defaults to `md`. */
  size?: CircularProgressSize | undefined;
}

const hooks = createHooks('circular-progress', ['ring', 'track', 'fill', 'label', 'value']);

/** The ring's circumference, normalised through `pathLength` so offsets read as percentages. */
const ringLength = 100;
/** How much of the ring an indeterminate arc leaves empty. */
const indeterminateGap = 75;

/** The decorative ring: a full track and a fill arc whose dash offset leaves `gap` percent empty. */
function ProgressRing({ gap }: { gap: number }) {
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
        strokeDasharray={ringLength}
        strokeDashoffset={gap}
      />
    </svg>
  );
}

/** A compact ring showing a ratio, for dense cells where a bar does not fit. */
export function CircularProgress({
  label,
  showValueLabel = false,
  size = 'md',
  ...rest
}: CircularProgressProps) {
  return (
    <ProgressRoot {...rest} hooks={hooks} size={size}>
      {(values) => (
        <>
          <ProgressRing
            gap={values.isIndeterminate ? indeterminateGap : ringLength - (values.percentage ?? 0)}
          />
          <ProgressText
            hooks={hooks}
            label={label}
            showValueLabel={showValueLabel}
            values={values}
          />
        </>
      )}
    </ProgressRoot>
  );
}
