import { useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import {
  useTextCompletions,
  type Completion,
  type CompletionSource,
  type TextCompletions,
} from '../completion-list/completion-list.js';
import type { FieldState } from '../field/field.js';
import { textFieldHooks as hooks, type TextFieldInputProps } from './text-field-parts.js';
import { useInputTransform, type InputTransform } from './use-input-transform.js';

export interface TextFieldInputOptions {
  state: FieldState<string>;
  multiline: boolean;
  placeholder: string | undefined;
  transformInput: ((text: string) => string) | undefined;
  displayValue: string | undefined;
  /** A vocabulary or a source of completions for the text before the caret. */
  completions: readonly Completion[] | CompletionSource | undefined;
  /** The caller's key handler, which runs after the field's for keys the completion list did not use. */
  onKeyDown: ((event: KeyboardEvent) => void) | undefined;
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
  /** Takes the control's text after each edit: the transform, then the completion lookup. */
  onChange: (text: string) => void;
  /** The input or text area, for completions. */
  controlRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  /** The text field element, which the completion list opens under. */
  boxRef: RefObject<HTMLDivElement | null>;
  /** The control's completions, when the field offers any. */
  completion: TextCompletions | null;
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

/** The control's keys: the completion list first, then the field's edit keys, then the caller's. */
function createKeyHandler(options: TextFieldInputOptions, completion: TextCompletions | null) {
  const editKeys = createEditKeyHandler(options.state, options.multiline);
  return (event: KeyboardEvent<HTMLElement>) => {
    if (completion?.model.handleKeyDown(event)) return;
    editKeys(event);
    options.onKeyDown?.(event);
  };
}

/**
 * The text field's control: its edit handlers, the input transform, the completion list's
 * attributes, and the text it shows, which is the display value while the control does not have
 * focus.
 */
export function useTextFieldInput(options: TextFieldInputOptions): TextFieldInput {
  const { state, placeholder, transformInput, displayValue, completions } = options;
  const [isFocused, setIsFocused] = useState(false);
  const controlRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const textCompletions = useTextCompletions({
    completions,
    inputRef: controlRef,
    isLocked: state.isReadOnly || state.isDisabled,
    setValue: state.setValue,
  });
  const completion = completions ? textCompletions : null;
  const transform = useInputTransform({
    transform: transformInput,
    value: state.value,
    setValue: state.setValue,
  });
  const showsDisplayValue = displayValue !== undefined && !isFocused;
  return {
    input: {
      ...completion?.inputProps,
      ...hooks.slot('input'),
      placeholder,
      onFocus: () => setIsFocused(true),
      onBlur: () => {
        setIsFocused(false);
        completion?.model.close();
        state.commit();
      },
      onKeyDown: createKeyHandler(options, completion),
      onCompositionStart: transform.onCompositionStart,
      onCompositionEnd: transform.onCompositionEnd,
    },
    text: showsDisplayValue ? displayValue : state.value,
    showsDisplayValue,
    transform,
    onChange: (text) => {
      transform.onChange(text);
      completion?.model.track('input');
    },
    controlRef,
    boxRef,
    completion,
  };
}
