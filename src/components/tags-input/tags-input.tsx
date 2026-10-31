'use client';

import { useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import {
  Field,
  useFieldControl,
  type FieldInputProps,
  type FieldTextInputProps,
} from '../field/field.js';
import { checkTag, hasTagDelimiter, resolveTagEntry, type TagRules } from './tag-entry.js';
import { TagsInputControl, tagsInputHooks as hooks } from './tags-input-parts.js';

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
}

/** The tag a field refused and the input text that still holds it. */
interface TagAttempt {
  tag: string;
  text: string;
}

const defaultDelimiters: readonly string[] = [','];

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
  ...props
}: TagsInputProps) {
  const strings = useUiStrings();
  const rules: TagRules = { delimiters, maxValues, allowsDuplicates, validateTag, strings };
  const [text, setText] = useControllableState(inputValue, '', onInputChange);
  const [attempt, setAttempt] = useState<TagAttempt | null>(null);
  // A refusal shows while the input still holds its text, checked against the current tags.
  const findRejection = (value: readonly string[]) =>
    attempt?.text === text ? checkTag(attempt.tag, value, rules) : null;
  const { state, field, rest } = useFieldControl(props, {
    initialValue: [],
    emptyValue: [],
    check: findRejection,
  });
  const rejection = findRejection(state.value);
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
        />
      )}
    </Field>
  );
}
