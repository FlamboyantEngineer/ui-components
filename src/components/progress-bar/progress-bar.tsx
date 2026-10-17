import type { ReactNode, Ref } from 'react';
import {
  Label,
  ProgressBar as AriaProgressBar,
  type ProgressBarProps as AriaProgressBarProps,
  type ProgressBarRenderProps,
} from 'react-aria-components';
import { createHooks, type ComponentHooks } from '../../core/hooks.js';
import type { BaseProps, Size, Tone } from '../../core/props.js';
import { clamp } from '../../utils/clamp.js';

export type ProgressBarSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** The work's status: `neutral` while it runs normally, else how it went or is going. */
export type ProgressBarTone = Extract<Tone, 'neutral' | 'success' | 'warning' | 'danger'>;

export interface ProgressBarProps
  extends Omit<AriaProgressBarProps, 'className' | 'style' | 'children' | 'render'>, BaseProps {
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

/** A progress indicator's root: React Aria's progress bar, its bounded range and the indicator's hooks. */
export interface ProgressRootProps extends Omit<ProgressBarProps, 'label' | 'showValueLabel'> {
  /** The hooks of the indicator that renders the root. */
  hooks: ComponentHooks<string>;
  /** Draws the indicator from React Aria's render values. */
  children: (values: ProgressBarRenderProps) => ReactNode;
}

/** A progress indicator's visible label and value text, in its `label` and `value` slots. */
export interface ProgressTextProps extends Pick<ProgressBarProps, 'label'> {
  hooks: ComponentHooks<'label' | 'value'>;
  /** Show the value text; an indeterminate indicator never shows it. */
  showValueLabel: boolean;
  /** React Aria's render values. */
  values: ProgressBarRenderProps;
}

const hooks = createHooks('progress-bar', ['label', 'value', 'track', 'fill']);
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
export function ProgressRoot({
  hooks: rootHooks,
  size,
  tone = 'neutral',
  isIndeterminate = false,
  value,
  minValue,
  maxValue,
  className,
  ...rest
}: ProgressRootProps) {
  const range = resolveProgressRange({ value, minValue, maxValue });
  const complete = !isIndeterminate && isComplete(range);
  const data = { size, tone, indeterminate: isIndeterminate, complete };
  return (
    <AriaProgressBar
      {...rest}
      {...rootHooks.root({ className, data })}
      {...range}
      isIndeterminate={isIndeterminate}
    />
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

/** A bar showing how much of a known amount of work is done, or that work is under way. */
export function ProgressBar({
  label,
  showValueLabel = true,
  size = 'md',
  ...rest
}: ProgressBarProps) {
  return (
    <ProgressRoot {...rest} hooks={hooks} size={size}>
      {(values) => (
        <>
          <ProgressText
            hooks={hooks}
            label={label}
            showValueLabel={showValueLabel}
            values={values}
          />
          <div {...hooks.slot('track')}>
            <div
              {...hooks.slot('fill')}
              style={values.isIndeterminate ? undefined : { width: `${values.percentage ?? 0}%` }}
            />
          </div>
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
