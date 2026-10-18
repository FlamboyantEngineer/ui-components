import { useState, type ReactNode } from 'react';
import { Input, TextField as AriaTextField } from '../../primitives/index.js';
import type { FocusEventProps, KeyboardEventProps } from '../../core/events.js';
import { useUiStrings } from '../../core/provider.js';
import { mergeRefs } from '../../utils/merge-props.js';
import {
  Field,
  countCodePoints,
  toAriaControlProps,
  useFieldControl,
  validateString,
  type FieldInputProps,
  type FieldTextInputProps,
  type StringRules,
} from '../field/field.js';
import {
  TextFieldArea,
  TextFieldFrame,
  isAutoGrowing,
  textFieldHooks as hooks,
  withCharacterCount,
} from './text-field-parts.js';
import { useTextFieldInput } from './use-text-field-input.js';

/** The kind of text a single-line field takes: the input's `type`. */
export type TextFieldType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';

export interface TextFieldProps
  extends
    FieldInputProps<string>,
    StringRules,
    FieldTextInputProps,
    FocusEventProps,
    KeyboardEventProps {
  /** The kind of text on a single line, which sets the input's `type`. Defaults to `text`. */
  type?: TextFieldType | undefined;
  /** Edit several lines in a text area instead of one line in an input. */
  multiline?: boolean | undefined;
  /** Content inside the input's frame before the text: an icon, a unit or a button. */
  startAdornment?: ReactNode;
  /** Content inside the input's frame after the text. */
  endAdornment?: ReactNode;
  /** With `type="password"`, draws a toggle button after the text that shows it while pressed. */
  allowsReveal?: boolean | undefined;
  /** With `multiline`, the rows the text area shows at least; it grows with its text from there. */
  minRows?: number | undefined;
  /** With `multiline`, the rows the text area grows to at most before it scrolls. */
  maxRows?: number | undefined;
  /** Shows the text's length (counted as `getLength` counts it), against `maxLength` when set. */
  showCount?: boolean | undefined;
  /** Rewrites each typed, pasted or dropped edit before it becomes the value; the caret stays after the same accepted characters. */
  transformInput?: ((text: string) => string) | undefined;
  /** What the control shows while it does not have focus, such as a computed result; focus shows the value for editing. */
  displayValue?: string | undefined;
}

/**
 * A field for a plain string, on one line or several. It validates its length and format, commits on
 * blur and on Enter, and reverts an edit on Escape. Adornments and a reveal button sit inside the
 * input's frame; a counter joins the description.
 */
export function TextField({
  minLength,
  maxLength,
  pattern,
  trim,
  getLength,
  multiline = false,
  placeholder,
  startAdornment,
  endAdornment,
  allowsReveal = false,
  minRows,
  maxRows,
  showCount = false,
  spellCheck,
  transformInput,
  displayValue,
  ...props
}: TextFieldProps) {
  const strings = useUiStrings();
  const rules = { minLength, maxLength, pattern, trim, getLength };
  const { state, field, rest } = useFieldControl(props, {
    initialValue: '',
    emptyValue: '',
    check: (value) => validateString(value, rules, strings),
  });
  const [isRevealed, setIsRevealed] = useState(false);
  const edit = useTextFieldInput({ state, multiline, placeholder, transformInput, displayValue });
  const isMasked = allowsReveal && rest.type === 'password';
  const count = showCount ? (getLength ?? countCodePoints)(state.value) : null;
  const data = {
    multiline,
    autosize: multiline && isAutoGrowing({ minRows, maxRows }),
    displayValue: edit.showsDisplayValue,
  };
  const reveal = isMasked
    ? { label: field.label, isRevealed, isDisabled: state.isDisabled, onChange: setIsRevealed }
    : null;
  return (
    <Field
      {...field}
      {...hooks.root({ className: field.className, data })}
      description={withCharacterCount(field.description, { count, maxLength })}
      state={state}
    >
      {(control) => (
        <AriaTextField
          {...rest}
          {...toAriaControlProps(control)}
          {...hooks.slot('box')}
          spellCheck={spellCheck?.toString()}
          type={isMasked && isRevealed ? 'text' : rest.type}
          value={edit.text}
          onChange={edit.transform.onChange}
        >
          <TextFieldFrame
            startAdornment={startAdornment}
            endAdornment={endAdornment}
            reveal={reveal}
          >
            {multiline ? (
              <TextFieldArea
                {...edit.input}
                controlRef={mergeRefs(control.ref, edit.transform.ref)}
                minRows={minRows}
                maxRows={maxRows}
                value={edit.text}
              />
            ) : (
              <Input {...edit.input} ref={mergeRefs(control.ref, edit.transform.ref)} />
            )}
          </TextFieldFrame>
        </AriaTextField>
      )}
    </Field>
  );
}
