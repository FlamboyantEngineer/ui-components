import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Field, useFieldControl } from '../field/field.js';
import { SliderControl, sliderHooks, type SliderFieldProps } from './slider-parts.js';

/** The start and the end of a range. */
export type RangeValue = [number, number];

export interface RangeSliderProps extends SliderFieldProps<RangeValue> {
  /** How many steps the thumbs keep between them. Defaults to 0: they may meet but never cross. */
  minStepsBetweenThumbs?: number | undefined;
}

const hooks = createHooks('range-slider');

/**
 * The range after a thumb moved, keeping the thumbs `distance` apart: the thumb that moved stops
 * that far from the other, within the bounds. A change that moves both thumbs is kept as it is.
 * Thumbs already closer than `distance` never jump apart: a move that brings them closer is
 * refused, and one that moves them apart is kept.
 */
export function keepThumbsApart(
  next: RangeValue,
  previous: RangeValue,
  bounds: { distance: number; minValue: number; maxValue: number },
): RangeValue {
  const [start, end] = next;
  const gap = end - start;
  const movedStart = start !== previous[0];
  if (gap >= bounds.distance || movedStart === (end !== previous[1])) return next;
  const previousGap = previous[1] - previous[0];
  if (previousGap < bounds.distance) return gap >= previousGap ? next : previous;
  return movedStart
    ? [Math.max(bounds.minValue, end - bounds.distance), end]
    : [start, Math.min(bounds.maxValue, start + bounds.distance)];
}

/**
 * A field for a range picked along a track, on React Aria's `Slider` with two thumbs: the start and
 * the end, which never cross and keep `minStepsBetweenThumbs` steps between them. It shares the
 * slider's parts (fill between the thumbs, marks, value output) and field behaviour.
 */
export function RangeSlider({
  marks = [],
  valueLabel = 'output',
  size = 'md',
  minStepsBetweenThumbs = 0,
  ...props
}: RangeSliderProps) {
  const strings = useUiStrings();
  const { minValue = 0, maxValue = 100, step = 1 } = props;
  const { state, field, rest } = useFieldControl(props, {
    initialValue: [minValue, maxValue] as RangeValue,
  });
  const bounds = { distance: minStepsBetweenThumbs * step, minValue, maxValue };
  return (
    <Field
      {...field}
      {...hooks.root({
        className: mergeClassNames(sliderHooks.className, field.className),
        data: { valueLabel },
      })}
      size={size}
      state={state}
    >
      {(control) => (
        <SliderControl
          state={state}
          control={control}
          label={field.label}
          rest={rest}
          marks={marks}
          valueLabel={valueLabel}
          thumbLabels={[strings.rangeMinimum, strings.rangeMaximum]}
          normalize={(next, previous) => keepThumbsApart(next, previous, bounds)}
        />
      )}
    </Field>
  );
}
