import type { ReactNode, Ref } from 'react';
import {
  Label,
  ProgressBar as AriaProgressBar,
  type ProgressBarProps as AriaProgressBarProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';

export type ProgressBarSize = 'sm' | 'md' | 'lg';

export interface ProgressBarProps extends Omit<
  AriaProgressBarProps,
  'className' | 'style' | 'children' | 'render'
> {
  /** Visible label. Without one, name the bar with `aria-label` or `aria-labelledby`. */
  label?: ReactNode;
  /** Show the value text beside the bar. Defaults to `true`; an indeterminate bar never shows it. */
  showValueLabel?: boolean | undefined;
  /** Track thickness. Defaults to `md`. */
  size?: ProgressBarSize | undefined;
  className?: string | undefined;
  ref?: Ref<HTMLDivElement> | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('progress-bar', ['label', 'value', 'track', 'fill']);

function finiteOr(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) ? value : fallback;
}

/**
 * Bounds a range so it never claims more than it measured: non-finite numbers fall back to the
 * minimum, the maximum is never below the minimum and the value stays inside the range.
 */
export function boundedRange(range: {
  value?: number | undefined;
  minValue?: number | undefined;
  maxValue?: number | undefined;
}): { value: number; minValue: number; maxValue: number } {
  const minValue = finiteOr(range.minValue, 0);
  const maxValue =
    range.maxValue === undefined ? Math.max(minValue, 100) : finiteOr(range.maxValue, minValue);
  const upper = Math.max(minValue, maxValue);
  const value = Math.min(upper, Math.max(minValue, finiteOr(range.value, minValue)));
  return { value, minValue, maxValue: upper };
}

/** A bar showing how much of a known amount of work is done, or that work is under way. */
export function ProgressBar({
  label,
  showValueLabel = true,
  size = 'md',
  isIndeterminate = false,
  value,
  minValue,
  maxValue,
  className,
  ...rest
}: ProgressBarProps) {
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
          {label != null ? <Label className={hooks.slotClass('label')}>{label}</Label> : null}
          {showValueLabel && !isIndeterminate ? (
            <span {...hooks.slot('value')}>{valueText}</span>
          ) : null}
          <div {...hooks.slot('track')}>
            <div
              {...hooks.slot('fill')}
              style={isIndeterminate ? undefined : { width: `${percentage ?? 0}%` }}
            />
          </div>
        </>
      )}
    </AriaProgressBar>
  );
}

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  /** Box size. Defaults to `md`. */
  size?: SpinnerSize | undefined;
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const spinnerHooks = createHooks('spinner');

/**
 * A decorative busy indicator for unmeasured work too small for a bar, such as the start of a
 * busy line. It is hidden from assistive technology; the surrounding text carries the status.
 */
export function Spinner({ size = 'md', className, id, ...rest }: SpinnerProps) {
  return (
    <span
      {...spinnerHooks.root({ className, props: rest, data: { size } })}
      id={id}
      aria-hidden="true"
    />
  );
}
