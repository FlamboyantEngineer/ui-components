'use client';

import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Field } from '../field/field.js';
import {
  SliderControl,
  sliderHooks,
  useSliderField,
  type SliderFieldProps,
} from './slider-parts.js';
import { normalizeSliderValue } from './slider-values.js';
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
  const { minValue = 0, maxValue = 100 } = props;
  const { state, field, rest, grid } = useSliderField(props, [minValue, maxValue] as RangeValue);
  const bounds = { ...grid, distance: minStepsBetweenThumbs * grid.step };
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
          // Spacing can leave the grid by binary noise (`0.3 - 0.1`), so its result is snapped.
          normalize={(next, previous) =>
            normalizeSliderValue(keepThumbsApart(next, previous, bounds), grid)
          }
        />
      )}
    </Field>
  );
}
