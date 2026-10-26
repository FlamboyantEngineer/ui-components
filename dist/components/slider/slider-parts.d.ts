import { type ReactNode } from 'react';
import type { Orientation, Size } from '../../core/props.js';
import type { FieldControlProps, FieldInputProps, FieldState } from '../field/field.js';
export type SliderSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
/** Where the value shows: in an output beside the track, in a label on each thumb, or nowhere. */
export type SliderValueLabel = 'output' | 'thumb' | 'none';
export interface SliderMark {
    /** Where the mark sits on the track. */
    value: number;
    /** Text drawn at the mark; a mark without one draws only its tick. */
    label?: ReactNode;
}
/**
 * The props `Slider` and `RangeSlider` share: the field's props (a slider always holds a value, so
 * it is never required and never cleared) and the range, step, orientation and format.
 */
export interface SliderFieldProps<T> extends Omit<FieldInputProps<T>, 'isRequired' | 'emptyValue'> {
    /** The lowest value. Defaults to 0. */
    minValue?: number | undefined;
    /** The highest value. Defaults to 100. */
    maxValue?: number | undefined;
    /** The step between values. Defaults to 1. */
    step?: number | undefined;
    /** The track's axis. Defaults to `horizontal`. */
    orientation?: Orientation | undefined;
    /** How the value is formatted in the locale, in the output and each thumb's value text. */
    formatOptions?: Intl.NumberFormatOptions | undefined;
    /** The id of an element with details about the slider. */
    'aria-details'?: string | undefined;
    /** Called with the value when a drag or a key press that moves a thumb ends. */
    onChangeEnd?: ((value: T) => void) | undefined;
    /** Marks along the track, each with an optional label. */
    marks?: readonly SliderMark[] | undefined;
    /** Where the value shows. Defaults to `output`. */
    valueLabel?: SliderValueLabel | undefined;
    /** Track and thumb size. Defaults to `md`. */
    size?: SliderSize | undefined;
}
type SliderValue = number | [number, number];
/** The props `SliderControl` passes on to the slider and its thumbs. */
export type SliderOwnProps<T> = Pick<SliderFieldProps<T>, 'name' | 'onChangeEnd' | 'minValue' | 'maxValue' | 'step' | 'orientation' | 'formatOptions' | 'aria-details'>;
export interface SliderControlProps<T extends SliderValue> {
    state: FieldState<T>;
    control: FieldControlProps;
    /** The field label. It names the group, and each thumb with the thumb's own name before it. */
    label: string;
    rest: SliderOwnProps<T>;
    marks: readonly SliderMark[];
    valueLabel: SliderValueLabel;
    /** The value the fill starts from, for a single thumb. */
    fillOffset?: number | undefined;
    /** Each thumb's own name, read before the label; a single thumb has none. */
    thumbLabels: readonly (string | undefined)[];
    /** Adjusts a new value against the previous one before the field takes it. */
    normalize?: ((next: T, previous: T) => T) | undefined;
}
export declare const sliderHooks: import("../../core/hooks.js").ComponentHooks<"mark" | "output" | "track" | "fill" | "box" | "thumb" | "mark-label" | "thumb-label">;
/**
 * A slider's group on React Aria's `Slider`: the value output, the track with its fill and marks,
 * and one thumb per value. The value lives in the field state; each drag or key press commits.
 */
export declare function SliderControl<T extends SliderValue>({ state, control, label, rest, marks, valueLabel, fillOffset, thumbLabels, normalize, }: SliderControlProps<T>): import("react").JSX.Element;
export {};
//# sourceMappingURL=slider-parts.d.ts.map