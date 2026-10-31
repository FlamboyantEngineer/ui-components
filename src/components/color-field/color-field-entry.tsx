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
 * The typeable closed control: a swatch button that opens the picker, then a text input showing the
 * colour in its format. Typed text applies when focus leaves the input and commits on Enter, or once
 * focus leaves the field: a colour in any CSS form sets the value, empty text clears an optional
 * one, and anything else is put back.
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
  const [draft, setDraft] = useState<string | null>(null);
  // Text that cannot become the value blocks the form until it is corrected or put back.
  const draftIssue = findDraftIssue(draft, { valueFormat, isRequired: state.isRequired, strings });
  const { setDraftIssue } = state;
  // After every commit: the field keeps the issue it has while the report says the same.
  useLayoutEffect(() => setDraftIssue(draftIssue));
  // Leaving the input only applies the text: the field commits once focus leaves it, so Tab
  // reaches its restore button.
  const apply = ({ shouldCommit }: { shouldCommit: boolean }) => {
    if (draft === null) return;
    setDraft(null);
    const typed = storeColorText(draft, valueFormat);
    const isCleared = typed === null && !draft.trim() && state.canClear;
    if (typed === null && !isCleared) return;
    state.setValue(typed);
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
        value={draft ?? (color ? formatColor(color, format) : '')}
        onChange={setDraft}
        onBlur={() => apply({ shouldCommit: false })}
        onKeyDown={(event) => {
          // Keys an input method composition owns neither apply nor drop the draft.
          if (isComposingKey(event.nativeEvent)) event.continuePropagation();
          else if (event.key === 'Enter') apply({ shouldCommit: true });
          else if (event.key === 'Escape' && draft !== null) setDraft(null);
          else event.continuePropagation();
        }}
      >
        <Input {...hooks.slot('input')} ref={control.ref} placeholder={placeholder} />
      </TextField>
    </div>
  );
}
