import type { ReactNode } from 'react';
import {
  Label,
  ProgressBar as AriaProgressBar,
  Meter as AriaMeter,
} from '../../primitives/index.js';
import type { ComponentHooks } from '../../core/hooks.js';
import { clamp } from '../../utils/clamp.js';
import type { ProgressBarProps, ProgressValues } from './progress-bar.js';
import { resolveMeterTone } from './progress-meter.js';

/** A progress indicator's root: a progress bar, its bounded range and the indicator's hooks. */
interface ProgressRootProps extends Omit<
  ProgressBarProps,
  'label' | 'showValueLabel' | 'segments'
> {
  /** The bar draws discrete units instead of one fill. */
  isSegmented?: boolean | undefined;
  /** The hooks of the indicator that renders the root. */
  hooks: ComponentHooks<string>;
  /** Draws the indicator from its values. */
  children: (values: ProgressValues) => ReactNode;
}

/** A progress indicator's visible label and value text, in its `label` and `value` slots. */
interface ProgressTextProps extends Pick<ProgressBarProps, 'label'> {
  hooks: ComponentHooks<'label' | 'value'>;
  /** Show the value text; an indeterminate indicator never shows it. */
  showValueLabel: boolean;
  /** The indicator's values. */
  values: ProgressValues;
}

function toFinite(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) ? value : fallback;
}

/**
 * Bounds a range so it never claims more than it measured: non-finite numbers fall back to the
 * minimum, the maximum is never below the minimum and the value stays inside the range.
 */
export function resolveProgressRange(
  range: Pick<ProgressBarProps, 'value' | 'minValue' | 'maxValue'>,
): { value: number; minValue: number; maxValue: number } {
  const minValue = toFinite(range.minValue, 0);
  const maxValue = Math.max(
    minValue,
    range.maxValue === undefined ? 100 : toFinite(range.maxValue, minValue),
  );
  return { value: clamp(toFinite(range.value, minValue), minValue, maxValue), minValue, maxValue };
}

/** Whether measured progress reached the end of a range that has one. */
function isComplete(range: ReturnType<typeof resolveProgressRange>): boolean {
  return range.maxValue > range.minValue && range.value === range.maxValue;
}

/** The root both progress indicators render; `children` draws the indicator. */
export function ProgressRoot({
  hooks: rootHooks,
  size,
  tone,
  mode = 'progress',
  shape = 'linear',
  low,
  high,
  optimum,
  isIndeterminate = false,
  value,
  minValue,
  maxValue,
  className,
  render,
  isSegmented = false,
  children,
  ...rest
}: ProgressRootProps) {
  const range = resolveProgressRange({ value, minValue, maxValue });
  const indeterminate = mode === 'progress' && isIndeterminate;
  const complete = mode === 'progress' && !indeterminate && isComplete(range);
  const judged =
    tone ??
    (mode === 'meter' ? resolveMeterTone(range, { low, high, optimum }) : undefined) ??
    'neutral';
  const data = { size, tone: judged, mode, shape, indeterminate, complete, segmented: isSegmented };
  const Root = mode === 'meter' ? AriaMeter : AriaProgressBar;
  return (
    <Root
      {...rest}
      {...rootHooks.root({ className, data })}
      {...range}
      {...(mode === 'progress' ? { isIndeterminate: indeterminate } : {})}
      render={
        render
          ? (props, state) =>
              render(props, {
                percentage: state.percentage,
                valueText: state.valueText,
                isIndeterminate: indeterminate,
              })
          : undefined
      }
    >
      {(state: Pick<ProgressValues, 'percentage' | 'valueText'>) =>
        children({
          percentage: state.percentage,
          valueText: state.valueText,
          isIndeterminate: indeterminate,
        })
      }
    </Root>
  );
}

/** The label and value text both progress indicators show. */
export function ProgressText({
  hooks: textHooks,
  label,
  showValueLabel,
  values,
}: ProgressTextProps) {
  return (
    <>
      {label != null ? <Label className={textHooks.slotClass('label')}>{label}</Label> : null}
      {showValueLabel && !values.isIndeterminate ? (
        <span {...textHooks.slot('value')}>{values.valueText}</span>
      ) : null}
    </>
  );
}
