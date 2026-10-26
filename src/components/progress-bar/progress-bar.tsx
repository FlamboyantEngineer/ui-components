import type { ReactNode, Ref } from 'react';
import {
  Label,
  ProgressBar as AriaProgressBar,
  Meter as AriaMeter,
} from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks, type ComponentHooks } from '../../core/hooks.js';
import type { BaseProps, Size, Tone } from '../../core/props.js';
import type { ElementRender } from '../../utils/render-element.js';
import { ProgressRing } from './progress-ring.js';
import { resolveMeterTone } from './progress-meter.js';
import { clamp } from '../../utils/clamp.js';

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
  /** Replaces the formatted value text, visibly and as `aria-valuetext`. */
  valueLabel?: ReactNode;
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

/** A progress indicator's root: a progress bar, its bounded range and the indicator's hooks. */
interface ProgressRootProps extends Omit<ProgressBarProps, 'label' | 'showValueLabel'> {
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

const hooks = createHooks('progress-bar', ['label', 'value', 'track', 'fill', 'ring']);
const spinnerHooks = createHooks('spinner');

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
function ProgressRoot({
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
  const data = { size, tone: judged, mode, shape, indeterminate, complete };
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
function ProgressText({ hooks: textHooks, label, showValueLabel, values }: ProgressTextProps) {
  return (
    <>
      {label != null ? <Label className={textHooks.slotClass('label')}>{label}</Label> : null}
      {showValueLabel && !values.isIndeterminate ? (
        <span {...textHooks.slot('value')}>{values.valueText}</span>
      ) : null}
    </>
  );
}

/** A bar showing how much of a known amount of work is done, or that work is under way. */
export function ProgressBar({
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
  return (
    <AriaProgressBar
      {...rest}
      {...hookProps}
      aria-label={label}
      isIndeterminate
      // The glyph stays a `<span>`, so a named spinner still sits inside a line of text.
      render={(props) => <span {...props} />}
    />
  );
}

export { resolveMeterTone } from './progress-meter.js';
