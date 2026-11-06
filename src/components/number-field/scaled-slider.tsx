'use client';

import { type ReactNode, useRef } from 'react';
import type { HookProps } from '../../core/hooks.js';
import type { Orientation } from '../../core/props.js';
import {
  SliderOutputContext,
  type SliderState,
  SliderStateContext,
  SliderTrackContext,
  useNumberFormatter,
  useSlider,
  useSliderState,
} from '../../primitives/index.js';
import { clamp } from '../../utils/clamp.js';
import { type NumberSliderScale, toTrackPercent } from './slider-scale.js';
import { type SliderGrid, snapToStep } from './slider-values.js';

// A Page key moves a thumb a tenth of the track.
const pageDistance = 0.1;

/**
 * The slider state with its track geometry in the scale's positions: the thumbs, the fill, a press
 * on the track and a drag place values by position, and the Page keys move a tenth of the track
 * (at least one step). The values, the arrow keys (one `step`) and Home and End stay the state's.
 */
function toScaledSliderState(
  state: SliderState,
  scale: NumberSliderScale,
  grid: SliderGrid,
): SliderState {
  const toPercent = (value: number) => toTrackPercent(value, scale, grid);
  const toValue = (percent: number) => snapToStep(scale.toValue(clamp(percent, 0, 1), grid), grid);
  const page = (index: number, direction: 1 | -1) => {
    const value = state.values[index] ?? grid.minValue;
    const target = toValue(toPercent(value) + direction * pageDistance);
    const atLeastStep = value + direction * grid.step;
    state.setThumbValue(
      index,
      direction > 0 ? Math.max(target, atLeastStep) : Math.min(target, atLeastStep),
    );
  };
  return {
    ...state,
    getValuePercent: toPercent,
    getThumbPercent: (index) => toPercent(state.values[index] ?? grid.minValue),
    getPercentValue: toValue,
    setThumbPercent: (index, percent) => {
      state.setThumbValue(index, toValue(percent));
    },
    incrementThumb: (index, stepSize = 1) => {
      if (stepSize > grid.step) page(index, 1);
      else state.incrementThumb(index, stepSize);
    },
    decrementThumb: (index, stepSize = 1) => {
      if (stepSize > grid.step) page(index, -1);
      else state.decrementThumb(index, stepSize);
    },
  };
}

/** The props of a slider on a scale: React Aria's slider props, in values. */
export interface ScaledSliderProps<T extends number | number[]> {
  /** The slot hooks of the slider's group. */
  slot: HookProps;
  scale: NumberSliderScale;
  id: string | undefined;
  'aria-label': string;
  'aria-describedby': string | undefined;
  'aria-details'?: string | undefined;
  value: T;
  minValue: number;
  maxValue: number;
  step: number;
  orientation?: Orientation | undefined;
  formatOptions?: Intl.NumberFormatOptions | undefined;
  isDisabled?: boolean | undefined;
  onChange: (value: T) => void;
  onChangeEnd: (value: T) => void;
  /** The output, the track and its thumbs, React Aria's slider parts. */
  children: ReactNode;
}

/**
 * React Aria's slider on a scale (UIC-NUMBER-FIELD-5.9): its state and group, with the thumbs,
 * fill, track presses and drags placed by the scale's positions. The parts inside are React Aria's
 * own, reading the scaled state, so they keep their behaviour, ARIA and render states.
 */
export function ScaledSlider<T extends number | number[]>({
  slot,
  scale,
  children,
  formatOptions,
  ...props
}: ScaledSliderProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const numberFormatter = useNumberFormatter(formatOptions);
  const state = useSliderState({ ...props, numberFormatter });
  const scaled = toScaledSliderState(state, scale, props);
  const { groupProps, trackProps, outputProps } = useSlider(props, scaled, trackRef);
  return (
    <SliderStateContext value={scaled}>
      <SliderTrackContext value={{ ...trackProps, ref: trackRef }}>
        <SliderOutputContext value={outputProps}>
          <div
            {...groupProps}
            {...slot}
            data-orientation={scaled.orientation}
            data-disabled={scaled.isDisabled || undefined}
          >
            {children}
          </div>
        </SliderOutputContext>
      </SliderTrackContext>
    </SliderStateContext>
  );
}
