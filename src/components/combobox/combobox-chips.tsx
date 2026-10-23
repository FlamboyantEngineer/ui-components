import { useContext, useState } from 'react';
import { ComboBoxStateContext } from '../../primitives/index.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { createHooks } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon, toIconProps } from '../icon/icon.js';
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

const hooks = createHooks('combobox', ['chips', 'chip-icon']);

/**
 * The chosen options, in value order. An option the suggestions no longer list (the caller filtered
 * it out) keeps the label it last had; a key no suggestion ever listed shows itself.
 */
function useChosenOptions(options: readonly ComboboxOption[]): ComboboxOption[] {
  const state = useContext(ComboBoxStateContext);
  const [remembered, setRemembered] = useState<ReadonlyMap<Key, ComboboxOption>>(new Map());
  const keys = Array.isArray(state?.value)
    ? (state.value as readonly Key[]).map(fromCollectionKey)
    : [];
  const listed = new Map(options.map((option) => [option.id, option]));
  const next = new Map<Key, ComboboxOption>();
  for (const key of keys) {
    const option = listed.get(key) ?? remembered.get(key);
    if (option) next.set(key, option);
  }
  // Remember committed choices during render, retaining their latest labels and icons.
  if (
    next.size !== remembered.size ||
    [...next].some(([key, option]) => remembered.get(key) !== option)
  ) {
    setRemembered(next);
  }
  return keys.map((key) => next.get(key) ?? { id: key, label: String(key) });
}

/**
 * A multiple combobox's chosen options as removable chips, each with its option's icon, in the
 * library's `TagGroup` before the input: the arrow keys move between chips, and the remove button, Delete or Backspace removes one.
 */
export function ComboboxChips({ label, options, size, isEditable }: ComboboxChipsProps) {
  const state = useContext(ComboBoxStateContext);
  const strings = useUiStrings();
  const chosen = useChosenOptions(options);
  if (!state || chosen.length === 0) return null;
  const onRemove = (removed: Set<Key>) =>
    state.setValue(
      chosen
        .map((option) => option.id)
        .filter((key) => !removed.has(key))
        .map(toCollectionKey),
    );
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
          {option.icon ? (
            <Icon {...toIconProps(option.icon)} className={hooks.slotClass('chip-icon')} />
          ) : null}
          {option.label}
        </Tag>
      )}
    </TagGroup>
  );
}
