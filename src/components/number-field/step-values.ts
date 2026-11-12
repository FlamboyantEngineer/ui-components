import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import type { StepperPressProps } from './number-field-parts.js';

/** The preset values a number field steps through, and the range that bounds them. */
export interface StepValueList {
  values: readonly number[];
  minValue?: number | undefined;
  maxValue?: number | undefined;
}

// Tolerates the binary rounding of decimal presets (0.1 + 0.2).
const valueTolerance = 1e-9;

/** The finite presets within the range, in ascending order. */
function toSortedValues({ values, minValue, maxValue }: StepValueList): number[] {
  const minimum = minValue ?? -Infinity;
  const maximum = maxValue ?? Infinity;
  return values
    .filter((value) => Number.isFinite(value) && value >= minimum && value <= maximum)
    .sort((first, second) => first - second);
}

/**
 * The preset after `value` (`direction` 1) or before it (-1), or `null` when none lies that way.
 * A value between presets moves to the nearest one in that direction; an empty value moves to the
 * first preset going up and to the last going down.
 */
export function findStepValue(
  value: number | null,
  direction: 1 | -1,
  list: StepValueList,
): number | null {
  const sorted = toSortedValues(list);
  if (value === null) return (direction === 1 ? sorted[0] : sorted.at(-1)) ?? null;
  const next =
    direction === 1
      ? sorted.find((preset) => preset > value + valueTolerance)
      : sorted.findLast((preset) => preset < value - valueTolerance);
  return next ?? null;
}

interface PressEventLike {
  shiftKey: boolean;
  altKey: boolean;
  preventDefault(): void;
  stopPropagation(): void;
}

const isModified = (event: PressEventLike) => event.shiftKey || event.altKey;

/**
 * Capture handlers that take a step button's plain press from React Aria, which would step by
 * `step`, and step to the next preset instead through `onStep`, once per press. Presses with Shift
 * or Alt go to `modified`, the larger and smaller steps' handlers (`toModifiedPressProps`).
 */
export function toStepValuePressProps(onStep: () => void, modified: StepperPressProps) {
  const take = (event: PressEventLike) => {
    event.preventDefault();
    event.stopPropagation();
    onStep();
  };
  const block = (event: PressEventLike) => {
    event.preventDefault();
    event.stopPropagation();
  };
  const isPressKey = (event: KeyboardEvent<HTMLButtonElement>) =>
    event.key === 'Enter' || event.key === ' ';
  return {
    onPointerDownCapture: (event: PointerEvent<HTMLButtonElement>) => {
      if (isModified(event)) modified.onPointerDownCapture(event);
      else if (event.button === 0) take(event);
    },
    // Keeps focus where it was, as React Aria's steppers do.
    onMouseDownCapture: (event: MouseEvent<HTMLButtonElement>) => {
      if (event.button === 0) event.preventDefault();
    },
    onClickCapture: (event: PressEventLike) => {
      if (isModified(event)) modified.onClickCapture(event);
      else block(event);
    },
    onKeyDownCapture: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (isModified(event)) modified.onKeyDownCapture(event);
      else if (isPressKey(event)) take(event);
    },
    onKeyUpCapture: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (isModified(event)) modified.onKeyUpCapture(event);
      else if (isPressKey(event)) block(event);
    },
  };
}
