import type { ReactNode, Ref } from 'react';
import {
  Label,
  ProgressBar as AriaProgressBar,
  type ProgressBarProps as AriaProgressBarProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { boundedRange } from '../progress-bar/progress-bar.js';

export type CircularProgressSize = 'sm' | 'md' | 'lg';

export interface CircularProgressProps extends Omit<
  AriaProgressBarProps,
  'className' | 'style' | 'children' | 'render'
> {
  /** Visible label. Without one, name the ring with `aria-label` or `aria-labelledby`. */
  label?: ReactNode;
  /** Show the value text next to the ring. Defaults to `false`. */
  showValueLabel?: boolean | undefined;
  /** Ring size. Defaults to `md`. */
  size?: CircularProgressSize | undefined;
  className?: string | undefined;
  ref?: Ref<HTMLDivElement> | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('circular-progress', ['ring', 'track', 'fill', 'label', 'value']);

/** The ring's circumference, normalised through `pathLength` so offsets read as percentages. */
const RING_LENGTH = 100;
/** How much of the ring an indeterminate arc leaves empty. */
const INDETERMINATE_GAP = 75;

/** A compact ring showing a ratio, for dense cells where a bar does not fit. */
export function CircularProgress({
  label,
  showValueLabel = false,
  size = 'md',
  isIndeterminate = false,
  value,
  minValue,
  maxValue,
  className,
  ...rest
}: CircularProgressProps) {
  const range = boundedRange({ value, minValue, maxValue });
  return (
    <AriaProgressBar
      {...rest}
      {...hooks.root({ className, props: rest, data: { size, indeterminate: isIndeterminate } })}
      {...range}
      isIndeterminate={isIndeterminate}
    >
      {({ percentage, valueText }) => (
        <>
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
              pathLength={RING_LENGTH}
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={
                isIndeterminate ? INDETERMINATE_GAP : RING_LENGTH - (percentage ?? 0)
              }
            />
          </svg>
          {label != null ? <Label className={hooks.slotClass('label')}>{label}</Label> : null}
          {showValueLabel && !isIndeterminate ? (
            <span {...hooks.slot('value')}>{valueText}</span>
          ) : null}
        </>
      )}
    </AriaProgressBar>
  );
}
