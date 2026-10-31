'use client';

import { useUiStrings } from '../../core/provider.js';
import {
  Field,
  useFieldControl,
  type FieldInputProps,
  type FieldTextInputProps,
} from '../field/field.js';
import { PinInputCells, pinInputHooks as hooks } from './pin-input-cells.js';
import type { PinInputType } from './pin-value.js';

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
  /** Called with the code each time a change fills every cell. */
  onComplete?: ((value: string) => void) | undefined;
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
    check: (value) =>
      value !== '' && value.length < length
        ? { severity: 'error', message: strings.tooShort(length), validity: 'tooShort' }
        : null,
  });
  return (
    <Field
      {...field}
      {...hooks.root({
        className: field.className,
        data: { complete: state.value.length >= length },
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
