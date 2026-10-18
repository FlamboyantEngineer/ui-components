import { useMemo, useState, type ClipboardEvent, type FocusEvent, type KeyboardEvent } from 'react';
import { Group, Input, useLocale, type Key } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { createSlotRegistry, type SlotRegistry } from '../../utils/slot-registry.js';
import { assignOccurrenceKeys, type KeyedValue } from '../../utils/stable-keys.js';
import type { FieldControlProps, FieldState } from '../field/field.js';
import { Tag, TagGroup } from '../tag-group/tag-group.js';

/** What the input does with text: type it, enter it as tags, or split a paste. */
export interface TagsInputEntry {
  /** The text in the input. */
  text: string;
  /** Takes the input's new text; a delimiter in it adds the text before it as tags. */
  type(text: string): void;
  /** Adds the whole text as tags. */
  enter(text: string): void;
  /** Whether pasted text splits into tags; otherwise it pastes as typed text. */
  splits(text: string): boolean;
  /** Adds the typed text as tags when focus leaves the input for anything but the tags. */
  addOnBlur: boolean;
}

export interface TagsInputControlProps {
  control: FieldControlProps;
  state: FieldState<string[]>;
  /** The field's label, which names the tags. */
  label: string;
  entry: TagsInputEntry;
  placeholder: string | undefined;
  /** The form name each tag submits under. */
  name: string | undefined;
}

export const tagsInputHooks = createHooks('tags-input', ['group', 'tags', 'input']);

const hooks = tagsInputHooks;

type TagsInputSlots = SlotRegistry<'group' | 'input'>;

/** The keys that move from the input into the tags and from the last tag back, in reading order. */
function useArrowKeys() {
  const { direction } = useLocale();
  return direction === 'rtl'
    ? { towardTags: 'ArrowRight', towardInput: 'ArrowLeft' }
    : { towardTags: 'ArrowLeft', towardInput: 'ArrowRight' };
}

/**
 * The input's keys (Enter adds, Backspace in an empty input and the arrow key at its start move to
 * the last tag), the last tag's key back to the input, and adding on blur.
 */
function useEntryKeys(entry: TagsInputEntry, slots: TagsInputSlots) {
  const keys = useArrowKeys();
  const focusInput = () => slots.read('input')?.focus();
  const readRows = () => [
    ...(slots.read('group')?.querySelectorAll<HTMLElement>('[role="row"]') ?? []),
  ];
  const focusLastTag = () => readRows().at(-1)?.focus();
  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    const { selectionStart, selectionEnd } = event.currentTarget;
    if (event.key === 'Enter' && entry.text.trim() !== '') {
      event.preventDefault();
      entry.enter(entry.text);
    } else if (event.key === 'Backspace' && entry.text === '') {
      focusLastTag();
    } else if (event.key === keys.towardTags && selectionStart === 0 && selectionEnd === 0) {
      event.preventDefault();
      focusLastTag();
    }
  };
  // The tag group wraps from its last tag to its first; in a tags input that key returns to the input.
  const onTagKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== keys.towardInput || event.target !== readRows().at(-1)) return;
    event.preventDefault();
    event.stopPropagation();
    focusInput();
  };
  const onBlur = (event: FocusEvent<HTMLInputElement>) => {
    const isInside = slots.read('group')?.contains(event.relatedTarget as Node | null);
    if (entry.addOnBlur && !isInside && entry.text.trim() !== '') entry.enter(entry.text);
  };
  return { focusInput, onInputKeyDown, onTagKeyDownCapture, onBlur };
}

/** Pastes text with a delimiter or line break as tags, in place of the input's selection. */
function pasteTags(event: ClipboardEvent<HTMLInputElement>, entry: TagsInputEntry) {
  const pasted = event.clipboardData.getData('text/plain');
  if (!entry.splits(pasted)) return;
  event.preventDefault();
  const { value, selectionStart, selectionEnd } = event.currentTarget;
  const start = selectionStart ?? value.length;
  entry.enter(value.slice(0, start) + pasted + value.slice(selectionEnd ?? start));
}

/** Hidden inputs that submit each tag under the form name; a disabled field submits nothing. */
function TagInputs({
  name,
  tags,
  isDisabled,
}: {
  name: string;
  tags: ReadonlyArray<KeyedValue<string>>;
  isDisabled: boolean;
}) {
  return tags.map((tag) => (
    <input key={tag.key} type="hidden" name={name} value={tag.value} disabled={isDisabled} />
  ));
}

/**
 * The field's control: the tags in the library's `TagGroup`, then the text input, framed as one
 * box, and a hidden input per tag for the form. Removing a tag returns focus to the input.
 */
export function TagsInputControl({
  control,
  state,
  label,
  entry,
  placeholder,
  name,
}: TagsInputControlProps) {
  const strings = useUiStrings();
  const [slots] = useState<TagsInputSlots>(() => createSlotRegistry());
  const inputRef = useMemo(() => mergeRefs(control.ref, slots.ref('input')), [control.ref, slots]);
  const { focusInput, onInputKeyDown, onTagKeyDownCapture, onBlur } = useEntryKeys(entry, slots);
  const tags = assignOccurrenceKeys(state.value, (tag) => tag);
  const isEditable = !state.isReadOnly && !state.isDisabled;
  const remove = (removed: Set<Key>) => {
    state.setValue(tags.filter((tag) => !removed.has(tag.key)).map((tag) => tag.value));
    state.commit();
    focusInput();
  };
  return (
    <>
      <Group
        {...hooks.slot('group')}
        ref={slots.ref('group')}
        role="presentation"
        isDisabled={state.isDisabled}
        isInvalid={control['aria-invalid']}
        isReadOnly={state.isReadOnly}
        onClick={(event) => (event.target === event.currentTarget ? focusInput() : undefined)}
        onKeyDownCapture={onTagKeyDownCapture}
      >
        {tags.length > 0 ? (
          <TagGroup
            className={hooks.slotClass('tags')}
            aria-label={strings.selectedValues(label)}
            items={tags}
            onRemove={isEditable ? remove : undefined}
            disabledKeys={state.isDisabled ? tags.map((tag) => tag.key) : undefined}
          >
            {(tag) => <Tag id={tag.key}>{tag.value}</Tag>}
          </TagGroup>
        ) : null}
        <Input
          {...control}
          {...hooks.slot('input')}
          ref={inputRef}
          value={entry.text}
          placeholder={placeholder}
          onChange={(event) => entry.type(event.target.value)}
          onKeyDown={onInputKeyDown}
          onPaste={(event) => pasteTags(event, entry)}
          onBlur={onBlur}
        />
      </Group>
      {name ? <TagInputs name={name} tags={tags} isDisabled={state.isDisabled} /> : null}
    </>
  );
}
