'use client';

import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import {
  Field,
  useFieldControl,
  type FieldInputProps,
  type FieldIssue,
  type FieldTextInputProps,
} from '../field/field.js';
import { PinInputCells, pinInputHooks as hooks } from './pin-input-cells.js';
import { filterPinCharacters, isPinCodeComplete, type PinInputType } from './pin-value.js';

export type { PinInputType } from './pin-value.js';

/**
 * The text-entry attributes a code field hands its cells: the hint in each empty cell, the first
 * cell's autofill hint (such as `one-time-code`, `off` by default) and the Enter key's label. The
 * keyboard follows `type`, and a code is never spell checked.
 */
export type PinInputTextInputProps = Pick<
  FieldTextInputProps,
  'placeholder' | 'autoComplete' | 'enterKeyHint'
>;

export interface PinInputProps extends FieldInputProps<string>, PinInputTextInputProps {
  /** How many characters the code has: one cell each. */
  length: number;
  /** The characters a cell takes. Defaults to `numeric`. */
  type?: PinInputType | undefined;
  /** Hides the characters, as a password input does. */
  mask?: boolean | undefined;
  /** Called with the code each time an edit renders a full code of valid characters. */
  onComplete?: ((value: string) => void) | undefined;
}

/**
 * The code's own issue: a character its cells do not take, then more or fewer characters than its
 * length (an empty code is the field's to require). A supplied value is checked as it is, never
 * rewritten, so an impossible code stays visible as invalid and blocks its form.
 */
function checkPinCode(
  value: string,
  cells: { length: number; type: PinInputType },
  strings: UiStrings,
): FieldIssue | null {
  const { length, type } = cells;
  if (value === '') return null;
  if (filterPinCharacters(value, type) !== value) {
    return { severity: 'error', message: strings.patternMismatch, validity: 'patternMismatch' };
  }
  if (value.length > length) {
    return { severity: 'error', message: strings.tooLong(length), validity: 'tooLong' };
  }
  if (value.length < length) {
    return { severity: 'error', message: strings.tooShort(length), validity: 'tooShort' };
  }
  return null;
}

/**
 * A field for a short code, such as a PIN or a one-time code: one single-character input per
 * character, in a group named by the label. Typing advances, Backspace erases and moves back, the
 * arrow keys move, and a paste fills the cells from the focused one. It has the field base's
 * validation, dirty state, restore, undo and menu, and reports a partly filled code.
 */
export function PinInput({
  length,
  type = 'numeric',
  mask = false,
  placeholder,
  autoComplete = 'off',
  enterKeyHint,
  onComplete,
  ...props
}: PinInputProps) {
  const strings = useUiStrings();
  const { state, field, rest } = useFieldControl(props, {
    initialValue: '',
    emptyValue: '',
    check: (value) => checkPinCode(value, { length, type }, strings),
  });
  return (
    <Field
      {...field}
      {...hooks.root({
        className: field.className,
        data: { complete: isPinCodeComplete(state.value, { length, type }) },
      })}
      state={state}
      commitOnBlur
    >
      {(control) => (
        <PinInputCells
          control={control}
          state={state}
          cells={{ length, type, mask, placeholder, autoComplete, enterKeyHint }}
          name={rest.name}
          onComplete={onComplete}
        />
      )}
    </Field>
  );
}
