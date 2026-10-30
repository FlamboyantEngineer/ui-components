'use client';

import { useRef, type KeyboardEvent, type RefObject } from 'react';
import type { CodeRange } from './code-ranges.js';

/** The fields of an inserted snippet the reader steps through with Tab and Shift+Tab. */
export interface CodeSnippetSession {
  /**
   * Starts stepping: `stops` are the fields, then the end of the insertion, in the text of
   * `length` characters the insertion makes; the first stop is selected.
   */
  start(stops: CodeRange[], length: number): void;
  /** Tab and Shift+Tab move between the stops; returns whether the key was used. */
  handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): boolean;
  end(): void;
}

interface SnippetState {
  stops: CodeRange[];
  index: number;
  /** The text length when the stops were last placed. */
  length: number;
}

/**
 * Stepping through a snippet's fields. The reader edits only the current field, so the fields
 * before it keep their offsets and those after it move by however much the text grew.
 */
export function useCodeSnippet(
  inputRef: RefObject<HTMLTextAreaElement | null>,
): CodeSnippetSession {
  const session = useRef<SnippetState | null>(null);
  const end = () => {
    session.current = null;
  };
  const step = (input: HTMLTextAreaElement, state: SnippetState, delta: number) => {
    const grown = input.value.length - state.length;
    const stops = state.stops.map((stop, index) => {
      if (index < state.index) return stop;
      if (index === state.index) return { start: stop.start, end: stop.end + grown };
      return { start: stop.start + grown, end: stop.end + grown };
    });
    const current = stops[state.index] as CodeRange;
    const caret = input.selectionStart;
    if (caret < current.start || caret > current.end) return false;
    const index = Math.max(0, state.index + delta);
    const target = stops[index] as CodeRange;
    input.setSelectionRange(target.start, target.end);
    session.current =
      index >= stops.length - 1 ? null : { stops, index, length: input.value.length };
    return true;
  };
  return {
    start(stops, length) {
      session.current = stops.length < 2 ? null : { stops, index: 0, length };
    },
    handleKeyDown(event) {
      const input = inputRef.current;
      const state = session.current;
      if (!input || !state || event.key !== 'Tab') return false;
      if (!step(input, state, event.shiftKey ? -1 : 1)) {
        end();
        return false;
      }
      event.preventDefault();
      return true;
    },
    end,
  };
}
