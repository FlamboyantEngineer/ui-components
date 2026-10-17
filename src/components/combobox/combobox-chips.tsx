import { useContext, useState } from 'react';
import { ComboBoxStateContext, type Key } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Tag, TagGroup, type TagGroupSize } from '../tag-group/tag-group.js';
import type { ComboboxOption } from './combobox-options.js';

export interface ComboboxChipsProps {
  /** The combobox's label text, which names the group of chips. */
  label: string;
  /** The options the suggestions list now, to label the chips. */
  options: readonly ComboboxOption[];
  size: TagGroupSize;
  /** Chips offer a remove button and answer Delete and Backspace. */
  isEditable: boolean;
}

const hooks = createHooks('combobox', ['chips']);

/**
 * The chosen options, in value order. An option the suggestions no longer list (the caller filtered
 * it out) keeps the label it last had; a key no suggestion ever listed shows itself.
 */
function useChosenOptions(options: readonly ComboboxOption[]): ComboboxOption[] {
  const state = useContext(ComboBoxStateContext);
  const [remembered, setRemembered] = useState<ReadonlyMap<Key, ComboboxOption>>(new Map());
  const keys = Array.isArray(state?.value) ? (state.value as readonly Key[]) : [];
  const listed = options.filter((option) => keys.includes(option.id));
  const unseen = listed.filter((option) => remembered.get(option.id)?.label !== option.label);
  // Remembering what was listed during render keeps the chips in step with the selection.
  if (unseen.length > 0) {
    setRemembered(
      new Map([...remembered, ...unseen.map((option) => [option.id, option] as const)]),
    );
  }
  return keys.map(
    (key) =>
      listed.find((option) => option.id === key) ??
      remembered.get(key) ?? { id: key, label: String(key) },
  );
}

/**
 * A multiple combobox's chosen options as removable chips, in the library's `TagGroup` before the
 * input: the arrow keys move between chips, and the remove button, Delete or Backspace removes one.
 */
export function ComboboxChips({ label, options, size, isEditable }: ComboboxChipsProps) {
  const state = useContext(ComboBoxStateContext);
  const strings = useUiStrings();
  const chosen = useChosenOptions(options);
  if (!state || chosen.length === 0) return null;
  const onRemove = (removed: Set<Key>) =>
    state.setValue(chosen.map((option) => option.id).filter((key) => !removed.has(key)));
  return (
    <TagGroup
      className={hooks.slotClass('chips')}
      aria-label={strings.selectedValues(label)}
      size={size}
      items={chosen}
      onRemove={isEditable ? onRemove : undefined}
    >
      {(option) => (
        <Tag id={option.id} textValue={option.label}>
          {option.label}
        </Tag>
      )}
    </TagGroup>
  );
}
