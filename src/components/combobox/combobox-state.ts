'use client';

import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useFilter } from '../../primitives/index.js';
import { useCloseWhenLocked } from '../../utils/use-close-when-locked.js';
import { flattenPickerItems, usePickerEmptyContent } from '../field/field.js';
import {
  type ComboboxCompletion,
  type ComboboxItem,
  type ComboboxOption,
  withKnownOptions,
} from './combobox-options.js';
import type {
  ComboboxInputChangeDetails,
  ComboboxInputChangeReason,
  ComboboxOpenChangeDetails,
  ComboboxOpenChangeReason,
} from './combobox-reasons.js';
import { type ComboboxLoader, useComboboxSearch } from './combobox-search.js';
import { encodeComboboxItems } from './combobox-values.js';

interface InputTextOptions {
  inputValue?: string | undefined;
  defaultInputValue?: string | undefined;
  onInputChange?: ((text: string, details: ComboboxInputChangeDetails) => void) | undefined;
}

/** Why the combobox's text and open state change, as its reasons read them. */
export interface ComboboxModelReasons {
  readInput: (text: string) => ComboboxInputChangeReason;
  readClose: () => ComboboxOpenChangeReason;
}

/** Where a combobox's suggestions come from and what its list shows. */
export interface ComboboxModelOptions extends InputTextOptions {
  isOpen?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((isOpen: boolean, details: ComboboxOpenChangeDetails) => void) | undefined;
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
function useInputText(
  { inputValue, defaultInputValue, onInputChange }: InputTextOptions,
  readInput: ComboboxModelReasons['readInput'],
) {
  const [typed, setTyped] = useState(defaultInputValue ?? '');
  const onChange = (text: string) => {
    setTyped(text);
    onInputChange?.(text, { reason: readInput(text) });
  };
  return { text: inputValue ?? typed, onInputChange: onChange };
}

/**
 * The open state (controlled or held here), the input's text, and the suggestions: the caller's, or
 * with `loadItems` the latest search's once the text is long enough to search, with the loading row,
 * busy state and empty content that go with them.
 */
export function useComboboxModel(options: ComboboxModelOptions, reasons: ComboboxModelReasons) {
  const openReasonRef = useRef<ComboboxOpenChangeReason>('dismiss');
  const [open, setOpen] = useControllableState(
    options.isOpen,
    Boolean(options.defaultOpen),
    (next) => options.onOpenChange?.(next, { reason: openReasonRef.current }),
  );
  const isLocked = Boolean(options.isDisabled || options.isReadOnly);
  const isOpen = open && !isLocked;
  const setOpenFor = (next: boolean, reason: ComboboxOpenChangeReason) => {
    openReasonRef.current = reason;
    setOpen(next);
  };
  useCloseWhenLocked(open, isLocked, () => setOpenFor(false, 'lock'));
  const input = useInputText(options, reasons.readInput);
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
    // React Aria names what opened the list; a close is a pick or a dismissal.
    onOpenChange: (next: boolean, trigger?: 'focus' | 'input' | 'manual') => {
      if (next && isLocked) return;
      if (next !== isOpen) setOpenFor(next, next ? (trigger ?? 'manual') : reasons.readClose());
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
