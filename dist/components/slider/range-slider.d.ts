import { type SliderFieldProps } from './slider-parts.js';
/** The start and the end of a range. */
export type RangeValue = [number, number];
export interface RangeSliderProps extends SliderFieldProps<RangeValue> {
    /** How many steps the thumbs keep between them. Defaults to 0: they may meet but never cross. */
    minStepsBetweenThumbs?: number | undefined;
}
/**
 * The range after a thumb moved, keeping the thumbs `distance` apart: the thumb that moved stops
 * that far from the other, within the bounds. A change that moves both thumbs is kept as it is.
 * Thumbs already closer than `distance` never jump apart: a move that brings them closer is
 * refused, and one that moves them apart is kept.
 */
export declare function keepThumbsApart(next: RangeValue, previous: RangeValue, bounds: {
    distance: number;
    minValue: number;
    maxValue: number;
}): RangeValue;
/**
 * A field for a range picked along a track, on React Aria's `Slider` with two thumbs: the start and
 * the end, which never cross and keep `minStepsBetweenThumbs` steps between them. It shares the
 * slider's parts (fill between the thumbs, marks, value output) and field behaviour.
 */
export declare function RangeSlider({ marks, valueLabel, size, minStepsBetweenThumbs, ...props }: RangeSliderProps): import("react").JSX.Element;
//# sourceMappingURL=range-slider.d.ts.map