'use client';

import { type KeyboardEvent, useMemo, useRef } from 'react';
import { Group, Input, NumberField as AriaNumberField } from '../../primitives/index.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import {
  type FieldControlProps,
  type FieldState,
  toAriaControlProps,
  useFieldFormOwner,
} from '../field/field.js';
import type {
  NumberControlConfig,
  NumberEntryFieldProps,
  NumberFieldCommitBehavior,
} from './number-field.js';
import {
  addStep,
  createModifierStepHandler,
  NumberAdornment,
  numberFieldHooks as hooks,
  NumberScrubber,
  type NumberSteps,
  NumberValue,
  Stepper,
  toModifiedPressProps,
} from './number-field-parts.js';
import { snapNumberValue } from './snap-number-value.js';
import { findStepValue, toSortedStepValues, toStepValuePressProps } from './step-values.js';

interface DecimalControlProps {
  state: FieldState<number | null>;
  control: FieldControlProps;
  config: NumberControlConfig;
  steps: NumberSteps;
}
/** What the input reads from React Aria's number field state: the parsed number and its commit. */
interface NumberInputState {
  numberValue: number;
  commit(): void;
}

interface NumberEntryOptions {
  commitBehavior: NumberFieldCommitBehavior;
  bounds: Pick<NumberEntryFieldProps, 'minValue' | 'maxValue' | 'step'>;
  steps: NumberSteps;
  /** The presets the plain steps move through, sorted (`toSortedStepValues`), when the field has any. */
  presets: readonly number[] | undefined;
}

const presetArrows: Readonly<Record<string, 1 | -1>> = { ArrowUp: 1, ArrowDown: -1 };

function hasModifierKey(event: KeyboardEvent): boolean {
  return event.shiftKey || event.altKey || event.ctrlKey || event.metaKey;
}

/** The number the input shows: its typed text as React Aria parses it, or `null` while empty. */
function toDraft(input: NumberInputState): number | null {
  return Number.isNaN(input.numberValue) ? null : input.numberValue;
}

/**
 * Takes React Aria's commits into the field, snapped or kept, and commits them, except while the
 * typed text is read on its way out of the input (Tab or blur): the field then commits once focus
 * leaves it, so Tab reaches the restore button. Blur and Enter still snap a value React Aria saw
 * as unchanged, and Shift or Alt with an arrow steps by the larger or smaller step.
 */
function useNumberEntry(state: FieldState<number | null>, options: NumberEntryOptions) {
  const { commitBehavior, bounds, steps, presets } = options;
  const isLeaving = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const commit = (value: number) => {
    const next = commitBehavior === 'snap' ? snapNumberValue(value, bounds) : value;
    state.setValue(Number.isNaN(next) ? null : next);
    if (!isLeaving.current) state.commit();
  };
  const finishUnchanged = (value: number) => {
    if (commitBehavior !== 'snap' || value !== state.value) return;
    if (snapNumberValue(value, bounds) !== value) commit(value);
  };
  const modifiedStep = createModifierStepHandler(state, steps);
  /** Moves the number the input shows to the next preset and commits it; past the last, nothing. */
  const stepToPreset = (input: NumberInputState, direction: 1 | -1) => {
    // A press on a step button takes focus to the input, as React Aria's own steppers do.
    inputRef.current?.focus();
    const next = presets ? findStepValue(toDraft(input), direction, presets) : null;
    if (next === null || state.isReadOnly || state.isDisabled) return;
    state.setValue(next);
    state.commit();
  };
  const toInputProps = (input: NumberInputState) => ({
    // Plain Arrow Up and Arrow Down move through the presets, before React Aria steps by `step`.
    onKeyDownCapture: (event: KeyboardEvent<HTMLInputElement>) => {
      const direction = presetArrows[event.key];
      if (!presets || !direction || hasModifierKey(event)) return;
      if (isComposingKey(event.nativeEvent)) return;
      event.preventDefault();
      event.stopPropagation();
      stepToPreset(input, direction);
    },
    onBlurCapture: () => {
      isLeaving.current = true;
    },
    onBlur: () => {
      finishUnchanged(input.numberValue);
      isLeaving.current = false;
    },
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      modifiedStep(event, Number.isNaN(input.numberValue) ? null : input.numberValue);
      if (event.key === 'Enter' && !isComposingKey(event.nativeEvent)) {
        finishUnchanged(input.numberValue);
      }
      // The typed number becomes the value before Tab moves focus, so dirty state is current.
      if (event.key === 'Tab') {
        isLeaving.current = true;
        input.commit();
        isLeaving.current = false;
      }
    },
  });
  /**
   * A step button's Shift or Alt press steps the number the input shows and commits it; with
   * presets, so does a plain press, to the next preset.
   */
  const toStepperPress = (input: NumberInputState, direction: 1 | -1) => {
    const modified = toModifiedPressProps(state, steps, (size) => {
      state.setValue(addStep(toDraft(input), direction * size, steps));
      state.commit();
    });
    return presets
      ? toStepValuePressProps(() => stepToPreset(input, direction), modified)
      : modified;
  };
  /** Whether a step button has no preset left to move to. */
  const isPastPresets = (input: NumberInputState, direction: 1 | -1) =>
    presets !== undefined &&
    toDraft(input) !== null &&
    findStepValue(toDraft(input), direction, presets) === null;
  return { inputRef, commit, toInputProps, toStepperPress, isPastPresets };
}

