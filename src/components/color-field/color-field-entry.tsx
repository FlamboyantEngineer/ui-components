'use client';

import { useLayoutEffect, useState } from 'react';
import { Button as AriaButton, Input, TextField } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { ColorSwatch } from '../color-swatch/color-swatch.js';
import {
  toAriaControlProps,
  type FieldControlProps,
  type FieldIssue,
  type FieldState,
} from '../field/field.js';
import { colorFieldHooks as hooks } from './color-field-hooks.js';
import { formatColor, storeColorText, type ColorFieldFormat } from './color-values.js';
import { isComposingKey } from '../../utils/is-composing-key.js';

interface ColorEntryProps {
  control: FieldControlProps;
  state: FieldState<string | null>;
  label: string;
  /** The value as a CSS colour, or `null` without one. */
  color: string | null;
  format: ColorFieldFormat;
  valueFormat: ColorFieldFormat;
  placeholder: string;
}

/**
 * The problem with typed text that cannot become the value: empty text in a required field, or
 * text that is no colour. Untouched text (`null`) is the value itself.
 */
function findDraftIssue(
  draft: string | null,
  {
    valueFormat,
    isRequired,
    strings,
  }: { valueFormat: ColorFieldFormat; isRequired: boolean; strings: UiStrings },
): FieldIssue | null {
  if (draft === null) return null;
  if (!draft.trim()) {
    return isRequired
      ? { severity: 'error', message: strings.valueRequired, validity: 'valueMissing' }
      : null;
  }
  return storeColorText(draft, valueFormat) === null
    ? { severity: 'error', message: strings.colorUnreadable }
    : null;
}

/**
 * Typed text and the value it was typed against: `value` is the value the text left the field
 * with, `before` the value it started from.
 */
interface ColorDraft {
  text: string;
  value: string | null;
  before: string | null;
}

/**
 * The typeable closed control: a swatch button that opens the picker, then a text input showing the
 * colour in its format. Typed text that is a colour in any CSS form sets the value as it is typed,
 * and empty text clears an optional one; the value commits on Enter or once focus leaves the field.
 * Other text blocks the form until it is corrected; Escape, Enter or leaving the input puts back the
 * value the typing started from. A value replaced from outside retires the typed text.
 */
export function ColorEntry({
  control,
  state,
  label,
  color,
  format,
  valueFormat,
  placeholder,
}: ColorEntryProps) {
  const strings = useUiStrings();
  const [draft, setDraft] = useState<ColorDraft | null>(null);
  // A value that is not the one the text left the field with comes from elsewhere.
  if (draft && draft.value !== state.value) setDraft(null);
  const current = draft?.value === state.value ? draft : null;
  const draftIssue = findDraftIssue(current?.text ?? null, {
    valueFormat,
    isRequired: state.isRequired,
    strings,
  });
  const { setDraftIssue } = state;
  // After every commit: the field keeps the issue it has while the report says the same.
  useLayoutEffect(() => setDraftIssue(draftIssue));
  const type = (text: string) => {
    const typed = storeColorText(text, valueFormat);
    const isCleared = typed === null && !text.trim() && !state.isRequired;
    const value = typed !== null || isCleared ? typed : state.value;
    if (value !== state.value) state.setValue(value);
    setDraft({ text, value, before: current?.before ?? state.value });
  };
  const putBack = () => {
    if (!current) return;
    setDraft(null);
    if (current.before !== state.value) state.setValue(current.before);
  };
  // Leaving the input keeps the colour typed, or puts back the value text that is none started
  // from; the field commits once focus leaves it, so Tab reaches its restore button.
  const finish = ({ shouldCommit }: { shouldCommit: boolean }) => {
    if (draftIssue) putBack();
    else setDraft(null);
    if (shouldCommit) state.commit();
  };
  return (
    <div {...hooks.slot('group')}>
      <AriaButton
        {...hooks.slot('trigger')}
        aria-label={strings.colorPicker(label)}
        isDisabled={control.disabled || control.readOnly}
      >
        <ColorSwatch color={color} size="sm" className={hooks.slotClass('swatch')} />
      </AriaButton>
      <TextField
        {...toAriaControlProps(control)}
        className={hooks.slotClass('entry')}
        value={current?.text ?? (color ? formatColor(color, format) : '')}
        onChange={type}
        onBlur={() => finish({ shouldCommit: false })}
        onKeyDown={(event) => {
          // Keys an input method composition owns neither apply nor drop the draft.
          if (isComposingKey(event.nativeEvent)) event.continuePropagation();
          else if (event.key === 'Enter') finish({ shouldCommit: true });
          else if (event.key === 'Escape' && current) putBack();
          else event.continuePropagation();
        }}
      >
        <Input {...hooks.slot('input')} ref={control.ref} placeholder={placeholder} />
      </TextField>
    </div>
  );
}
