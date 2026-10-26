import type { ReactNode, Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { type ComponentHooks } from '../../core/hooks.js';
import type { BaseProps, Size, Tone } from '../../core/props.js';
import type { ElementRender } from '../../utils/render-element.js';
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
export interface ProgressRootProps extends Omit<ProgressBarProps, 'label' | 'showValueLabel'> {
    /** The hooks of the indicator that renders the root. */
    hooks: ComponentHooks<string>;
    /** Draws the indicator from its values. */
    children: (values: ProgressValues) => ReactNode;
}
/** A progress indicator's visible label and value text, in its `label` and `value` slots. */
export interface ProgressTextProps extends Pick<ProgressBarProps, 'label'> {
    hooks: ComponentHooks<'label' | 'value'>;
    /** Show the value text; an indeterminate indicator never shows it. */
    showValueLabel: boolean;
    /** The indicator's values. */
    values: ProgressValues;
}
/**
 * Bounds a range so it never claims more than it measured: non-finite numbers fall back to the
 * minimum, the maximum is never below the minimum and the value stays inside the range.
 */
export declare function resolveProgressRange(range: Pick<ProgressBarProps, 'value' | 'minValue' | 'maxValue'>): {
    value: number;
    minValue: number;
    maxValue: number;
};
/** The root both progress indicators render; `children` draws the indicator. */
export declare function ProgressRoot({ hooks: rootHooks, size, tone, mode, shape, low, high, optimum, isIndeterminate, value, minValue, maxValue, className, render, children, ...rest }: ProgressRootProps): import("react").JSX.Element;
/** The label and value text both progress indicators show. */
export declare function ProgressText({ hooks: textHooks, label, showValueLabel, values, }: ProgressTextProps): import("react").JSX.Element;
/** A bar showing how much of a known amount of work is done, or that work is under way. */
export declare function ProgressBar({ label, shape, showValueLabel, size, ...rest }: ProgressBarProps): import("react").JSX.Element;
/**
 * A busy indicator for unmeasured work too small for a bar. Without `label` it is decorative, such
 * as the start of a busy line whose text carries the status; with one it stands alone as an
 * indeterminate progress bar named by the label.
 */
export declare function Spinner({ size, label, className, ...rest }: SpinnerProps): import("react").JSX.Element;
export { resolveMeterTone } from './progress-meter.js';
//# sourceMappingURL=progress-bar.d.ts.map