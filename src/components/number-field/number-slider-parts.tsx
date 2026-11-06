'use client';

import { type ReactNode, type RefObject, useLayoutEffect } from 'react';
import type { Orientation } from '../../core/props.js';
import {
  Slider as AriaSlider,
  SliderFill,
  SliderOutput,
  SliderThumb,
  SliderTrack,
  useObjectRef,
} from '../../primitives/index.js';
import { clamp } from '../../utils/clamp.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useLatest } from '../../utils/use-latest.js';
import {
  type FieldControlProps,
  type FieldErrorSource,
  type FieldInputProps,
  type FieldState,
  isFieldValueEqual,
  toAriaControlProps,
  useFieldControl,
} from '../field/field.js';
import { numberFieldHooks } from './number-field-parts.js';
import { ScaledSlider } from './scaled-slider.js';
import {
  type NumberSliderScaleOption,
  resolveSliderScale,
  toTrackPercent,
} from './slider-scale.js';
import { normalizeSliderValue, type SliderGrid } from './slider-values.js';

/**
 * Where a slider shows its value: in an output beside the track, in a number input per thumb that
 * edits it, in a label on each thumb, or nowhere.
 */
export type NumberFieldValueLabel = 'output' | 'input' | 'thumb' | 'none';

export interface NumberFieldMark {
  /** Where the mark sits on the track. */
  value: number;
  /** Text drawn at the mark; a mark without one draws only its tick. */
  label?: ReactNode;
}

/**
 * The props the slider display of a number and of a range share: the field's props (a slider
 * always holds a value, so it is never required and never cleared) and the range, step,
 * orientation and format.
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
  marks?: readonly NumberFieldMark[] | undefined;
  /** Where the value shows. Defaults to `output`. */
  valueLabel?: NumberFieldValueLabel | undefined;
  /** How values lie along the track. Defaults to `linear`. */
  scale?: NumberSliderScaleOption | undefined;
}

type SliderValue = number | [number, number];

/**
 * The field of a slider whose value is always on its grid (UIC-NUMBER-FIELD-5.2): a given value, default
 * or committed value is held snapped into the bounds and steps, a range in order, and a given or
 * held value off the grid (as the bounds or step change) moves onto it, reporting the change.
 */
export function useSliderField<T extends SliderValue, P extends SliderFieldProps<T>>(
  props: P,
  initialValue: T,
  errorSources?: readonly FieldErrorSource<T>[],
) {
  const grid: SliderGrid = {
    minValue: props.minValue ?? 0,
    maxValue: props.maxValue ?? 100,
    step: props.step ?? 1,
  };
  const normalize = (value: T | undefined) =>
    value === undefined ? undefined : normalizeSliderValue(value, grid);
  const own = {
    ...props,
    value: normalize(props.value),
    defaultValue: normalize(props.defaultValue),
    committedValue: normalize(props.committedValue),
  };
  const control = useFieldControl<T, P>(own, {
    initialValue: normalizeSliderValue(initialValue, grid),
    errorSources,
  });
  // The value the owner or the field holds, before it is snapped.
  const held = props.value ?? control.state.value;
  const settled = normalizeSliderValue(held, grid);
  const { setValue } = control.state;
  useLayoutEffect(() => {
    if (!isFieldValueEqual(settled, held)) setValue(settled);
  });
  return { ...control, grid };
}

/** The props `SliderControl` passes on to the slider and its thumbs. */
export type SliderOwnProps<T> = Pick<
  SliderFieldProps<T>,
  | 'onChangeEnd'
  | 'minValue'
  | 'maxValue'
  | 'step'
  | 'orientation'
  | 'formatOptions'
  | 'aria-details'
  | 'scale'
>;

interface SliderControlProps<T extends SliderValue> {
  state: FieldState<T>;
  control: FieldControlProps;
  /** The field label. It names the group, and each thumb with the thumb's own name before it. */
  label: string;
  rest: SliderOwnProps<T>;
  marks: readonly NumberFieldMark[];
  valueLabel: NumberFieldValueLabel;
  /** The value the fill starts from, for a single thumb. */
  fillOffset?: number | undefined;
  /** Each thumb's own name, read before the label; a single thumb has none. */
  thumbLabels: readonly (string | undefined)[];
  /** The form name each thumb submits its value under. */
  thumbNames: readonly (string | undefined)[];
  /** Adjusts a new value against the previous one before the field takes it. */
  normalize?: ((next: T, previous: T) => T) | undefined;
}

interface TrackBounds {
  /** A value's position along the track, from 0 to 1. */
  toPercent: (value: number) => number;
  isVertical: boolean;
  /** The filled part of the track, from its low to its high value. */
  low: number;
  high: number;
}

const hooks = numberFieldHooks;

function toValues(value: SliderValue): number[] {
  return Array.isArray(value) ? value : [value];
}

/** The filled part of the track: between the thumbs of a range, else between the offset and the value. */
function resolveFill(
  values: number[],
  bounds: { minValue: number; maxValue: number; offset?: number | undefined },
) {
  if (values.length > 1) return { low: values[0] ?? 0, high: values.at(-1) ?? 0 };
  const origin = clamp(bounds.offset ?? bounds.minValue, bounds.minValue, bounds.maxValue);
  const value = values[0] ?? origin;
  return { low: Math.min(origin, value), high: Math.max(origin, value) };
}

