'use client';

import { ChevronDownGlyph, CloseGlyph, SearchGlyph } from '../../core/glyphs.js';
import {
  useContext,
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type RefCallback,
  type RefObject,
} from 'react';
import {
  Button as AriaButton,
  ComboBoxStateContext,
  Group,
  Input,
} from '../../primitives/index.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { FieldFormValue } from '../field/field.js';
import type { ControlSize } from '../../core/props.js';
import { ComboboxChips, type ComboboxChipsProps } from './combobox-chips.js';
import {
  findCompletion,
  type ComboboxCompletion,
  type ComboboxOption,
} from './combobox-options.js';
import { comboboxHooks as hooks } from './combobox-hooks.js';

interface ComboboxFieldProps {
  variant: 'default' | 'search';
  size: ControlSize;
  placeholder: string | undefined;
  isPending: boolean;
  /** Neither disabled nor read-only. */
  isEditable: boolean;
  /** A multiple combobox's label text and options, to show its chosen options as chips; else `null`. */
  chips: Pick<ComboboxChipsProps, 'label' | 'options' | 'known'> | null;
  /** Inline completion, or `null` when off. */
  completion: InlineCompletion | null;
  /** The input element, for the combobox's own use, and the ref to put on it. */
  input: { ref: RefObject<HTMLInputElement | null>; setRef: RefCallback<HTMLInputElement> };
}

/** What inline completion needs: the options it completes from and where it reports. */
interface InlineCompletion {
  options: readonly ComboboxOption[];
  onComplete: (completion: ComboboxCompletion | null) => void;
}

interface Selection {
  text: string;
  start: number;
}

/**
 * Empties the input and, for a single combobox, the selection, then returns focus to the input. A
 * multiple combobox keeps its chips, which have their own remove buttons.
 */
function ClearButton({ inputRef }: { inputRef: RefObject<HTMLInputElement | null> }) {
  const state = useContext(ComboBoxStateContext);
  const strings = useUiStrings();
  if (!state || state.inputValue === '') return null;
  return (
    <Button
      slot={null}
      icon={CloseGlyph}
      label={strings.clear}
      variant="bare"
      size="sm"
      className={hooks.slotClass('clear')}
      // Pressing keeps focus in the input, so an open list neither closes nor reverts the text
      // under the pointer, which would take the button away mid-press.
      preventFocusOnPress
      onPress={() => {
        if (!Array.isArray(state.value)) state.setSelectedKey(null);
        state.setInputValue('');
        inputRef.current?.focus();
      }}
    />
  );
}

/**
 * Completes typed text with the first option starting with it and selects the added part, so the
 * next keystroke replaces it. Only insertions at the end of the text complete; deleting text never
 * brings it back.
 */
function useInlineCompletion(
  completion: InlineCompletion | null,
  inputRef: RefObject<HTMLInputElement | null>,
) {
  const state = useContext(ComboBoxStateContext);
  const pending = useRef<Selection | null>(null);
  useLayoutEffect(() => {
    const input = inputRef.current;
    const selection = pending.current;
    if (!input || !selection || input.value !== selection.text) return;
    pending.current = null;
    input.setSelectionRange(selection.start, selection.text.length);
  });
  if (!completion || !state) return undefined;
  return (event: ChangeEvent<HTMLInputElement>) => {
    const native = event.nativeEvent as InputEvent;
    const { value: typed, selectionStart, selectionEnd } = event.target;
    // Only an insertion that leaves the caret at the end completes; an edit inside the text keeps
    // its caret where the reader is typing.
    const isAtEnd = selectionStart === typed.length && selectionEnd === typed.length;
    const found =
      native.inputType?.startsWith('insert') && !native.isComposing && isAtEnd
        ? findCompletion(completion.options, typed)
        : null;
    completion.onComplete(found);
    if (!found) return;
    pending.current = { text: found.text, start: typed.length };
    state.setInputValue(found.text);
  };
}

/** The field group: chips, the search glyph, the input, the busy indicator and the buttons. */
export function ComboboxField({
  variant,
  size,
  placeholder,
  isPending,
  isEditable,
  chips,
  completion,
  input,
}: ComboboxFieldProps) {
  const { ref: inputRef, setRef } = input;
  const onChange = useInlineCompletion(completion, inputRef);
  return (
    <Group className={hooks.slotClass('field')}>
      {/* Chips and the input wrap together, so the controls after them keep the trailing edge. */}
      <span {...hooks.slot('entry')}>
        {chips === null ? null : (
          <ComboboxChips {...chips} size={size === 'xs' ? 'sm' : size} isEditable={isEditable} />
        )}
        {variant === 'search' ? (
          <Glyph icon={SearchGlyph} className={hooks.slotClass('search-icon')} />
        ) : null}
        <Input
          ref={setRef}
          className={hooks.slotClass('input')}
          placeholder={placeholder}
          aria-busy={isPending || undefined}
          aria-autocomplete={completion ? 'both' : undefined}
          onChange={onChange}
        />
      </span>
      {isPending ? <span {...hooks.slot('spinner')} aria-hidden="true" /> : null}
      {isEditable ? <ClearButton inputRef={inputRef} /> : null}
      <AriaButton className={hooks.slotClass('button')}>
        <Glyph icon={ChevronDownGlyph} />
      </AriaButton>
    </Group>
  );
}

/** Submits original keys while collection primitives use their encoded identities. */
export function ComboboxInputs({
  name,
  isDisabled,
  isCustom,
}: {
  name: string | undefined;
  isDisabled: boolean | undefined;
  isCustom: boolean | undefined;
}) {
  const state = useContext(ComboBoxStateContext);
  if (!name || isCustom) return null;
  const value = state?.value ?? null;
  const submitted =
    value === null
      ? null
      : typeof value === 'object'
        ? value.map((key) => String(fromCollectionKey(key)))
        : String(fromCollectionKey(value));
  return <FieldFormValue name={name} value={submitted} isDisabled={isDisabled} />;
}
