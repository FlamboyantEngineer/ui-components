'use client';

import { MinusGlyph, PlusGlyph } from '../../core/glyphs.js';
import { useRef, useState, type KeyboardEvent } from 'react';
import { Button as AriaButton, Input, TextField as AriaTextField } from '../../primitives/index.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { mergeRefs } from '../../utils/merge-props.js';
import {
  FieldFormValue,
  toAriaControlProps,
  type FieldControlProps,
  type FieldState,
} from '../field/field.js';
import type { NumberControlConfig } from './number-field.js';
import {
  addStep,
  NumberAdornment,
  NumberScrubber,
  numberFieldHooks as hooks,
  type NumberSteps,
} from './number-field-parts.js';
import { formatRadixNumber, parseRadixNumber, type NumberFieldRadix } from './radix-number.js';
import { snapNumberValue } from './snap-number-value.js';

interface RadixControlProps {
  state: FieldState<number | null>;
  control: FieldControlProps;
  radix: NumberFieldRadix;
  config: NumberControlConfig;
  steps: NumberSteps;
}

function useRadixEntry({ state, radix, config, steps }: RadixControlProps) {
  const formatted = formatRadixNumber(state.value, radix);
  const [draft, setDraft] = useState(formatted);
  const [previous, setPrevious] = useState(formatted);
  if (previous !== formatted) {
    setPrevious(formatted);
    setDraft(formatted);
  }
  const finish = (commit: boolean) => {
    const value = parseRadixNumber(draft, radix);
    if (value !== null && Number.isNaN(value)) {
      setDraft(formatted);
      return;
    }
    const next =
      value === null || config.commitBehavior === 'validate'
        ? value
        : snapNumberValue(value, config);
    state.setValue(next);
    setDraft(formatRadixNumber(next, radix));
    if (commit) state.commit();
  };
  const step = (direction: number, event?: { shiftKey: boolean; altKey: boolean }) => {
    if (state.isDisabled || state.isReadOnly) return;
    const amount =
      (event?.shiftKey ? steps.largeStep : event?.altKey ? steps.smallStep : undefined) ??
      steps.step;
    const parsed = parseRadixNumber(draft, radix);
    const value = parsed !== null && Number.isNaN(parsed) ? state.value : parsed;
    const next = addStep(value, direction * amount, steps);
    state.setValue(next);
    setDraft(formatRadixNumber(next, radix));
    state.commit();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || state.isReadOnly) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      finish(true);
    }
    if (event.key === 'Tab') finish(false);
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      step(event.key === 'ArrowUp' ? 1 : -1, event);
    }
  };
  return { draft, setDraft, finish, step, onKeyDown };
}

/** A radix spinbutton on a text-field building block; numeric value and stepping stay base independent. */
export function RadixControl(props: RadixControlProps) {
  const { state, control, config, steps } = props;
  const {
    hideStepper,
    showScrubber,
    startAdornment,
    endAdornment,
    placeholder,
    autoComplete,
    enterKeyHint,
    minValue,
    maxValue,
    name,
  } = config;
  const input = useRef<HTMLInputElement>(null);
  const strings = useUiStrings();
  const entry = useRadixEntry(props);
  const stepper = (direction: 1 | -1) => {
    const slot = direction === 1 ? 'increment' : 'decrement';
    const bound = direction === 1 ? maxValue : minValue;
    const atBound =
      state.value !== null &&
      bound !== undefined &&
      (direction === 1 ? state.value >= bound : state.value <= bound);
    return (
      <AriaButton
        {...hooks.slot(slot)}
        aria-label={direction === 1 ? strings.numberIncrease : strings.numberDecrease}
        aria-labelledby={`${control.id}-${slot} ${control['aria-labelledby'] ?? control.id}`}
        id={`${control.id}-${slot}`}
        isDisabled={state.isDisabled || state.isReadOnly || atBound}
        excludeFromTabOrder
        onPress={() => {
          entry.step(direction);
          input.current?.focus();
        }}
      >
        <Glyph icon={direction === 1 ? PlusGlyph : MinusGlyph} />
      </AriaButton>
    );
  };
  return (
    <AriaTextField
      {...toAriaControlProps(control)}
      {...hooks.slot('box')}
      value={entry.draft}
      onChange={entry.setDraft}
    >
      <div {...hooks.slot('group')}>
        {hideStepper ? null : stepper(-1)}
        {showScrubber ? <NumberScrubber state={state} steps={steps} /> : null}
        <NumberAdornment side="start">{startAdornment}</NumberAdornment>
        <Input
          {...hooks.slot('input')}
          role="spinbutton"
          aria-valuenow={state.value ?? undefined}
          aria-valuetext={
            state.value === null ? undefined : formatRadixNumber(state.value, props.radix)
          }
          aria-valuemin={minValue}
          aria-valuemax={maxValue}
          inputMode={props.radix === 16 ? 'text' : 'numeric'}
          ref={mergeRefs(input, control.ref)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          enterKeyHint={enterKeyHint}
          onBlur={() => entry.finish(false)}
          onKeyDown={entry.onKeyDown}
        />
        <NumberAdornment side="end">{endAdornment}</NumberAdornment>
        {hideStepper ? null : stepper(1)}
      </div>
      <FieldFormValue
        name={name}
        value={state.value === null ? null : String(state.value)}
        isDisabled={state.isDisabled}
      />
    </AriaTextField>
  );
}
