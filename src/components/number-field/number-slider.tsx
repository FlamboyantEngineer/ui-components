'use client';

import type { ReactNode } from 'react';
import { useUiStrings } from '../../core/provider.js';
import type { Orientation } from '../../core/props.js';
import {
  Field,
  type FieldControlProps,
  type FieldErrorSource,
  type FieldState,
} from '../field/field.js';
import { NumberEndpoints } from './number-endpoints.js';
import { numberFieldHooks as hooks } from './number-field-parts.js';
import {
  SliderControl,
  useSliderField,
  type NumberFieldMark,
  type NumberFieldValueLabel,
  type SliderFieldProps,
  type SliderOwnProps,
} from './number-slider-parts.js';
import { normalizeSliderValue, type SliderGrid } from './slider-values.js';
import { keepThumbsApart } from './thumb-spacing.js';

/** The start and the end of a range. */
export type NumberRange = [number, number];

/** How a number field draws its value: a number input, or a track with a thumb per value. */
export type NumberFieldDisplay = 'field' | 'slider';

/** The track props a slider display adds, for a number or a range. */
export interface NumberTrackProps<T> {
  /** The track's axis. Defaults to `horizontal`. */
  orientation?: Orientation | undefined;
  /** Marks along the track, each with an optional label. */
  marks?: readonly NumberFieldMark[] | undefined;
  /** Where the slider shows the value. Defaults to `output`. */
  valueLabel?: NumberFieldValueLabel | undefined;
  /** Called with the value when a drag or a key press that moves a thumb ends. */
  onChangeEnd?: ((value: T) => void) | undefined;
  /** The id of an element with details about the slider. */
  'aria-details'?: string | undefined;
}

/** The props of a range number field (`range`). */
export interface NumberRangeFieldProps
  extends
    Omit<SliderFieldProps<NumberRange>, 'name' | keyof NumberTrackProps<NumberRange>>,
    NumberTrackProps<NumberRange> {
  /** Holds a range, a start and an end, instead of a number. */
  range: true;
  /** A start and an end input (`field`, the default), or a track with two thumbs (`slider`). */
  display?: NumberFieldDisplay | undefined;
  /** The form name of the start. */
  startName?: string | undefined;
  /** The form name of the end. */
  endName?: string | undefined;
  /** How many steps the ends keep between them. Defaults to 0: they may meet but never cross. */
  minStepsBetweenThumbs?: number | undefined;
}

/** What a slider display's field passes on to its control. */
interface SliderDisplay<T extends number | NumberRange> {
  state: FieldState<T>;
  control: FieldControlProps;
  label: string;
  grid: SliderGrid;
  rest: SliderOwnProps<T>;
  marks: readonly NumberFieldMark[];
  valueLabel: NumberFieldValueLabel;
  fillOffset?: number | undefined;
  endLabels: readonly (string | undefined)[];
  names: readonly (string | undefined)[];
  normalize: (next: T, previous: T) => T;
}

/**
 * A slider, with a number input per thumb before its track for `valueLabel="input"`: the inputs
 * then edit the value and the thumbs submit it.
 */
function SliderWithInputs<T extends number | NumberRange>(display: SliderDisplay<T>): ReactNode {
  const { state, control, label, grid, rest, marks, valueLabel, endLabels, names } = display;
  const { formatOptions, minValue: _min, maxValue: _max, step: _step, ...slider } = rest;
  return (
    <>
      {valueLabel === 'input' ? (
        <NumberEndpoints
          state={state}
          control={control}
          ownsControl={false}
          label={label}
          endLabels={endLabels}
          names={[]}
          rules={grid}
          formatOptions={formatOptions}
          normalize={display.normalize}
        />
      ) : null}
      <SliderControl
        state={state}
        control={control}
        label={label}
        rest={{ ...slider, ...grid, formatOptions }}
        marks={marks}
        valueLabel={valueLabel}
        fillOffset={display.fillOffset}
        thumbLabels={endLabels}
        thumbNames={names}
        normalize={display.normalize}
      />
    </>
  );
}

