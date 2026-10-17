import type { ReactNode, Ref } from 'react';
import {
  Label,
  ProgressBar as AriaProgressBar,
  type ProgressBarProps as AriaProgressBarProps,
  type ProgressBarRenderProps,
} from 'react-aria-components';
import { createHooks, type ComponentHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { clamp } from '../../utils/clamp.js';

export type ProgressBarSize = Extract<Size, 'sm' | 'md' | 'lg'>;

export interface ProgressBarProps
  extends Omit<AriaProgressBarProps, 'className' | 'style' | 'children' | 'render'>, BaseProps {
  /** Visible label. Without one, name the indicator with `aria-label` or `aria-labelledby`. */
  label?: ReactNode;
  /** Show the value text beside the bar. Defaults to `true`; an indeterminate bar never shows it. */
  showValueLabel?: boolean | undefined;
  /** Track thickness. Defaults to `md`. */
  size?: ProgressBarSize | undefined;
  /** The root element. */
  ref?: Ref<HTMLDivElement> | undefined;
}

export type SpinnerSize = Extract<Size, 'sm' | 'md' | 'lg'>;

export interface SpinnerProps extends BaseProps {
  /** Box size. Defaults to `md`. */
  size?: SpinnerSize | undefined;
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

/** The root both progress indicators render; `children` draws the indicator. */
export function ProgressRoot({
  hooks: rootHooks,
  size,
  isIndeterminate = false,
  value,
  minValue,
  maxValue,
  className,
  ...rest
}: ProgressRootProps) {
  return (
    <AriaProgressBar
      {...rest}
      {...rootHooks.root({ className, data: { size, indeterminate: isIndeterminate } })}
      {...resolveProgressRange({ value, minValue, maxValue })}
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
 * A decorative busy indicator for unmeasured work too small for a bar, such as the start of a
 * busy line. It is hidden from assistive technology; the surrounding text carries the status.
 */
export function Spinner({ size = 'md', className, ...rest }: SpinnerProps) {
  return (
    <span {...rest} {...spinnerHooks.root({ className, data: { size } })} aria-hidden="true" />
  );
}
