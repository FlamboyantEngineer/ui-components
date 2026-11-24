'use client';

import { type KeyboardEvent, type RefObject, useId, useLayoutEffect, useRef } from 'react';
import { fitText } from '../../utils/fit-text.js';
import { isFocused } from '../../utils/focus-target.js';
import { getCompletionOptionId } from './completion-option-id.js';
import {
  type CompletionRange,
  type Completions,
  type CompletionsModel,
  useCompletions,
} from './use-completions.js';

type TextControl = HTMLInputElement | HTMLTextAreaElement;

interface CompletionEdit extends CompletionRange {
  insertion: string;
  value: string;
}

interface TextCompletionsOptions {
  completions: Completions | undefined;
  inputRef: RefObject<TextControl | null>;
  /** A read-only or disabled control offers nothing. */
  isLocked: boolean;
  /** Takes the new text when the browser cannot insert a completion as an edit. */
  setValue: (value: string) => void;
}

/** The text control's attributes that tie it to its list of completions. */
export interface CompletionInputAttributes {
  'aria-autocomplete': 'list';
  'aria-haspopup': 'listbox';
  'aria-controls': string | undefined;
  'aria-activedescendant': string | undefined;
}

export interface TextCompletions {
  model: CompletionsModel;
  /** The list's id. */
  listId: string;
  /** Props for the control: the list relationship, and the pointer and key handlers that follow the caret. */
  inputProps: CompletionInputAttributes & {
    onClick: () => void;
    onKeyUp: (event: KeyboardEvent<HTMLElement>) => void;
  };
}

const textWordBeforeCaret = /[\p{L}\p{N}_-]+$/u;

/** The letters, digits, `_` and `-` that end at `caret`, or `''`. */
function findTextQuery(value: string, caret: number): string {
  return textWordBeforeCaret.exec(value.slice(0, caret))?.[0] ?? '';
}

/**
 * A multiline or single-line text box that autocompletes from a list, with the active option as
 * its active descendant while the list is open. It keeps its text box role.
 */
export function toCompletionInputAttributes(
  model: CompletionsModel,
  listId: string,
): CompletionInputAttributes {
  return {
    'aria-autocomplete': 'list',
    'aria-haspopup': 'listbox',
    'aria-controls': model.isOpen ? listId : undefined,
    'aria-activedescendant': model.isOpen
      ? getCompletionOptionId(listId, model.activeIndex)
      : undefined,
  };
}

/** Whether the control has a caret; an email input, for one, has no selection API. */
function hasCaret(input: TextControl): boolean {
  return input.selectionStart !== null;
}

/**
 * Inserts text through the browser's own editing, which keeps it on the undo stack and reports it
 * as input; `false` when the control has no focus or the browser offers no such editing.
 */
function insertNatively(input: TextControl, edit: CompletionEdit): boolean {
  const before = input.value;
  const doc = input.ownerDocument;
  if (!isFocused(input) || typeof doc.execCommand !== 'function') return false;
  const caret = hasCaret(input);
  // Without a caret only the whole value can be selected, so the edit replaces all of it.
  if (caret) input.setSelectionRange(edit.start, edit.end);
  else input.select();
  // An input handler can rewrite the edited value. Once a browser edit has reached the control,
  // replaying the fallback would report the same edit twice or replace that rewrite.
  let didInput = false;
  const onInput = () => {
    didInput = true;
  };
  input.addEventListener('input', onInput);
  try {
    doc.execCommand('insertText', false, caret ? edit.insertion : edit.value);
  } catch {
    // Some browsers expose the command but cannot run it for this control.
  } finally {
    input.removeEventListener('input', onInput);
  }
  return didInput || input.value !== before;
}

/**
 * Completion for a text input or text area: the completions engine with plain insertion. A chosen
 * completion's `insertText` (or label) replaces the text it completes as an edit, and the caret
 * goes after it.
 */
export function useTextCompletions(options: TextCompletionsOptions): TextCompletions {
  const { inputRef, setValue } = options;
  const listId = `${useId()}-completions`;
  const pendingCaret = useRef<{ value: string; caret: number } | null>(null);
  useLayoutEffect(() => {
    const input = inputRef.current;
    const pending = pendingCaret.current;
    if (!input || !pending || input.value !== pending.value) return;
    pendingCaret.current = null;
    if (hasCaret(input)) input.setSelectionRange(pending.caret, pending.caret);
  });
  const model = useCompletions({
    completions: options.completions,
    inputRef,
    isLocked: options.isLocked,
    findQuery: findTextQuery,
    insert: (completion, range) => {
      const input = inputRef.current;
      if (!input) return;
      const before = input.value;
      const text = completion.insertText ?? completion.label;
      const normalized =
        input.localName === 'textarea' ? text.replace(/\r\n?/g, '\n') : text.replace(/[\r\n]/g, '');
      const end = Math.max(range.end, input.selectionStart ?? range.end);
      const room =
        input.maxLength < 0 ? Infinity : input.maxLength - before.length + end - range.start;
      const insertion = fitText(normalized, room);
      if (insertion === '' && text !== '') return;
      const value = `${before.slice(0, range.start)}${insertion}${before.slice(end)}`;
      const caret = range.start + insertion.length;
      if (value === before) {
        if (hasCaret(input)) input.setSelectionRange(caret, caret);
        return;
      }
      if (insertNatively(input, { start: range.start, end, insertion, value })) return;
      pendingCaret.current = { value, caret };
      setValue(value);
    },
  });
  return {
    model,
    listId,
    inputProps: {
      ...toCompletionInputAttributes(model, listId),
      onClick: () => model.track('move'),
      onKeyUp: (event) => model.handleKeyUp(event),
    },
  };
}
