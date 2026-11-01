'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useFilter } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { OpenStateProps } from '../../core/events.js';
import { flattenPickerItems, usePickerEmptyContent } from '../field/field.js';
import {
  withKnownOptions,
  type ComboboxCompletion,
  type ComboboxItem,
  type ComboboxOption,
} from './combobox-options.js';
import { encodeComboboxItems } from './combobox-values.js';
import { useComboboxSearch, type ComboboxLoader } from './combobox-search.js';

interface InputTextOptions {
  inputValue?: string | undefined;
  defaultInputValue?: string | undefined;
  onInputChange?: ((text: string) => void) | undefined;
}

/** Where a combobox's suggestions come from and what its list shows. */
export interface ComboboxModelOptions extends OpenStateProps, InputTextOptions {
  items?: Iterable<ComboboxItem> | undefined;
  defaultItems?: Iterable<ComboboxItem> | undefined;
  knownOptions?: Iterable<ComboboxOption> | undefined;
  loadItems?: ComboboxLoader | undefined;
  minSearchLength?: number | undefined;
  searchDelay?: number | undefined;
  isPending?: boolean | undefined;
  isDisabled?: boolean | undefined;
  isReadOnly?: boolean | undefined;
  onLoadMore?: (() => void) | undefined;
  isLoading?: boolean | undefined;
  renderEmptyState?: (() => ReactNode) | undefined;
}

/**
 * Inline completion: the completion the input shows, and a filter that matches options against what
 * the reader typed rather than that completion, with an accent- and case-insensitive `contains`. Off,
 * the building block filters with its own default.
 */
export function useInlineCompletionState({
  completesInline = false,
  suggestions,
}: {
  completesInline?: boolean | undefined;
  suggestions: readonly ComboboxItem[];
}) {
  const options = useMemo(() => flattenPickerItems(suggestions), [suggestions]);
  const [completion, setCompletion] = useState<ComboboxCompletion | null>(null);
  const { contains } = useFilter({ sensitivity: 'base' });
  const completionFilter = useCallback(
    (text: string, input: string) =>
      contains(text, completion?.text === input ? completion.typed : input),
    [contains, completion],
  );
  if (!completesInline) return { defaultFilter: undefined, completion: null, field: null };
  return {
    defaultFilter: completionFilter,
    completion,
    field: { options, onComplete: setCompletion },
  };
}

/**
 * The input's text as the caller controls it or as the reader typed it. The suggestion list is a
 * collection React Aria builds before its state exists, so the add row reads the text from here.
 */
function useInputText({ inputValue, defaultInputValue, onInputChange }: InputTextOptions) {
  const [typed, setTyped] = useState(defaultInputValue ?? '');
  const onChange = (text: string) => {
    setTyped(text);
    onInputChange?.(text);
  };
  return { text: inputValue ?? typed, onInputChange: onChange };
}

/**
 * The open state (controlled or held here), the input's text, and the suggestions: the caller's, or
 * with `loadItems` the latest search's once the text is long enough to search, with the loading row,
 * busy state and empty content that go with them.
 */
export function useComboboxModel(options: ComboboxModelOptions) {
  const [open, setOpen] = useControllableState(
    options.isOpen,
    Boolean(options.defaultOpen),
    options.onOpenChange,
  );
  const isLocked = Boolean(options.isDisabled || options.isReadOnly);
  const isOpen = open && !isLocked;
  const input = useInputText(options);
  const search = useComboboxSearch({ ...options, isOpen, text: input.text });
  const renderEmpty = usePickerEmptyContent(search, options.renderEmptyState);
  const source = options.items ?? options.defaultItems;
  // A generator yields only once, so each source is read once and every projection shares the copy.
  const given = useMemo(() => Array.from(source ?? []), [source]);
  const suggestions = search && !search.isTooShort ? search.results : given;
  const flatOptions = useMemo(() => flattenPickerItems(suggestions), [suggestions]);
  const more = search?.hasMore
    ? { onLoadMore: search.loadMore, isLoading: search.isLoadingMore }
    : {};
  return {
    isOpen,
    // React Aria reports the open state it holds; reporting only changes keeps a controlled list quiet.
    onOpenChange: (next: boolean) => {
      if (next && isLocked) return;
      if (next !== isOpen) setOpen(next);
    },
    input,
    suggestions,
    /** Every suggested option with the caller's ids, sections opened. */
    flatOptions,
    /** The suggestions are the caller's filtered list or a search's results, never filtered here. */
    isControlled: Boolean(search ?? options.items),
    isPending: Boolean(options.isPending || search?.isLoading),
    loading: search ? more : { onLoadMore: options.onLoadMore, isLoading: options.isLoading },
    renderEmpty,
  };
}

/**
 * The suggestions with their ids encoded for React Aria, the caller's known options, and the
 * collection React Aria reads: the suggestions, joined by the known options while the list is
 * closed, so a chosen id the suggestions leave out keeps its label in the input.
 */
export function useComboboxCollection(
  model: { isOpen: boolean; suggestions: readonly ComboboxItem[] },
  knownOptions: Iterable<ComboboxOption> | undefined,
) {
  const { isOpen, suggestions: given } = model;
  const suggestions = useMemo(() => encodeComboboxItems(given), [given]);
  const known = useMemo(() => Array.from(knownOptions ?? []), [knownOptions]);
  const collection = useMemo(
    () => (isOpen ? suggestions : encodeComboboxItems(withKnownOptions(given, known))),
    [isOpen, given, suggestions, known],
  );
  return { suggestions, known, collection };
}
