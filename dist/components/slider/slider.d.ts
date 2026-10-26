import { type SliderFieldProps } from './slider-parts.js';
export interface SliderProps extends SliderFieldProps<number> {
    /** The value the fill starts from, so a slider around zero fills from 0. Defaults to the minimum. */
    fillOffset?: number | undefined;
}
/**
 * A field for a number picked along a track, on React Aria's `Slider`: a thumb that moves with the
 * pointer and the arrow, Page and Home and End keys, a fill, optional marks and a value output,
 * with the field's label, description, validation, dirty state, undo and menu. Each drag or key
 * press commits.
 */
export declare function Slider({ marks, valueLabel, size, fillOffset, ...props }: SliderProps): import("react").JSX.Element;
export { RangeSlider, keepThumbsApart } from './range-slider.js';
export type { RangeSliderProps, RangeValue } from './range-slider.js';
export type { SliderFieldProps, SliderMark, SliderSize, SliderValueLabel } from './slider-parts.js';
//# sourceMappingURL=slider.d.ts.map