'use client';

import type { ReactNode, Ref } from 'react';
import { useProgressBar } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size, Tone } from '../../core/props.js';
import type { ElementRender } from '../../utils/render-element.js';
import { ProgressRing } from './progress-ring.js';
import { ProgressRoot, ProgressText } from './progress-root.js';
import { SegmentedProgressBar, type ProgressSegment } from './progress-segments.js';

export type ProgressBarSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** The work's status: `neutral` while it runs normally, else how it went or is going. */
export type ProgressBarTone = Extract<Tone, 'neutral' | 'success' | 'warning' | 'danger'>;

/** The range and value text a bounded indicator shares with the progress bar and the meter. */
export interface ProgressRangeProps {
  /** The current value. Defaults to the minimum. */
  value?: number | undefined;
  /** The start of the range. Defaults to 0. */
  minValue?: number | undefined;
  /** The end of the range. Defaults to 100. */
  maxValue?: number | undefined;
  /**
   * Plain text that replaces the formatted value text, visibly and as `aria-valuetext`. Blank text,
   * or anything but text, keeps the formatted value.
   */
  valueLabel?: string | undefined;
  /** How the value text is formatted. Defaults to a locale-formatted percentage. */
  formatOptions?: Intl.NumberFormatOptions | undefined;
}

export type ProgressBarShape = 'linear' | 'circular';
export type ProgressBarMode = 'progress' | 'meter';

export interface ProgressBarProps extends BaseProps, AriaLabellingProps, ProgressRangeProps {
  /** Draws a linear track or a circular ring. Defaults to `linear`. */
  shape?: ProgressBarShape | undefined;
  /** Work toward completion or a measured quantity. Defaults to `progress`. */
  mode?: ProgressBarMode | undefined;
  /** ProgressBar thresholds judge the value's tone unless `tone` is explicit. */
  low?: number | undefined;
  /** The lower end of the high meter region. Defaults to the maximum. */
  high?: number | undefined;
  /** The best meter value, used to judge its tone. Defaults to the range midpoint. */
  optimum?: number | undefined;
  /** Replaces the root with the caller's element and receives its measured values. */
  render?: ElementRender<'div', ProgressValues> | undefined;
  /** Work is under way but unmeasured: no value or value text. */
  isIndeterminate?: boolean | undefined;
  /** Visible label. Without one, name the indicator with `aria-label` or `aria-labelledby`. */
  label?: ReactNode;
  /** Show the value text beside the bar. Defaults to `true`; an indeterminate bar never shows it. */
  showValueLabel?: boolean | undefined;
  /** Track thickness. Defaults to `md`. */
  size?: ProgressBarSize | undefined;
  /** The work's status, such as `success` once done or `danger` when it failed. Defaults to `neutral`. */
  tone?: ProgressBarTone | undefined;
  /**
   * One equal segment per unit of work, in order. The bar then counts completed units of all units,
   * so `value`, `minValue`, `maxValue`, `formatOptions`, `isIndeterminate`, `shape` and `mode` do not
   * apply.
   */
  segments?: readonly ProgressSegment[] | undefined;
  /** The root element. */
  ref?: Ref<HTMLDivElement> | undefined;
}

export type SpinnerSize = Extract<Size, 'sm' | 'md' | 'lg'>;

export interface SpinnerProps extends BaseProps {
  /** Box size. Defaults to `md`. */
  size?: SpinnerSize | undefined;
  /** Names a standalone spinner, which then is an indeterminate progress bar. Without it, decorative. */
  label?: string | undefined;
}

/** What a progress indicator draws from: the filled share of the range and the value text. */
export interface ProgressValues {
  /** The value's percentage of the range; `undefined` while indeterminate. */
  percentage: number | undefined;
  /** The formatted value, or `valueLabel`. */
  valueText: string | undefined;
  /** The indicator represents unmeasured work. Always false for a meter. */
  isIndeterminate: boolean;
}

const hooks = createHooks('progress-bar', ['label', 'value', 'track', 'fill', 'ring']);
const spinnerHooks = createHooks('spinner');

/** A bar showing how much of a known amount of work is done, or that work is under way. */
export function ProgressBar({ valueLabel, ...props }: ProgressBarProps) {
  // Untyped callers may still pass an element, which would read as `[object Object]`.
  const text = typeof valueLabel === 'string' && valueLabel.trim() ? valueLabel : undefined;
  return props.segments ? (
    <SegmentedProgressBar {...props} valueLabel={text} segments={props.segments} />
  ) : (
    <RangeProgressBar {...props} valueLabel={text} />
  );
}

/** A linear or circular bar filled to a share of its range. */
function RangeProgressBar({
  label,
  shape = 'linear',
  showValueLabel = shape === 'linear',
  size = 'md',
  ...rest
}: ProgressBarProps) {
  return (
    <ProgressRoot {...rest} shape={shape} hooks={hooks} size={size}>
      {(values) => (
        <>
          <ProgressText
            hooks={hooks}
            label={label}
            showValueLabel={showValueLabel}
            values={values}
          />
          {shape === 'circular' ? (
            <ProgressRing gap={values.isIndeterminate ? 75 : 100 - (values.percentage ?? 0)} />
          ) : (
            <div {...hooks.slot('track')}>
              <div
                {...hooks.slot('fill')}
                style={values.isIndeterminate ? undefined : { width: `${values.percentage ?? 0}%` }}
              />
            </div>
          )}
        </>
      )}
    </ProgressRoot>
  );
}

/**
 * A busy indicator for unmeasured work too small for a bar. Without `label` it is decorative, such
 * as the start of a busy line whose text carries the status; with one it stands alone as an
 * indeterminate progress bar named by the label.
 */
export function Spinner({ size = 'md', label, className, ...rest }: SpinnerProps) {
  const hookProps = spinnerHooks.root({ className, data: { size } });
  if (!label) return <span {...rest} {...hookProps} aria-hidden="true" />;
  return <NamedSpinner {...rest} {...hookProps} label={label} />;
}

/** The glyph stays a `<span>`, so a named spinner still sits inside a line of text. */
function NamedSpinner({ id, label, ...rest }: SpinnerProps & { label: string }) {
  const { progressBarProps } = useProgressBar({ id, 'aria-label': label, isIndeterminate: true });
  return <span {...rest} {...progressBarProps} />;
}

export { resolveMeterTone } from './progress-meter.js';
export { resolveProgressRange } from './progress-root.js';
