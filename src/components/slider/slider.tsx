'use client';

import { Field, useFieldControl } from '../field/field.js';
import { SliderControl, sliderHooks as hooks, type SliderFieldProps } from './slider-parts.js';

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
export function Slider({
  marks = [],
  valueLabel = 'output',
  size = 'md',
  fillOffset,
  ...props
}: SliderProps) {
  const { state, field, rest } = useFieldControl(props, { initialValue: props.minValue ?? 0 });
  return (
    <Field
      {...field}
      {...hooks.root({ className: field.className, data: { valueLabel } })}
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
          fillOffset={fillOffset}
          thumbLabels={[undefined]}
        />
      )}
    </Field>
  );
}

export { RangeSlider, keepThumbsApart } from './range-slider.js';
export type { RangeSliderProps, RangeValue } from './range-slider.js';
export type { SliderFieldProps, SliderMark, SliderSize, SliderValueLabel } from './slider-parts.js';
