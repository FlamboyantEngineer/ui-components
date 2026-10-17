import type { KeyboardEvent } from 'react';
import {
  Input,
  TextArea,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import {
  Field,
  toAriaControlProps,
  useFieldControl,
  validateString,
  type FieldInputProps,
  type FieldState,
  type StringRules,
} from '../field/field.js';

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
}

const hooks = createHooks('text-field', ['box', 'input']);

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
 * blur and on Enter, and reverts an edit on Escape.
 */
export function TextField({
  minLength,
  maxLength,
  pattern,
  trim,
  multiline = false,
  placeholder,
  ...props
}: TextFieldProps) {
  const strings = useUiStrings();
  const { state, field, rest } = useFieldControl(props, {
    initialValue: '',
    emptyValue: '',
    check: (value) => validateString(value, { minLength, maxLength, pattern, trim }, strings),
  });
  const onKeyDown = createEditKeyHandler(state, multiline);
  const data = { multiline };
  return (
    <Field {...field} {...hooks.root({ className: field.className, data })} state={state}>
      {(control) => {
        const input = {
          ...hooks.slot('input'),
          ref: control.ref,
          placeholder,
          onBlur: () => state.commit(),
          onKeyDown,
        };
        return (
          <AriaTextField
            {...rest}
            {...toAriaControlProps(control)}
            {...hooks.slot('box')}
            value={state.value}
            onChange={state.setValue}
          >
            {multiline ? <TextArea {...input} /> : <Input {...input} />}
          </AriaTextField>
        );
      }}
    </Field>
  );
}
