'use client';

import { useLayoutEffect, useRef, type RefObject } from 'react';
import { isFocused } from '../../utils/focus-target.js';
import { isShallowEqual } from '../../utils/is-shallow-equal.js';
import {
  useCompletions,
  type Completion,
  type CompletionRange,
  type Completions,
  type CompletionsModel,
} from '../completion-list/completion-list.js';
import { indentationAt, type CodeEdit } from './code-editing.js';
import type { CodeRange } from './code-ranges.js';
import { findCompletionQuery, indentInsertion, parseSnippet } from './completion-match.js';
import type { CodeSnippetSession } from './use-code-snippet.js';

interface CodeCompletionOptions {
  value: string;
  completions: Completions | undefined;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  /** A read-only or disabled editor offers nothing. */
  isLocked: boolean;
  applyEdit: (edit: CodeEdit) => void;
  snippet: CodeSnippetSession;
}

interface PendingInput {
  input: HTMLTextAreaElement;
  previousValue: string;
  value: string;
  selectionStart: number;
  selectionEnd: number;
  source: Completions | undefined;
}

function isSameInputSource(left: Completions | undefined, right: Completions | undefined) {
  if (left === right) return true;
  if (!left || !right || typeof left === 'function' || typeof right === 'function') return false;
  return (
    left.length === right.length &&
    left.every((option, index) => isShallowEqual(option, right[index]))
  );
}

/** Retargets an input session at the controlled commit, before the engine checks for replacements. */
function useInputCompletionCommit(options: CodeCompletionOptions) {
  const pending = useRef<PendingInput | null>(null);
  const trackRef = useRef<CompletionsModel['track'] | null>(null);
  useLayoutEffect(() => {
    const edit = pending.current;
    if (!edit) return;
    const input = options.inputRef.current;
    if (
      input !== edit.input ||
      !isFocused(input) ||
      options.isLocked ||
      !isSameInputSource(edit.source, options.completions)
    ) {
      pending.current = null;
      return;
    }
    // A collection may first commit the editor's own state with its previous controlled props.
    if (options.value !== edit.value) {
      if (options.value !== edit.previousValue) pending.current = null;
      return;
    }
    pending.current = null;
    if (
      input.value === edit.value &&
      input.selectionStart === edit.selectionStart &&
      input.selectionEnd === edit.selectionEnd
    )
      trackRef.current?.('input');
  });
  useLayoutEffect(
    () => () => {
      pending.current = null;
      trackRef.current = null;
    },
    [],
  );
  return {
    trackRef,
    capture() {
      const input = options.inputRef.current;
      if (!input) return;
      const { value, selectionStart, selectionEnd } = input;
      pending.current = {
        input,
        previousValue: options.value,
        value,
        selectionStart,
        selectionEnd,
        source: options.completions,
      };
    },
    cancel() {
      pending.current = null;
    },
  };
}

/** Inserts a completion over the text it replaces, selecting its first field or the end. */
function insertCompletion(
  option: Completion,
  range: CompletionRange,
  { inputRef, applyEdit, snippet }: CodeCompletionOptions,
) {
  const input = inputRef.current;
  if (!input) return;
  const end = Math.max(range.end, input.selectionStart);
  const indentation = indentationAt(input.value, range.start);
  const parsed = indentInsertion(
    option.insertText === undefined
      ? { text: option.label, fields: [] }
      : parseSnippet(option.insertText),
    indentation,
  );
  const text = input.value.slice(0, range.start) + parsed.text + input.value.slice(end);
  const stops = [...parsed.fields, { start: parsed.text.length, end: parsed.text.length }].map(
    (stop) => ({ start: range.start + stop.start, end: range.start + stop.end }),
  );
  applyEdit({ start: range.start, end, text: parsed.text, selection: stops[0] as CodeRange });
  snippet.start(stops, text);
}

/**
 * Completion for a code editor's input: the shared completions engine completing the
 * identifier-like word before the caret, inserting snippets with their fields as editor edits.
 */
export function useCodeCompletion(options: CodeCompletionOptions): CompletionsModel {
  // This hook's layout effect precedes the shared engine's replaced-text reconciliation.
  const { trackRef, capture, cancel } = useInputCompletionCommit(options);
  const completion = useCompletions({
    completions: options.completions,
    inputRef: options.inputRef,
    isLocked: options.isLocked,
    findQuery: findCompletionQuery,
    insert: (option, range) => insertCompletion(option, range, options),
  });
  useLayoutEffect(() => {
    trackRef.current = completion.track;
  });
  return {
    ...completion,
    track(reason) {
      if (reason === 'input') return capture();
      cancel();
      completion.track(reason);
    },
    close() {
      cancel();
      completion.close();
    },
    handleKeyDown(event) {
      cancel();
      return completion.handleKeyDown(event);
    },
  };
}
