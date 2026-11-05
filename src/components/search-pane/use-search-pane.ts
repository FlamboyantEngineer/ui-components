'use client';

import { type KeyboardEvent, type Ref, useImperativeHandle, useRef } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { Key } from '../../core/props.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { isNode } from '../../utils/is-element.js';
import { useFocusRequest } from '../../utils/use-focus-request.js';
import {
  resolveSearchPaneState,
  type SearchPaneReplaceMode,
  type SearchPaneStatus,
  stepSearchResult,
} from './search-pane-state.js';
import type { SearchPaneResult } from './search-results.js';

/** Moves focus into a search pane, as Ctrl+F or Cmd+F and Ctrl+H or Cmd+H elsewhere in a host do. */
export interface SearchPaneHandle {
  /** Focuses the query and selects its text. */
  focusQuery: () => void;
  /** Shows the replace controls and focuses the replacement; does nothing when the pane cannot replace. */
  focusReplacement: () => void;
}

/** The pane's controlled pairs and the facts its state depends on. */
export interface SearchPaneModelOptions {
  query?: string | undefined;
  defaultQuery?: string | undefined;
  onQueryChange?: ((query: string) => void) | undefined;
  currentKey?: Key | null | undefined;
  defaultCurrentKey?: Key | null | undefined;
  onCurrentKeyChange?: ((key: Key) => void) | undefined;
  isReplaceExpanded?: boolean | undefined;
  defaultReplaceExpanded?: boolean | undefined;
  onReplaceExpandedChange?: ((isExpanded: boolean) => void) | undefined;
  results: readonly SearchPaneResult[];
  status: SearchPaneStatus;
  replaceMode: SearchPaneReplaceMode;
  onClose?: (() => void) | undefined;
  handleRef?: Ref<SearchPaneHandle> | undefined;
}

/** Focuses an input and selects its text. */
function selectInput(input: HTMLInputElement | null) {
  input?.focus();
  input?.select();
}

/**
 * The pane's state: the query, the current result and stepping with wrapping, the replace
 * disclosure, the inputs focus moves to, and the keys the pane handles anywhere inside it: Ctrl+F or
 * Cmd+F focuses the query, Ctrl+H or Cmd+H the replacement (unless the replace mode is `none`), and
 * Escape closes the pane, or else only keeps the query box from emptying, so the results stay. A
 * menu's keys are the menu's own, and a composing key the input method's.
 */
export function useSearchPane(options: SearchPaneModelOptions) {
  const { results, status, replaceMode, onClose, onCurrentKeyChange } = options;
  const isReplaceMode = replaceMode !== 'none';
  const [query, setQuery] = useControllableState(
    options.query,
    options.defaultQuery ?? '',
    options.onQueryChange,
  );
  const [currentKey, setCurrentKey] = useControllableState<Key | null>(
    options.currentKey,
    options.defaultCurrentKey ?? null,
    (key) => key !== null && onCurrentKeyChange?.(key),
  );
  const [isExpanded, setExpanded] = useControllableState(
    options.isReplaceExpanded,
    options.defaultReplaceExpanded ?? false,
    options.onReplaceExpandedChange,
  );
  const queryRef = useRef<HTMLInputElement>(null);
  const replacementRef = useRef<HTMLInputElement>(null);
  const requestFocus = useFocusRequest();
  const currentIndex = results.findIndex((result) => result.id === currentKey);
  const handle: SearchPaneHandle = {
    focusQuery: () => selectInput(queryRef.current),
    focusReplacement: () => {
      if (!isReplaceMode) return;
      // A hidden replacement box is drawn first, so focus moves once it has rendered.
      if (replacementRef.current) selectInput(replacementRef.current);
      else
        requestFocus(() => {
          replacementRef.current?.select();
          return replacementRef.current;
        });
      if (replaceMode === 'hidable') setExpanded(true);
    },
  };
  useImperativeHandle(options.handleRef, () => handle);
  const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isComposingKey(event.nativeEvent)) return;
    if (!isNode(event.target) || !event.currentTarget.contains(event.target)) return;
    const key = event.key.toLowerCase();
    const isCommand = (event.ctrlKey || event.metaKey) && !event.altKey;
    if (isCommand && (key === 'f' || (key === 'h' && isReplaceMode))) {
      event.preventDefault();
      if (key === 'f') handle.focusQuery();
      else handle.focusReplacement();
      return;
    }
    if (event.key !== 'Escape' || (!onClose && event.target !== queryRef.current)) return;
    event.preventDefault();
    event.stopPropagation();
    onClose?.();
  };
  return {
    queryRef,
    replacementRef,
    query,
    setQuery,
    state: resolveSearchPaneState(status, query, results.length),
    currentIndex,
    current: results[currentIndex],
    setCurrentIndex: (index: number) => {
      const result = results[index];
      if (result) setCurrentKey(result.id);
    },
    step: (by: 1 | -1) => {
      const result = results[stepSearchResult(currentIndex, results.length, by)];
      if (result) setCurrentKey(result.id);
    },
    isExpanded: replaceMode === 'shown' || (replaceMode === 'hidable' && isExpanded),
    setExpanded,
    onKeyDownCapture,
  };
}