/** The error sources of the ends: form errors under `startName` or `endName` clear as that end changes. */
function toEndErrorSources({
  startName,
  endName,
}: Pick<NumberRangeFieldProps, 'startName' | 'endName'>): FieldErrorSource<NumberRange>[] {
  return [
    { name: startName, select: ([start]) => start },
    { name: endName, select: ([, end]) => end },
  ];
}

/**
 * A number field for a range: a start and an end that never cross and keep
 * `minStepsBetweenThumbs` steps apart, typed into two inputs or picked with two thumbs on a track.
 */
export function NumberRangeField({
  range: _range,
  display = 'field',
  marks = [],
  valueLabel = 'output',
  size = 'md',
  minStepsBetweenThumbs = 0,
  ...props
}: NumberRangeFieldProps) {
  const strings = useUiStrings();
  const { minValue = 0, maxValue = 100 } = props;
  const { state, field, rest, grid } = useSliderField(
    props,
    [minValue, maxValue] as NumberRange,
    toEndErrorSources(props),
  );
  const { startName, endName, ...own } = rest;
  const bounds = { ...grid, distance: minStepsBetweenThumbs * grid.step };
  // Spacing can leave the grid by binary noise (`0.3 - 0.1`), so its result is snapped.
  const normalize = (next: NumberRange, previous: NumberRange) =>
    normalizeSliderValue(keepThumbsApart(next, previous, bounds), grid);
  const endLabels = [strings.rangeMinimum, strings.rangeMaximum];
  const isSlider = display === 'slider';
  const data = {
    display: isSlider ? 'slider' : undefined,
    range: true,
    valueLabel: isSlider ? valueLabel : undefined,
  };
  return (
    <Field
      {...field}
      {...hooks.root({ className: field.className, data })}
      size={size}
      state={state}
    >
      {(control) =>
        display === 'slider' ? (
          <SliderWithInputs
            state={state}
            control={control}
            label={field.label}
            grid={grid}
            rest={own}
            marks={marks}
            valueLabel={valueLabel}
            endLabels={endLabels}
            names={[startName, endName]}
            normalize={normalize}
          />
        ) : (
          <NumberEndpoints
            state={state}
            control={control}
            ownsControl
            label={field.label}
            endLabels={endLabels}
            names={[startName, endName]}
            rules={grid}
            formatOptions={own.formatOptions}
            normalize={normalize}
          />
        )
      }
    </Field>
  );
}

/** The props of a single number's slider display. */
export interface NumberSliderFieldProps
  extends Omit<SliderFieldProps<number>, keyof NumberTrackProps<number>>, NumberTrackProps<number> {
  /** Holds a range with `true` (`NumberRangeFieldProps`); a single number otherwise. */
  range?: false | undefined;
  /** Draws the number on a track with a thumb. A slider always holds a value: it is never empty. */
  display: 'slider';
  /** The value the fill starts from, so a slider around zero fills from 0. Defaults to the minimum. */
  fillOffset?: number | undefined;
}

/**
 * A number picked along a track: a thumb that moves with the pointer and the arrow, Page, Home and
 * End keys, a fill, optional marks and the value in an output, inputs or thumb labels. Each drag or
 * key press commits.
 */
export function NumberSliderField({
  range: _range,
  display: _display,
  marks = [],
  valueLabel = 'output',
  size = 'md',
  fillOffset,
  ...props
}: NumberSliderFieldProps) {
  const { state, field, rest, grid } = useSliderField(props, props.minValue ?? 0);
  const { name, ...own } = rest;
  const data = { display: 'slider', valueLabel };
  return (
    <Field
      {...field}
      {...hooks.root({ className: field.className, data })}
      size={size}
      state={state}
    >
      {(control) => (
        <SliderWithInputs
          state={state}
          control={control}
          label={field.label}
          grid={grid}
          rest={own}
          marks={marks}
          valueLabel={valueLabel}
          fillOffset={fillOffset}
          endLabels={[undefined]}
          names={[name]}
          normalize={(next) => normalizeSliderValue(next, grid)}
        />
      )}
    </Field>
  );
}
