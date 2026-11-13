'use client';

import { type RefObject, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CodeEdit } from './code-editing.js';
import { type CodeRange, findMatches } from './code-ranges.js';

interface CodeSearchOptions {
  value: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  applyEdit: (edit: CodeEdit) => void;
}

export interface CodeSearchModel {
  isOpen: boolean;
  query: string;
  replacement: string;
  matches: readonly CodeRange[];
  /** The current match's index, or -1 without matches. */
  current: number;
  findRef: RefObject<HTMLInputElement | null>;
  /** Opens the panel with the selected text as the query and moves focus to the find box. */
  open(): void;
  /** Closes the panel and returns focus to the text area with the current match selected. */
  close(): void;
  setQuery(query: string): void;
  setReplacement(replacement: string): void;
  /** Moves to the next (1) or previous (-1) match, wrapping around. */
  step(delta: 1 | -1): void;
  replace(): void;
  replaceAll(): void;
}

/** The first match that starts at or after `offset`, wrapping to the first. */
function firstFrom(matches: readonly CodeRange[], offset: number): number {
  if (matches.length === 0) return -1;
  const index = matches.findIndex(({ start }) => start >= offset);
  return index === -1 ? 0 : index;
}

function selectionOf(input: HTMLTextAreaElement | null) {
  return input ? input.value.slice(input.selectionStart, input.selectionEnd) : '';
}

/**
 * Find and replace in a code editor: the matches of the query (ignoring case), the current one,
 * stepping through them and replacing one or all of them.
 */
export function useCodeSearch({ value, inputRef, applyEdit }: CodeSearchOptions): CodeSearchModel {
  const [isOpen, setOpen] = useState(false);
  const [query, setQueryState] = useState('');
  const [replacement, setReplacement] = useState('');
  const [anchor, setAnchor] = useState(0);
  const [focusRequest, setFocusRequest] = useState(0);
  const findRef = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    if (focusRequest === 0) return;
    findRef.current?.focus();
    findRef.current?.select();
  }, [focusRequest]);
  const matches = useMemo(() => (isOpen ? findMatches(value, query) : []), [isOpen, value, query]);
  const current = firstFrom(matches, anchor);
  const match = matches[current];

  const setQuery = (next: string) => {
    setAnchor(inputRef.current?.selectionStart ?? 0);
    setQueryState(next);
  };

  return {
    isOpen,
    query,
    replacement,
    matches,
    current,
    findRef,
    open() {
      const selected = selectionOf(inputRef.current);
      if (selected && !selected.includes('\n')) setQuery(selected);
      setOpen(true);
      setFocusRequest((request) => request + 1);
    },
    close() {
      setOpen(false);
      const input = inputRef.current;
      input?.focus();
      if (input && match) input.setSelectionRange(match.start, match.end);
    },
    setQuery,
    setReplacement,
    step(delta) {
      const next = matches[(current + delta + matches.length) % matches.length];
      if (next) setAnchor(next.start);
    },
    replace() {
      if (!match) return;
      const end = match.start + replacement.length;
      applyEdit({ ...match, text: replacement, selection: { start: end, end } });
      setAnchor(end);
    },
    replaceAll() {
      const first = matches[0];
      const last = matches.at(-1);
      if (!first || !last) return;
      const text = matches
        .map(
          (range, index) =>
            replacement + value.slice(range.end, matches[index + 1]?.start ?? range.end),
        )
        .join('');
      const end = first.start + text.length;
      applyEdit({ start: first.start, end: last.end, text, selection: { start: end, end } });
    },
  };
}
