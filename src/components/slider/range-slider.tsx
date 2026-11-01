'use client';

import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Field, type FieldErrorSource } from '../field/field.js';
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

export interface RangeSliderProps extends Omit<SliderFieldProps<RangeValue>, 'name'> {
  /** The form name of the start. */
  startName?: string | undefined;
  /** The form name of the end. */
  endName?: string | undefined;
  /** How many steps the thumbs keep between them. Defaults to 0: they may meet but never cross. */
  minStepsBetweenThumbs?: number | undefined;
}

const hooks = createHooks('range-slider');

/**
 * The error sources of the ends: errors an enclosing form gives under `startName` or `endName` belong
 * to the field and clear once that end changes.
 */
function toEndErrorSources({
  startName,
  endName,
}: RangeSliderProps): FieldErrorSource<RangeValue>[] {
  return [
    { name: startName, select: ([start]) => start },
    { name: endName, select: ([, end]) => end },
  ];
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
  const { minValue = 0, maxValue = 100 } = props;
  const { state, field, rest, grid } = useSliderField(
    props,
    [minValue, maxValue] as RangeValue,
    toEndErrorSources(props),
  );
  const { startName, endName, ...own } = rest;
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
          rest={own}
          marks={marks}
          valueLabel={valueLabel}
          thumbLabels={[strings.rangeMinimum, strings.rangeMaximum]}
          thumbNames={[startName, endName]}
          // Spacing can leave the grid by binary noise (`0.3 - 0.1`), so its result is snapped.
          normalize={(next, previous) =>
            normalizeSliderValue(keepThumbsApart(next, previous, bounds), grid)
          }
        />
      )}
    </Field>
  );
}
