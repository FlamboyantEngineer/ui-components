'use client';

import { getComposedActiveElement, isFocused } from '../../utils/focus-target.js';
import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';
import type { CodeEdit, CodeSelection } from './code-editing.js';
import { isHTMLElement } from '../../utils/is-element.js';

interface CodeEditsOptions {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: ((value: string) => void) | undefined;
}

/** Gives focus back to `element`, with the selection its field held, once a borrow ends. */
function holdFocus(element: Element | null): () => void {
  if (!isHTMLElement(element)) return () => {};
  const isField = isHTMLElement(element, 'input') || isHTMLElement(element, 'textarea');
  const start = isField ? element.selectionStart : null;
  const end = isField ? element.selectionEnd : null;
  return () => {
    element.focus({ preventScroll: true });
    if (isField && start !== null && end !== null) element.setSelectionRange(start, end);
  };
}

/**
 * Edits the text area through the browser's own editing, which keeps the edit on its undo stack
 * as one step and reports it as input; `false` when the browser offers none. An edit made while
 * focus is elsewhere, such as a replacement from the search bar, borrows focus for the edit and
 * hands it back with its selection.
 */
function editNatively(input: HTMLTextAreaElement, edit: CodeEdit, next: string): boolean {
  const document = input.ownerDocument;
  if (typeof document.execCommand !== 'function') return false;
  const owner = getComposedActiveElement(input);
  const restore = owner === input ? null : holdFocus(owner);
  if (restore) input.focus({ preventScroll: true });
  try {
    if (!isFocused(input)) return false;
    input.setSelectionRange(edit.start, edit.end);
    document.execCommand(edit.text ? 'insertText' : 'delete', false, edit.text);
  } catch {
    return false;
  } finally {
    restore?.();
  }
  return input.value === next;
}

/**
 * Applies the editor's own edits (indentation, pairs, completions, replacements) through the
 * browser's editing, so undo keeps working wherever focus is, or else, without it, through
 * `onChange`, selecting the edit's selection once the new value is rendered.
 */
export function useCodeEdits({ inputRef, value, onChange }: CodeEditsOptions) {
  const pending = useRef<CodeSelection | null>(null);
  useLayoutEffect(() => {
    const input = inputRef.current;
    const selection = pending.current;
    if (!input || !selection || input.value !== value) return;
    pending.current = null;
    input.setSelectionRange(selection.start, selection.end);
  }, [inputRef, value]);
  return useCallback(
    (edit: CodeEdit) => {
      const input = inputRef.current;
      if (!input) return;
      const current = input.value;
      const next = `${current.slice(0, edit.start)}${edit.text}${current.slice(edit.end)}`;
      if (next !== current && !editNatively(input, edit, next)) {
        pending.current = edit.selection;
        onChange?.(next);
        return;
      }
      input.setSelectionRange(edit.selection.start, edit.selection.end);
    },
    [inputRef, onChange],
  );
}