function Mark({ mark, bounds }: { mark: NumberFieldMark; bounds: TrackBounds }) {
  const percent = `${bounds.toPercent(mark.value) * 100}%`;
  const isInRange = mark.value >= bounds.low && mark.value <= bounds.high;
  return (
    <span
      {...hooks.slot('mark', { inRange: isInRange })}
      aria-hidden="true"
      style={
        bounds.isVertical
          ? { position: 'absolute', bottom: percent }
          : { position: 'absolute', insetInlineStart: percent }
      }
    >
      {!isEmptyNode(mark.label) ? <span {...hooks.slot('mark-label')}>{mark.label}</span> : null}
    </span>
  );
}

interface SliderPartsProps extends Pick<
  SliderControlProps<SliderValue>,
  'marks' | 'valueLabel' | 'fillOffset' | 'thumbLabels' | 'thumbNames'
> {
  /** The number of thumbs. */
  count: number;
  bounds: TrackBounds;
  /** Receives the first thumb's input, the field's control. */
  inputRef: RefObject<HTMLInputElement | null>;
  field: ReturnType<typeof toAriaControlProps>;
}

/** The slider's parts: the value output, the track with its fill and marks, and the thumbs. */
function SliderParts({
  count,
  marks,
  bounds,
  valueLabel,
  fillOffset,
  thumbLabels,
  thumbNames,
  inputRef,
  field,
}: SliderPartsProps) {
  return (
    <>
      {valueLabel === 'output' ? <SliderOutput {...hooks.slot('output')} /> : null}
      <SliderTrack {...hooks.slot('track')}>
        <SliderFill {...hooks.slot('fill')} offset={fillOffset} />
        {marks.map((mark) => (
          <Mark key={mark.value} mark={mark} bounds={bounds} />
        ))}
        {Array.from({ length: count }, (_, index) => (
          <SliderThumb
            key={index}
            {...hooks.slot('thumb')}
            index={index}
            name={thumbNames[index]}
            aria-label={thumbLabels[index]}
            inputRef={index === 0 ? inputRef : undefined}
            // React Aria reports a thumb invalid only through this deprecated prop.
            isInvalid={field.isInvalid}
            aria-errormessage={field['aria-errormessage']}
          >
            {valueLabel === 'thumb'
              ? ({ state: thumb }) => (
                  <span {...hooks.slot('thumb-label')} aria-hidden="true">
                    {thumb.getThumbValueLabel(index)}
                  </span>
                )
              : null}
          </SliderThumb>
        ))}
      </SliderTrack>
    </>
  );
}

/**
 * A slider's group on React Aria's `Slider`, or on a `ScaledSlider` for a non-linear `scale`: the
 * value output, the track with its fill and marks, and one thumb per value. The value lives in the
 * field state; each drag or key press commits.
 */
export function SliderControl<T extends SliderValue>({
  state,
  control,
  label,
  rest,
  marks,
  valueLabel,
  fillOffset,
  thumbLabels,
  thumbNames,
  normalize = (next) => next,
}: SliderControlProps<T>) {
  const { onChangeEnd, scale: scaleOption, ...aria } = rest;
  const inputRef = useObjectRef<HTMLInputElement>(control.ref);
  // The value set during this interaction; the field state's value is the last render's.
  const valueRef = useLatest(state.value);
  const isLocked = state.isReadOnly || state.isDisabled;
  const grid = {
    minValue: aria.minValue ?? 0,
    maxValue: aria.maxValue ?? 100,
    step: aria.step ?? 1,
  };
  const scale = resolveSliderScale(scaleOption, grid);
  const values = toValues(state.value);
  const bounds: TrackBounds = {
    toPercent: (value: number) => toTrackPercent(value, scale, grid),
    isVertical: aria.orientation === 'vertical',
    ...resolveFill(values, { ...grid, offset: fillOffset }),
  };
  // The slider takes the id, description and lock; each thumb reports the field's error.
  const field = toAriaControlProps(control);
  const slider = {
    ...aria,
    ...grid,
    id: field.id,
    // The group carries the label text: React Aria names each thumb after the group's own name.
    'aria-label': label,
    'aria-describedby': field['aria-describedby'],
    isDisabled: field.isDisabled,
    value: state.value,
    onChange: (next: T) => {
      if (isLocked) return;
      valueRef.current = normalize(next, valueRef.current);
      state.setValue(valueRef.current);
    },
    onChangeEnd: () => {
      if (isLocked) return;
      state.commit();
      onChangeEnd?.(valueRef.current);
    },
  };
  const parts = (
    <SliderParts
      {...{ marks, bounds, valueLabel, fillOffset, thumbLabels, thumbNames, inputRef, field }}
      count={values.length}
    />
  );
  return scale ? (
    <ScaledSlider<T> {...slider} slot={hooks.slot('slider')} scale={scale}>
      {parts}
    </ScaledSlider>
  ) : (
    <AriaSlider<T> {...slider} {...hooks.slot('slider')}>
      {parts}
    </AriaSlider>
  );
}
