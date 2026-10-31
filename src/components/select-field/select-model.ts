'use client';

import { useId, useState, type KeyboardEvent, type Ref } from 'react';
import type { Key } from '../../core/props.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { FieldState } from '../field/field.js';
import type { SelectFieldOptionRenderer } from './select-option.js';
import { flattenPickerItems } from '../field/field.js';
import {
  diffSelectKeys,
  mergeSelectOptions,
  orderSelectKeys,
  resolveSelectOptions,
  toSelectKeys,
  type ChosenSelectOption,
  type SelectFieldItem,
} from './select-options.js';
import { useSelectSearch, type SelectFieldLoader } from './select-search.js';

/** A select field's value with its selection mode erased. */
export type SelectKeysValue = Key | Key[] | null;

export interface SelectConfig {
  options: readonly SelectFieldItem[];
  placeholder?: string | undefined;
  emptyLabel?: string | undefined;
  filterable?: boolean | undefined;
  loadOptions?: SelectFieldLoader | undefined;
  minSearchLength?: number | undefined;
  searchDelay?: number | undefined;
  isClearable?: boolean | undefined;
  maxValues?: number | undefined;
  renderOption?: SelectFieldOptionRenderer | undefined;
  virtualized?: boolean | undefined;
  isOpen?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
  name?: string | undefined;
  triggerRef?: Ref<HTMLButtonElement> | undefined;
}

interface SelectModelProps extends SelectConfig {
  state: FieldState<SelectKeysValue>;
  isMultiple: boolean;
}

function isSeedKey(event: KeyboardEvent<HTMLElement>): boolean {
  if (event.key.length !== 1 || event.key === ' ') return false;
  if (event.ctrlKey || event.metaKey || event.altKey || event.nativeEvent.isComposing) return false;
  return event.currentTarget.contains(event.target as Node);
}

// One empty set for every list that blocks nothing, so the rows that depend on it stay cached.
const noBlockedKeys: ReadonlySet<Key> = new Set();

/** The options a multiple select at its `maxValues` blocks: every one it has not chosen. */
function findBlockedKeys(
  keys: readonly Key[],
  known: readonly { id: Key }[],
  maxValues: number | undefined,
): ReadonlySet<Key> {
  if (maxValues === undefined || keys.length < maxValues) return noBlockedKeys;
  const chosen = new Set(keys);
  return new Set(known.map((option) => option.id).filter((key) => !chosen.has(key)));
}

/** The chosen keys; `''` stands for no value, as a native select's, unless an option has that id. */
function toChosenKeys(value: SelectKeysValue | undefined, known: readonly { id: Key }[]): Key[] {
  return value === '' && known.some((option) => option.id === '') ? [''] : toSelectKeys(value);
}

/**
 * The chosen, committed, listed and known options. A single select with an `emptyLabel` lists an
 * extra first option, under a generated key, that stands for no value.
 */
export function useSelectModel({ state, isMultiple, ...config }: SelectModelProps) {
  const emptyKey = useId();
  const search = useSelectSearch(config);
  const isRemote = Boolean(config.loadOptions);
  const known = mergeSelectOptions(flattenPickerItems(config.options), search.seen);
  const keys = toChosenKeys(state.value, known);
  const chosen = resolveSelectOptions(keys, known);
  const diff = state.isDirty
    ? diffSelectKeys(keys, toChosenKeys(state.committedValue, known))
    : { added: new Set<Key>(), removed: [] };
  const empty: ChosenSelectOption | null =
    config.emptyLabel && !isMultiple
      ? { id: emptyKey, label: config.emptyLabel, isMissing: false }
      : null;
  const listed = isRemote ? mergeSelectOptions(chosen, search.results) : config.options;
  const removed = resolveSelectOptions(diff.removed, known);
  const blockedKeys = isMultiple ? findBlockedKeys(keys, known, config.maxValues) : noBlockedKeys;
  return {
    search: isRemote ? search : null,
    known,
    keys,
    chosen,
    empty,
    added: diff.added,
    removed,
    blockedKeys,
    isFull: blockedKeys.size > 0,
    listed: empty ? [empty, ...listed] : listed,
    /** A single select's chosen option, the empty option standing for no value. */
    single: isMultiple ? null : (chosen[0] ?? empty),
    /** The committed option a single select's edit replaced. */
    previous: isMultiple ? null : (removed[0] ?? null),
  };
}

export type SelectModel = ReturnType<typeof useSelectModel>;

/** Open state (controlled or held here), the filter text and the actions that commit keys. */
export function useSelectActions(
  { state, isMultiple, ...config }: SelectModelProps,
  model: SelectModel,
  isFilterable: boolean,
) {
  const [open, setOwnOpen] = useControllableState(
    config.isOpen,
    Boolean(config.defaultOpen),
    config.onOpenChange,
  );
  const [filterText, setFilterText] = useState('');
  const isOpen = !state.isReadOnly && !state.isDisabled && open;
  const setOpen = (next: boolean) => {
    if (!next || (!state.isReadOnly && !state.isDisabled)) setOwnOpen(next);
  };
  const changeFilter = (text: string) => {
    setFilterText(text);
    model.search?.search(text);
  };
  const commitKeys = (next: readonly Key[]) => {
    const ordered = orderSelectKeys(next, model.known).filter((key) => key !== model.empty?.id);
    state.setValue(isMultiple ? ordered : (ordered[0] ?? null));
    state.commit();
  };
  return {
    isOpen,
    filterText,
    changeFilter,
    commitKeys,
    changeOpen(next: boolean) {
      if (!next) changeFilter('');
      setOpen(next);
    },
    seedFilter(event: KeyboardEvent<HTMLElement>) {
      const isEditable = !state.isReadOnly && !state.isDisabled;
      if (!isFilterable || isOpen || !isEditable || !isSeedKey(event)) return;
      event.preventDefault();
      event.stopPropagation();
      changeFilter(event.key);
      setOpen(true);
    },
  };
}
