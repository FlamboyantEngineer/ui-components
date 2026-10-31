'use client';

import { useRef, type KeyboardEvent } from 'react';
import { Group, Input, NumberField as AriaNumberField } from '../../primitives/index.js';
import { toAriaControlProps, type FieldControlProps, type FieldState } from '../field/field.js';
import type {
  NumberControlConfig,
  NumberFieldProps,
  NumberFieldCommitBehavior,
} from './number-field.js';
import {
  NumberAdornment,
  NumberScrubber,
  Stepper,
  createModifierStepHandler,
  numberFieldHooks as hooks,
  type NumberSteps,
} from './number-field-parts.js';
import { snapNumberValue } from './snap-number-value.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
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
  bounds: Pick<NumberFieldProps, 'minValue' | 'maxValue' | 'step'>;
  steps: NumberSteps;
}

/**
 * Takes React Aria's commits into the field, snapped or kept, and commits them, except while the
 * typed text is read on its way out of the input (Tab or blur): the field then commits once focus
 * leaves it, so Tab reaches the restore button. Blur and Enter still snap a value React Aria saw
 * as unchanged, and Shift or Alt with an arrow steps by the larger or smaller step.
 */
function useNumberEntry(state: FieldState<number | null>, options: NumberEntryOptions) {
  const { commitBehavior, bounds, steps } = options;
  const isLeaving = useRef(false);
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
  const toInputProps = (input: NumberInputState) => ({
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
  return { commit, toInputProps };
}

export function DecimalControl({ state, control, config, steps }: DecimalControlProps) {
  const {
    hideStepper,
    startAdornment,
    endAdornment,
    showScrubber,
    placeholder,
    autoComplete,
    enterKeyHint,
    commitBehavior = 'snap',
    ...rest
  } = config;
  const bounds = { minValue: config.minValue, maxValue: config.maxValue, step: config.step };
  const entry = useNumberEntry(state, { commitBehavior, bounds, steps });
  return (
    <AriaNumberField
      {...rest}
      {...toAriaControlProps(control)}
      {...hooks.slot('box')}
      commitBehavior="validate"
      value={state.value ?? Number.NaN}
      onChange={entry.commit}
    >
      {({ state: inputState }) => (
        <Group {...hooks.slot('group')}>
          {hideStepper ? null : (
            <Stepper slot="decrement" labelledBy={control['aria-labelledby']} />
          )}
          {showScrubber ? <NumberScrubber state={state} steps={steps} /> : null}
          <NumberAdornment side="start">{startAdornment}</NumberAdornment>
          <Input
            {...hooks.slot('input')}
            ref={control.ref}
            placeholder={placeholder}
            autoComplete={autoComplete}
            enterKeyHint={enterKeyHint}
            {...entry.toInputProps(inputState)}
          />
          <NumberAdornment side="end">{endAdornment}</NumberAdornment>
          {hideStepper ? null : (
            <Stepper slot="increment" labelledBy={control['aria-labelledby']} />
          )}
        </Group>
      )}
    </AriaNumberField>
  );
}
