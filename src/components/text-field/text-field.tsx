import { useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  Input,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import {
  Field,
  countCodePoints,
  toAriaControlProps,
  useFieldControl,
  validateString,
  type FieldInputProps,
  type FieldState,
  type StringRules,
} from '../field/field.js';
import {
  TextFieldArea,
  TextFieldFrame,
  isAutoGrowing,
  textFieldHooks as hooks,
  withCharacterCount,
} from './text-field-parts.js';

/** The React Aria text field props a `TextField` takes; the field supplies the rest. */
type AriaTextFieldOwnProps = Omit<
  AriaTextFieldProps,
  | 'className'
  | 'style'
  | 'children'
  | 'render'
  | 'id'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'validate'
  | 'validationBehavior'
  | 'isInvalid'
  | 'isRequired'
  | 'isReadOnly'
  | 'isDisabled'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-describedby'
  | 'aria-errormessage'
>;

export interface TextFieldProps
  extends AriaTextFieldOwnProps, FieldInputProps<string>, StringRules {
  /** Edit several lines in a text area instead of one line in an input. */
  multiline?: boolean | undefined;
  /** A hint shown while the control is empty. */
  placeholder?: string | undefined;
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
  const isMasked = allowsReveal && rest.type === 'password';
  const count = showCount ? (getLength ?? countCodePoints)(state.value) : null;
  const data = { multiline, autosize: multiline && isAutoGrowing({ minRows, maxRows }) };
  const input = {
    ...hooks.slot('input'),
    placeholder,
    onBlur: () => state.commit(),
    onKeyDown: createEditKeyHandler(state, multiline),
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
      {(control) => {
        return (
          <AriaTextField
            {...rest}
            {...toAriaControlProps(control)}
            {...hooks.slot('box')}
            type={isMasked && isRevealed ? 'text' : rest.type}
            value={state.value}
            onChange={state.setValue}
          >
            <TextFieldFrame
              startAdornment={startAdornment}
              endAdornment={endAdornment}
              reveal={reveal}
            >
              {multiline ? (
                <TextFieldArea
                  {...input}
                  controlRef={control.ref}
                  minRows={minRows}
                  maxRows={maxRows}
                  value={state.value}
                />
              ) : (
                <Input {...input} ref={control.ref} />
              )}
            </TextFieldFrame>
          </AriaTextField>
        );
      }}
    </Field>
  );
}
