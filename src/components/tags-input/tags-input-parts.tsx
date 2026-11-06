'use client';

import {
  type ClipboardEvent,
  type FocusEvent,
  type KeyboardEvent,
  memo,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Group, Input, type Key, useLocale } from '../../primitives/index.js';
import { isComposingInput, isComposingKey } from '../../utils/is-composing-key.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { createSlotRegistry, type SlotRegistry } from '../../utils/slot-registry.js';
import { assignOccurrenceKeys, type KeyedValue } from '../../utils/stable-keys.js';
import {
  type FieldControlProps,
  FieldFormValue,
  type FieldState,
  type FieldTextInputProps,
} from '../field/field.js';
import { Tag, TagGroup } from '../tag-group/tag-group.js';
import { type TagEdit, type TagEditing, useTagEditorControl } from './tag-editor.js';
import { tagsInputHooks as hooks } from './tags-input-hooks.js';

/** What the input does with text: type it, enter it as tags, or split a paste. */
interface TagsInputEntry {
  /** The text in the input. */
  text: string;
  /** Takes the input's new text; a delimiter in it adds the text before it as tags. */
  type(text: string): void;
  /** Takes the input's provisional text while an input method composes: no delimiter splits it. */
  compose(text: string): void;
  /** Adds the whole text as tags. */
  enter(text: string): void;
  /** Whether pasted text splits into tags; otherwise it pastes as typed text. */
  splits(text: string): boolean;
  /** Adds the typed text as tags when focus leaves the input for anything but the tags. */
  addOnBlur: boolean;
}

interface TagsInputControlProps {
  control: FieldControlProps;
  state: FieldState<string[]>;
  /** The field's label, which names the tags. */
  label: string;
  entry: TagsInputEntry;
  /** The text-entry attributes the input takes; the field focuses it on mount (`autoFocus`). */
  textInput: Omit<FieldTextInputProps, 'autoFocus'>;
  /** The form name each tag submits under. */
  name: string | undefined;
  /** The tags' editing, when the field lets the reader edit them. */
  editing: TagEditing | null;
}

type TagsInputSlots = SlotRegistry<'group' | 'input'>;

/** The tags' rows, in order. */
function readTagRows(slots: TagsInputSlots): HTMLElement[] {
  return [...(slots.read('group')?.querySelectorAll<HTMLElement>('[role="row"]') ?? [])];
}

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
  const readRows = () => readTagRows(slots);
  const focusLastTag = () => readRows().at(-1)?.focus();
  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (isComposingKey(event.nativeEvent)) return;
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

/**
 * The tags in the library's `TagGroup`. It renders again only when the tags or their state change,
 * not on each keystroke in the input, so typing stays fast with many tags.
 */
const TagsInputTags = memo(function TagsInputTags({
  tags,
  label,
  isDisabled,
  onRemove,
  edit,
  renderEditor,
}: {
  tags: ReadonlyArray<KeyedValue<string>>;
  label: string;
  isDisabled: boolean;
  onRemove: ((keys: Set<Key>) => void) | undefined;
  /** The open edit, whose tag shows its editor in place of its label and remove button. */
  edit: TagEdit | null;
  renderEditor: ((edit: TagEdit) => ReactNode) | null;
}) {
  // The collection caches each tag's render by its item, so the edited tag gets a new item.
  const items = edit
    ? tags.map((tag, index) => (index === edit.index ? { ...tag, edit } : tag))
    : tags;
  return (
    <TagGroup
      className={hooks.slotClass('tags')}
      aria-label={label}
      items={items}
      onRemove={edit ? undefined : onRemove}
      disabledKeys={isDisabled ? tags.map((tag) => tag.key) : undefined}
    >
      {(tag: KeyedValue<string> & { edit?: TagEdit }) =>
        tag.edit && renderEditor ? (
          <Tag id={tag.key} textValue={tag.value}>
            {renderEditor(tag.edit)}
          </Tag>
        ) : (
          <Tag id={tag.key}>{tag.value}</Tag>
        )
      }
    </TagGroup>
  );
});

/**
 * The field's control: the tags in the library's `TagGroup`, then the text input, framed as one
 * box, and a hidden input per tag for the form. Removing a tag returns focus to the input.
 */
export function TagsInputControl({
  control,
  state,
  label,
  entry,
  textInput,
  name,
  editing,
}: TagsInputControlProps) {
  const strings = useUiStrings();
  const [slots] = useState<TagsInputSlots>(() => createSlotRegistry());
  const inputRef = useMemo(() => mergeRefs(control.ref, slots.ref('input')), [control.ref, slots]);
  const { focusInput, onInputKeyDown, onTagKeyDownCapture, onBlur } = useEntryKeys(entry, slots);
  const tags = useMemo(() => assignOccurrenceKeys(state.value, (tag) => tag), [state.value]);
  const editor = useTagEditorControl({
    editing,
    readRows: () => readTagRows(slots),
    control,
    onTagKeyDownCapture,
  });
  const isEditable = !state.isReadOnly && !state.isDisabled;
  const { setValue, commit } = state;
  const remove = useCallback(
    (removed: Set<Key>) => {
      setValue(tags.filter((tag) => !removed.has(tag.key)).map((tag) => tag.value));
      commit();
      slots.read('input')?.focus();
    },
    [tags, setValue, commit, slots],
  );
  return (
    <>
      <Group
        {...hooks.slot('group', { editing: editor.edit !== null })}
        ref={slots.ref('group')}
        role="presentation"
        isDisabled={state.isDisabled}
        isInvalid={control['aria-invalid']}
        isReadOnly={state.isReadOnly}
        onClick={(event) => (event.target === event.currentTarget ? focusInput() : undefined)}
        onKeyDownCapture={editor.onKeyDownCapture}
        onDoubleClick={editor.onDoubleClick}
      >
        {tags.length > 0 ? (
          <TagsInputTags
            tags={tags}
            label={strings.selectedValues(label)}
            isDisabled={state.isDisabled}
            onRemove={isEditable ? remove : undefined}
            edit={editor.edit}
            renderEditor={editor.renderEditor}
          />
        ) : null}
        <Input
          {...control}
          {...hooks.slot('input')}
          ref={inputRef}
          value={entry.text}
          {...textInput}
          // Composed text stays as typed until the composition ends, then counts once.
          onChange={(event) =>
            isComposingInput(event.nativeEvent)
              ? entry.compose(event.target.value)
              : entry.type(event.target.value)
          }
          onCompositionEnd={(event) => entry.type(event.currentTarget.value)}
          onKeyDown={onInputKeyDown}
          onPaste={(event) => pasteTags(event, entry)}
          onBlur={onBlur}
        />
      </Group>
      <FieldFormValue
        name={name}
        value={tags.map((tag) => tag.value)}
        isDisabled={state.isDisabled}
      />
    </>
  );
}
