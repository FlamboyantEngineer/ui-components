import { useState, type KeyboardEvent } from 'react';
import type { FieldState } from '../field/field.js';
import { textFieldHooks as hooks, type TextFieldInputProps } from './text-field-parts.js';
import { useInputTransform, type InputTransform } from './use-input-transform.js';

export interface TextFieldInputOptions {
  state: FieldState<string>;
  multiline: boolean;
  placeholder: string | undefined;
  transformInput: ((text: string) => string) | undefined;
  displayValue: string | undefined;
}

export interface TextFieldInput {
  /** The input's or text area's own props. */
  input: TextFieldInputProps;
  /** The text the control shows: the display value at rest, else the value. */
  text: string;
  /** The control shows the display value. */
  showsDisplayValue: boolean;
  /** Takes each edit, through the input transform. */
  transform: InputTransform;
}

/** Enter commits a single line; Escape puts the committed value back and stops there. */
function createEditKeyHandler(state: FieldState<string>, multiline: boolean) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Enter' && !multiline) state.commit();
    if (event.key === 'Escape' && state.isDirty) {
      event.preventDefault();
      event.stopPropagation();
      state.restore();
    }
  };
}

/**
 * The text field's control: its edit handlers, the input transform, and the text it shows, which
 * is the display value while the control does not have focus.
 */
export function useTextFieldInput(options: TextFieldInputOptions): TextFieldInput {
  const { state, multiline, placeholder, transformInput, displayValue } = options;
  const [isFocused, setIsFocused] = useState(false);
  const transform = useInputTransform({
    transform: transformInput,
    value: state.value,
    setValue: state.setValue,
  });
  const showsDisplayValue = displayValue !== undefined && !isFocused;
  return {
    input: {
      ...hooks.slot('input'),
      placeholder,
      onFocus: () => setIsFocused(true),
      onBlur: () => {
        setIsFocused(false);
        state.commit();
      },
      onKeyDown: createEditKeyHandler(state, multiline),
      onCompositionStart: transform.onCompositionStart,
      onCompositionEnd: transform.onCompositionEnd,
    },
    text: showsDisplayValue ? displayValue : state.value,
    showsDisplayValue,
    transform,
  };
}