/** The presets in range and ascending, filtered and sorted once per change, not on every render. */
function useSortedPresets(
  stepValues: readonly number[] | undefined,
  minValue: number | undefined,
  maxValue: number | undefined,
) {
  return useMemo(
    () =>
      stepValues && stepValues.length > 0
        ? toSortedStepValues({ values: stepValues, minValue, maxValue })
        : undefined,
    [stepValues, minValue, maxValue],
  );
}

export function DecimalControl({ state, control, config, steps }: DecimalControlProps) {
  const {
    hideStepper,
    startAdornment,
    endAdornment,
    endAdornmentPlacement,
    showScrubber,
    placeholder,
    autoComplete,
    enterKeyHint,
    commitBehavior = 'snap',
    decrementIcon,
    incrementIcon,
    stepValues,
    ...rest
  } = config;
  const bounds = { minValue: config.minValue, maxValue: config.maxValue, step: config.step };
  const presets = useSortedPresets(stepValues, config.minValue, config.maxValue);
  const { inputRef, ...entry } = useNumberEntry(state, { commitBehavior, bounds, steps, presets });
  const ref = useMergedRefs(inputRef, control.ref);
  const formOwner = useFieldFormOwner();
  return (
    <AriaNumberField
      {...rest}
      {...toAriaControlProps(control)}
      {...hooks.slot('box')}
      form={formOwner}
      commitBehavior="validate"
      // The wheel would step by `step`, past the presets.
      isWheelDisabled={presets ? true : undefined}
      value={state.value ?? Number.NaN}
      onChange={entry.commit}
    >
      {({ state: inputState }) => (
        <Group {...hooks.slot('group')}>
          {hideStepper ? null : (
            <Stepper
              slot="decrement"
              labelledBy={control['aria-labelledby']}
              press={entry.toStepperPress(inputState, -1)}
              icon={decrementIcon}
              isDisabled={entry.isPastPresets(inputState, -1)}
            />
          )}
          {showScrubber ? <NumberScrubber state={state} steps={steps} /> : null}
          <NumberAdornment side="start">{startAdornment}</NumberAdornment>
          <NumberValue
            isTight={endAdornmentPlacement === 'value'}
            text={inputState.inputValue || (placeholder ?? '')}
          >
            <Input
              {...hooks.slot('input')}
              ref={ref}
              placeholder={placeholder}
              autoComplete={autoComplete}
              enterKeyHint={enterKeyHint}
              {...entry.toInputProps(inputState)}
            />
          </NumberValue>
          <NumberAdornment side="end">{endAdornment}</NumberAdornment>
          {hideStepper ? null : (
            <Stepper
              slot="increment"
              labelledBy={control['aria-labelledby']}
              press={entry.toStepperPress(inputState, 1)}
              icon={incrementIcon}
              isDisabled={entry.isPastPresets(inputState, 1)}
            />
          )}
        </Group>
      )}
    </AriaNumberField>
  );
}
