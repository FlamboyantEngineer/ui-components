import type { InputHTMLAttributes } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Field, useFieldControl, type FieldInputProps } from '../field/field.js';
import { PinInputCells, pinInputHooks as hooks } from './pin-input-cells.js';
import type { PinInputType } from './pin-value.js';

export type { PinInputType } from './pin-value.js';

export interface PinInputProps extends FieldInputProps<string> {
  /** How many characters the code has: one cell each. */
  length: number;
  /** The characters a cell takes. Defaults to `numeric`. */
  type?: PinInputType | undefined;
  /** Hides the characters, as a password input does. */
  mask?: boolean | undefined;
  /** Shown in each empty cell. */
  placeholder?: string | undefined;
  /** The first cell's autocomplete hint, such as `one-time-code` for a code sent by message. Defaults to `off`. */
  autoComplete?: InputHTMLAttributes<HTMLInputElement>['autoComplete'];
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
    >
      {(control) => (
        <PinInputCells
          control={control}
          state={state}
          cells={{ length, type, mask, placeholder, autoComplete }}
          name={rest.name}
          onComplete={onComplete}
        />
      )}
    </Field>
  );
}
