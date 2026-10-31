'use client';

import type { ReactNode } from 'react';
import {
  Label,
  ProgressBar as AriaProgressBar,
  Meter as AriaMeter,
} from '../../primitives/index.js';
import type { ComponentHooks } from '../../core/hooks.js';
import { useNumberFormatter } from '../../primitives/index.js';
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

/**
 * The bounded share of a resolved range that is done, from 0 to 1. Ranges wider than the largest
 * number, such as `-Number.MAX_VALUE` to `Number.MAX_VALUE`, are halved first so no step overflows.
 */
export function toProgressRatio(range: ReturnType<typeof resolveProgressRange>): number {
  const { value, minValue, maxValue } = range;
  if (!(maxValue > minValue)) return 0;
  const span = maxValue - minValue;
  const ratio = Number.isFinite(span)
    ? (value - minValue) / span
    : (value / 2 - minValue / 2) / (maxValue / 2 - minValue / 2);
  return clamp(ratio, 0, 1);
}

/**
 * The value text React Aria cannot work out for a range wider than the largest number, whose width
 * overflows: the share formatted as a percentage, or the value in the caller's format.
 */
function useWideRangeText(
  range: ReturnType<typeof resolveProgressRange>,
  { valueLabel, formatOptions }: Pick<ProgressBarProps, 'valueLabel' | 'formatOptions'>,
): string | undefined {
  const options = formatOptions ?? { style: 'percent' };
  const format = useNumberFormatter(options);
  if (valueLabel !== undefined || Number.isFinite(range.maxValue - range.minValue)) {
    return valueLabel;
  }
  return format.format(options.style === 'percent' ? toProgressRatio(range) : range.value);
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
  valueLabel,
  formatOptions,
  children,
  ...rest
}: ProgressRootProps) {
  const range = resolveProgressRange({ value, minValue, maxValue });
  const indeterminate = mode === 'progress' && isIndeterminate;
  const valueText = useWideRangeText(range, { valueLabel, formatOptions });
  // React Aria divides by the range's width, which overflows for the widest ranges.
  const toValues = (state: { valueText: string | undefined }): ProgressValues => ({
    percentage: indeterminate ? undefined : toProgressRatio(range) * 100,
    valueText: state.valueText,
    isIndeterminate: indeterminate,
  });
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
      valueLabel={valueText}
      formatOptions={formatOptions}
      {...(mode === 'progress' ? { isIndeterminate: indeterminate } : {})}
      render={render ? (props, state) => render(props, toValues(state)) : undefined}
    >
      {(state: Pick<ProgressValues, 'valueText'>) => children(toValues(state))}
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
