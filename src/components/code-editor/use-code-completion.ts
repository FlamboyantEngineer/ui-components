'use client';

import type { RefObject } from 'react';
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
  completions: Completions | undefined;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  /** A read-only or disabled editor offers nothing. */
  isLocked: boolean;
  applyEdit: (edit: CodeEdit) => void;
  snippet: CodeSnippetSession;
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
  const length = input.value.length - (end - range.start) + parsed.text.length;
  const stops = [...parsed.fields, { start: parsed.text.length, end: parsed.text.length }].map(
    (stop) => ({ start: range.start + stop.start, end: range.start + stop.end }),
  );
  applyEdit({ start: range.start, end, text: parsed.text, selection: stops[0] as CodeRange });
  snippet.start(stops, length);
}

/**
 * Completion for a code editor's input: the shared completions engine completing the
 * identifier-like word before the caret, inserting snippets with their fields as editor edits.
 */
export function useCodeCompletion(options: CodeCompletionOptions): CompletionsModel {
  return useCompletions({
    completions: options.completions,
    inputRef: options.inputRef,
    isLocked: options.isLocked,
    findQuery: findCompletionQuery,
    insert: (option, range) => insertCompletion(option, range, options),
  });
}
