'use client';

import {
  type ReactNode,
  type RefObject,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { ComboBoxStateContext } from '../../primitives/index.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { getElementByIdFrom } from '../../utils/owner-window.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { Tag, TagGroup, type TagGroupSize } from '../tag-group/tag-group.js';
import { comboboxHooks as hooks } from './combobox-hooks.js';
import type { ComboboxOption } from './combobox-options.js';
import { useMarkedAction } from './combobox-reasons.js';

export interface ComboboxChipsProps {
  /** The combobox's label text, which names the group of chips. */
  label: string;
  /** The options the suggestions list now, to label the chips. */
  options: readonly ComboboxOption[];
  /** Options that name chosen ids the suggestions do not list now. */
  known: readonly ComboboxOption[];
  size: TagGroupSize;
  /** Chips offer a remove button and answer Delete and Backspace. */
  isEditable: boolean;
}

/**
 * The chosen options, in value order. An option the suggestions no longer list is named by the known
 * option with its id, or keeps the label it last had; a key neither ever named shows itself.
 */
function useChosenOptions(
  options: readonly ComboboxOption[],
  known: readonly ComboboxOption[],
): ComboboxOption[] {
  const state = useContext(ComboBoxStateContext);
  const [remembered, setRemembered] = useState<ReadonlyMap<Key, ComboboxOption>>(new Map());
  const keys = Array.isArray(state?.value)
    ? (state.value as readonly Key[]).map(fromCollectionKey)
    : [];
  const listed = new Map([...known, ...options].map((option) => [option.id, option]));
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

interface ChipsLabelOptions {
  /** The combobox's label. */
  label: ReactNode;
  /** The combobox's own naming. */
  aria: AriaLabellingProps;
  /** The combobox shows chips; otherwise nothing is read. */
  isEnabled: boolean;
  /** The combobox's input, whose tree `aria-labelledby` ids are found in. */
  inputRef: RefObject<Element | null>;
}

/**
 * The text naming a multiple combobox, which names its chips, and the ref for its label element:
 * a text `label` or `aria-label` as given, else the text of the label element or of the elements
 * `aria-labelledby` names, read once they render, so a label drawn as markup or named elsewhere
 * still names the chips.
 */
export function useChipsLabel({ label, aria, isEnabled, inputRef }: ChipsLabelOptions) {
  const given = typeof label === 'string' ? label : aria['aria-label'];
  const labelledBy = aria['aria-labelledby'];
  const labelRef = useRef<HTMLLabelElement>(null);
  const [read, setRead] = useState('');
  useLayoutEffect(() => {
    if (!isEnabled || given !== undefined) return;
    const element = labelRef.current;
    const sources = labelledBy
      ? labelledBy.split(/\s+/).map((id) => getElementByIdFrom(element ?? inputRef.current, id))
      : [element];
    setRead(
      sources
        .map((source) => source?.textContent?.trim() ?? '')
        .filter(Boolean)
        .join(' '),
    );
  }, [isEnabled, given, label, labelledBy, inputRef]);
  return { text: given ?? read, labelRef };
}

/**
 * A multiple combobox's chosen options as removable chips, each with its option's icon, in the
 * library's `TagGroup` before the input: the arrow keys move between chips, and the remove button, Delete or Backspace removes one.
 */
export function ComboboxChips({ label, options, known, size, isEditable }: ComboboxChipsProps) {
  const state = useContext(ComboBoxStateContext);
  const strings = useUiStrings();
  const chosen = useChosenOptions(options, known);
  const runMarked = useMarkedAction();
  if (!state || chosen.length === 0) return null;
  const onRemove = (removed: Set<Key>) =>
    runMarked({ change: 'remove' }, () =>
      state.setValue(
        chosen
          .map((option) => option.id)
          .filter((key) => !removed.has(key))
          .map(toCollectionKey),
      ),
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
