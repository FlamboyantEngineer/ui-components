'use client';

import { useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import {
  Field,
  type FieldInputProps,
  type FieldIssue,
  type FieldState,
  type FieldTextInputProps,
  useFieldControl,
} from '../field/field.js';
import { useTagEditing } from './tag-editor.js';
import {
  checkGivenTags,
  checkTag,
  hasNoTagText,
  hasTagDelimiter,
  replaceTag,
  resolveTagEntry,
  type TagRules,
} from './tag-entry.js';
import { tagsInputHooks as hooks } from './tags-input-hooks.js';
import { TagsInputControl } from './tags-input-parts.js';

export interface TagsInputProps extends FieldInputProps<string[]>, FieldTextInputProps {
  /** The text typed in the input and not yet added, controlled. */
  inputValue?: string | undefined;
  /** Called with the input's text as it changes. */
  onInputChange?: ((value: string) => void) | undefined;
  /** Characters that add the typed text as a tag, besides Enter. Defaults to a comma. */
  delimiters?: readonly string[] | undefined;
  /** The most tags the field takes; a tag past it is refused. */
  maxValues?: number | undefined;
  /** Accepts a tag equal to one the field already holds. */
  allowsDuplicates?: boolean | undefined;
  /** Checks a tag before it is added: a returned message refuses it. It must be pure. */
  validateTag?: ((tag: string) => string | null | undefined) | undefined;
  /** Adds the typed text as a tag when focus leaves the input. */
  addOnBlur?: boolean | undefined;
  /** Lets the reader edit a tag in place: Enter or F2 on a focused tag, or a double click. */
  allowsEditing?: boolean | undefined;
}

/** The tag a field refused and the input text that still holds it. */
interface TagAttempt {
  tag: string;
  text: string;
}

const defaultDelimiters: readonly string[] = [','];

/** Applies an edit of the tag at `index` as one committed change, or returns why it is refused. */
function acceptTagEdit(
  state: FieldState<string[]>,
  edit: { index: number; text: string; rules: TagRules },
): FieldIssue | null {
  const result = replaceTag({ value: state.value, ...edit });
  if (!result.ok) {
    // A refused edit is the reader's, so the field shows why whatever its mode.
    state.revealValidation();
    return result.issue;
  }
  if (result.value !== state.value) {
    state.setValue([...result.value]);
    state.commit();
  }
  return null;
}

/**
 * A field for a list of free-text values: typed text becomes a tag on Enter, on a delimiter or when
 * pasted as a list, and shows in the library's `TagGroup` before the input. A tag the field refuses
 * (past `maxValues`, a duplicate, or refused by `validateTag`) stays in the input and the field
 * shows why. It has the field base's label, validation, dirty state, restore, undo and menu.
 */
export function TagsInput({
  placeholder,
  autoComplete,
  inputMode,
  spellCheck,
  enterKeyHint,
  inputValue,
  onInputChange,
  delimiters = defaultDelimiters,
  maxValues,
  allowsDuplicates = false,
  validateTag,
  addOnBlur = false,
  allowsEditing = false,
  ...props
}: TagsInputProps) {
  const strings = useUiStrings();
  const rules: TagRules = { delimiters, maxValues, allowsDuplicates, validateTag, strings };
  const [text, setText] = useControllableState(inputValue, '', onInputChange);
  const [attempt, setAttempt] = useState<TagAttempt | null>(null);
  // A refusal shows while the input still holds its text, checked against the current tags.
  const findRejection = (value: readonly string[]) =>
    attempt?.text === text ? checkTag(attempt.tag, value, rules) : null;
  const [editIssue, setEditIssue] = useState<FieldIssue | null>(null);
  const { state, field, rest } = useFieldControl(props, {
    initialValue: [],
    emptyValue: [],
    isEmpty: hasNoTagText,
    check: (value) => findRejection(value) ?? editIssue ?? checkGivenTags(value, rules),
  });
  const editing = useTagEditing({
    value: state.value,
    isEnabled: allowsEditing && !state.isReadOnly && !state.isDisabled,
    accept: (index, text) => acceptTagEdit(state, { index, text, rules }),
  });
  // The open edit's refusal is the field's until the edit changes or ends.
  if (editIssue !== editing.issue) setEditIssue(editing.issue);
  const rejection = findRejection(state.value) ?? editing.issue;
  const enter = (entered: string, keepLast: boolean) => {
    if (state.isReadOnly || state.isDisabled) return;
    const result = resolveTagEntry(entered, { keepLast, value: state.value, rules });
    if (result.added.length > 0) {
      state.setValue([...state.value, ...result.added]);
      state.commit();
    }
    setText(result.inputValue);
    setAttempt(result.rejected === null ? null : { tag: result.rejected, text: result.inputValue });
    // A refused entry is an edit the reader made, so the field shows why whatever its mode.
    if (result.rejected !== null) state.revealValidation();
  };
  const entry = {
    text,
    type: (typed: string) =>
      hasTagDelimiter(typed, delimiters) ? enter(typed, true) : setText(typed),
    compose: setText,
    enter: (entered: string) => enter(entered, false),
    splits: (pasted: string) => hasTagDelimiter(pasted, delimiters),
    addOnBlur,
  };
  return (
    <Field
      {...field}
      {...hooks.root({ className: field.className })}
      // A required field left empty shows its own message first; a refusal is more recent.
      renderMessage={rejection ? () => rejection.message : field.renderMessage}
      state={state}
    >
      {(control) => (
        <TagsInputControl
          control={control}
          state={state}
          label={field.label}
          entry={entry}
          textInput={{ placeholder, autoComplete, inputMode, spellCheck, enterKeyHint }}
          name={rest.name}
          editing={allowsEditing ? editing : null}
        />
      )}
    </Field>
  );
}
