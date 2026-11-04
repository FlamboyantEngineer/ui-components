'use client';

import { type KeyboardEvent, useLayoutEffect, useState } from 'react';
import { MinusGlyph, PlusGlyph } from '../../core/glyphs.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import {
  Button as AriaButton,
  Group,
  Input,
  TextField as AriaTextField,
} from '../../primitives/index.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import {
  type FieldControlProps,
  FieldFormValue,
  type FieldIssue,
  type FieldState,
  toAriaControlProps,
} from '../field/field.js';
import type { NumberControlConfig } from './number-field.js';
import {
  addStep,
  modifierStep,
  NumberAdornment,
  numberFieldHooks as hooks,
  NumberScrubber,
  type NumberSteps,
  NumberValue,
  toModifiedPressProps,
} from './number-field-parts.js';
import { snapNumberValue } from './snap-number-value.js';

/** How a text number control reads and writes its text. */
export interface NumberTextCodec {
  /** The number a text spells: `null` while empty, `NaN` while it spells none. */
  parse(text: string): number | null;
  /** The text of a value, empty for none. */
  format(value: number | null): string;
  /** The value as assistive technology reads it (`0x1f`, `50 mm`). */
  describe(value: number): string;
  inputMode: 'text' | 'numeric' | 'decimal';
  /**
   * The issue text that spells no number reports while it stays in the input; without one, such
   * text is put back to the value's when typing ends.
   */
  unreadable?: FieldIssue | undefined;
}

interface TextNumberControlProps {
  state: FieldState<number | null>;
  control: FieldControlProps;
  codec: NumberTextCodec;
  config: NumberControlConfig;
  steps: NumberSteps;
}

function isUnreadable(value: number | null): boolean {
  return value !== null && Number.isNaN(value);
}

function useTextEntry({ state, codec, config, steps }: TextNumberControlProps) {
  const formatted = codec.format(state.value);
  const [draft, setDraft] = useState(formatted);
  const [previous, setPrevious] = useState(formatted);
  if (previous !== formatted) {
    setPrevious(formatted);
    setDraft(formatted);
  }
  const issue = codec.unreadable && isUnreadable(codec.parse(draft)) ? codec.unreadable : null;
  const { setDraftIssue } = state;
  // After every commit: the field keeps the issue it has while the report says the same.
  useLayoutEffect(() => setDraftIssue(issue));
  const finish = (commit: boolean) => {
    const value = codec.parse(draft);
    if (isUnreadable(value)) {
      if (!codec.unreadable) setDraft(formatted);
      return;
    }
    const next =
      value === null || config.commitBehavior === 'validate'
        ? value
        : snapNumberValue(value, config);
    state.setValue(next);
    setDraft(codec.format(next));
    if (commit) state.commit();
  };
  /**
   * Steps the number the input shows: by `step` onto the step grid, as React Aria's plain arrows
   * and steppers do in a decimal field, or by a modifier's step (`modifier`) without snapping.
   */
  const step = (direction: number, modifier?: number) => {
    if (state.isDisabled || state.isReadOnly) return;
    const parsed = codec.parse(draft);
    const value = isUnreadable(parsed) ? state.value : parsed;
    const next =
      modifier === undefined
        ? snapNumberValue(addStep(value, direction * steps.step, steps), {
            minValue: steps.minValue,
            maxValue: steps.maxValue,
            step: steps.step,
          })
        : addStep(value, direction * modifier, steps);
    state.setValue(next);
    setDraft(codec.format(next));
    state.commit();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (isComposingKey(event.nativeEvent) || state.isReadOnly) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      finish(true);
    }
    if (event.key === 'Tab') finish(false);
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      // A modified arrow without its step does nothing, as in a decimal field.
      const isModified = event.shiftKey || event.altKey;
      const modifier = isModified ? modifierStep(event, steps) : undefined;
      if (isModified && modifier === undefined) return;
      event.preventDefault();
      step(event.key === 'ArrowUp' ? 1 : -1, modifier);
    }
  };
  return { draft, setDraft, finish, step, onKeyDown };
}

