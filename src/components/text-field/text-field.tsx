import { useState, type ReactNode, type Ref } from 'react';
import { TextField as AriaTextField } from '../../primitives/index.js';
import type { FocusEventProps, KeyboardEventProps } from '../../core/events.js';
import { useUiStrings } from '../../core/provider.js';
import { isAutoGrowing } from '../../utils/use-auto-grow.js';
import {
  ControlCompletionList,
  type Completion,
  type CompletionListItemState,
  type CompletionSource,
} from '../completion-list/completion-list.js';
import {
  Field,
  countCodePoints,
  toAriaControlProps,
  useFieldControl,
  validateString,
  type FieldInputProps,
  type FieldState,
  type FieldTextInputProps,
  type StringRules,
} from '../field/field.js';
import {
  TextFieldControl,
  TextFieldFrame,
  textFieldHooks as hooks,
  withCharacterCount,
  type TextFieldControlProps,
} from './text-field-parts.js';
import { useTextFieldInput, type TextFieldInput } from './use-text-field-input.js';

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
  /** A vocabulary for the word before the caret, or a source that completes the text at the caret. */
  completions?: readonly Completion[] | CompletionSource | undefined;
  /** Draws a completion's content in the list instead of its label and description. */
  renderCompletion?:
    | ((completion: Completion, state: CompletionListItemState) => ReactNode)
    | undefined;
  /** Receives the single-line input while it is on the page. */
  inputRef?: Ref<HTMLInputElement> | undefined;
  /** Receives the multiline text area while it is on the page. */
  textAreaRef?: Ref<HTMLTextAreaElement> | undefined;
  /** Text events and suggestion-list ARIA for the input or text area itself. */
  controlProps?: TextFieldControlProps | undefined;
}

/** The character count: the text as the length rules check it (trimmed with `trim`), by `getLength`. */
function countCharacters(value: string, { trim, getLength }: StringRules): number {
  return (getLength ?? countCodePoints)(trim ? value.trim() : value);
}

/** The field state, starting and clearing to an empty string, checked against the string rules. */
function useTextFieldControl<P extends FieldInputProps<string>>(props: P, rules: StringRules) {
  const strings = useUiStrings();
  return useFieldControl(props, {
    initialValue: '',
    emptyValue: '',
    check: (value) => validateString(value, rules, strings),
  });
}

/** The input shows the display value, so the value submits under the form name through a hidden input. */
function HiddenValue({ name, state }: { name: string | undefined; state: FieldState<string> }) {
  if (!name) return null;
  return <input type="hidden" name={name} value={state.value} disabled={state.isDisabled} />;
}

/** The completion list under the text field element, when the field offers completions. */
function TextFieldCompletions({
  edit,
  renderCompletion,
}: {
  edit: TextFieldInput;
  renderCompletion: TextFieldProps['renderCompletion'];
}) {
  if (!edit.completion) return null;
  return (
    <ControlCompletionList
      model={edit.completion.model}
      listId={edit.completion.listId}
      anchorRef={edit.boxRef}
      renderCompletion={renderCompletion}
      className={hooks.slotClass('completions')}
    />
  );
}

/**
 * A field for a plain string, on one line or several. It validates its length and format, commits
 * when focus leaves the field and on Enter, and reverts an edit on Escape. Adornments and a reveal button sit inside the
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
  completions,
  renderCompletion,
  onKeyDown,
  inputRef,
  textAreaRef,
  controlProps,
  ...props
}: TextFieldProps) {
  const rules = { minLength, maxLength, pattern, trim, getLength };
  const { state, field, rest } = useTextFieldControl(props, rules);
  const [isRevealed, setIsRevealed] = useState(false);
  const input = { placeholder, transformInput, displayValue, onKeyDown, completions };
  const edit = useTextFieldInput({ state, multiline, ...input });
  const isMasked = allowsReveal && rest.type === 'password';
  const count = showCount ? countCharacters(state.value, rules) : null;
  const autosize = multiline && isAutoGrowing({ minRows, maxRows });
  const data = { multiline, autosize, displayValue: edit.showsDisplayValue };
  const reveal = isMasked
    ? { label: field.label, isRevealed, isDisabled: state.isDisabled, onChange: setIsRevealed }
    : null;
  return (
    <Field
      {...field}
      {...hooks.root({ className: field.className, data })}
      description={withCharacterCount(field.description, { count, maxLength })}
      state={state}
      commitOnBlur
    >
      {(control) => (
        <>
          <AriaTextField
            {...rest}
            {...toAriaControlProps(control)}
            {...hooks.slot('box')}
            ref={edit.boxRef}
            name={displayValue === undefined ? rest.name : undefined}
            spellCheck={spellCheck?.toString()}
            type={isMasked && isRevealed ? 'text' : rest.type}
            value={edit.text}
            onChange={edit.onChange}
          >
            <TextFieldFrame
              startAdornment={startAdornment}
              endAdornment={endAdornment}
              reveal={reveal}
            >
              <TextFieldControl
                {...{ multiline, minRows, maxRows, edit, controlProps }}
                refs={{ field: control.ref, input: inputRef, textArea: textAreaRef }}
              />
            </TextFieldFrame>
          </AriaTextField>
          <TextFieldCompletions edit={edit} renderCompletion={renderCompletion} />
          {displayValue === undefined ? null : <HiddenValue name={rest.name} state={state} />}
        </>
      )}
    </Field>
  );
}

export type { TextFieldControlProps, TextFieldElement } from './text-field-parts.js';
