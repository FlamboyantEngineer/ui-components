'use client';

import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Field, useFieldControl } from '../field/field.js';
import { SliderControl, sliderHooks, type SliderFieldProps } from './slider-parts.js';
import { keepThumbsApart } from './thumb-spacing.js';

/** The start and the end of a range. */
export type RangeValue = [number, number];

export interface RangeSliderProps extends SliderFieldProps<RangeValue> {
  /** How many steps the thumbs keep between them. Defaults to 0: they may meet but never cross. */
  minStepsBetweenThumbs?: number | undefined;
}

const hooks = createHooks('range-slider');

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