/**
 * A step button: by `step` when pressed (`onStep()`), or by a modifier's step with Shift or
 * Alt (`onStep(size)`), and disabled when the value cannot move further.
 */
function TextNumberStepper({
  direction,
  state,
  steps,
  controlId,
  labelledBy,
  onStep,
}: {
  direction: 1 | -1;
  state: FieldState<number | null>;
  steps: NumberSteps;
  controlId: string;
  labelledBy?: string | undefined;
  onStep: (size?: number) => void;
}) {
  const strings = useUiStrings();
  const slot = direction === 1 ? 'increment' : 'decrement';
  const bound = direction === 1 ? steps.maxValue : steps.minValue;
  const atBound =
    state.value !== null &&
    bound !== undefined &&
    (direction === 1 ? state.value >= bound : state.value <= bound);
  return (
    <AriaButton
      {...hooks.slot(slot)}
      aria-label={direction === 1 ? strings.numberIncrease : strings.numberDecrease}
      aria-labelledby={`${controlId}-${slot} ${labelledBy ?? controlId}`}
      id={`${controlId}-${slot}`}
      isDisabled={state.isDisabled || state.isReadOnly || atBound}
      excludeFromTabOrder
      {...toModifiedPressProps(state, steps, onStep)}
      onPress={() => onStep()}
    >
      <Glyph icon={direction === 1 ? PlusGlyph : MinusGlyph} />
    </AriaButton>
  );
}

/**
 * A spinbutton on a text-field building block, for numbers a decimal number field cannot type: a
 * nondecimal base, or a quantity with a unit. The value and its stepping stay those of a number.
 */
export function TextNumberControl(props: TextNumberControlProps) {
  const { state, control, config, steps } = props;
  const {
    hideStepper,
    showScrubber,
    startAdornment,
    endAdornment,
    endAdornmentPlacement,
    placeholder,
    autoComplete,
    enterKeyHint,
    minValue,
    maxValue,
    name,
  } = config;
  const [input, inputRef] = useForwardedRef<HTMLInputElement>(control.ref);
  const entry = useTextEntry(props);
  const stepper = (direction: 1 | -1) => (
    <TextNumberStepper
      direction={direction}
      state={state}
      steps={steps}
      controlId={control.id}
      labelledBy={control['aria-labelledby']}
      onStep={(size) => {
        entry.step(direction, size);
        input.current?.focus();
      }}
    />
  );
  return (
    <AriaTextField
      {...toAriaControlProps(control)}
      {...hooks.slot('box')}
      value={entry.draft}
      onChange={entry.setDraft}
    >
      <Group {...hooks.slot('group')}>
        {hideStepper ? null : stepper(-1)}
        {showScrubber ? <NumberScrubber state={state} steps={steps} /> : null}
        <NumberAdornment side="start">{startAdornment}</NumberAdornment>
        <NumberValue
          isTight={endAdornmentPlacement === 'value'}
          text={entry.draft || (placeholder ?? '')}
        >
          <Input
            {...hooks.slot('input')}
            role="spinbutton"
            aria-valuenow={state.value ?? undefined}
            aria-valuetext={state.value === null ? undefined : props.codec.describe(state.value)}
            aria-valuemin={minValue}
            aria-valuemax={maxValue}
            inputMode={props.codec.inputMode}
            ref={inputRef}
            placeholder={placeholder}
            autoComplete={autoComplete}
            enterKeyHint={enterKeyHint}
            onBlur={() => entry.finish(false)}
            onKeyDown={entry.onKeyDown}
          />
        </NumberValue>
        <NumberAdornment side="end">{endAdornment}</NumberAdornment>
        {hideStepper ? null : stepper(1)}
      </Group>
      <FieldFormValue
        name={name}
        value={state.value === null ? null : String(state.value)}
        isDisabled={state.isDisabled}
      />
    </AriaTextField>
  );
}
