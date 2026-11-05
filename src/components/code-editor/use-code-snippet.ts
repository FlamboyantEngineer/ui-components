'use client';

import { type KeyboardEvent, type RefObject, useRef } from 'react';
import type { CodeRange } from './code-ranges.js';

/** The fields of an inserted snippet the reader steps through with Tab and Shift+Tab. */
export interface CodeSnippetSession {
  /**
   * Starts stepping: `stops` are the fields, then the end of the insertion, in the `text` the
   * insertion makes; the first stop is selected.
   */
  start(stops: CodeRange[], text: string): void;
  /**
   * Tab and Shift+Tab move between the stops; returns whether the key was used. Stepping ends
   * when the editor is locked or the text changed outside the current field.
   */
  handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): boolean;
  end(): void;
}

interface SnippetState {
  stops: CodeRange[];
  index: number;
  /** The text when the stops were last placed. */
  text: string;
}

/**
 * The current field in `text`, when `text` differs from the session's text only inside that field;
 * a replaced, reset or undone text, or an edit elsewhere, has no field.
 */
function placeField(state: SnippetState, text: string): CodeRange | null {
  const field = state.stops[state.index] as CodeRange;
  const after = state.text.length - field.end;
  const end = text.length - after;
  const kept =
    end >= field.start &&
    text.startsWith(state.text.slice(0, field.start)) &&
    text.endsWith(state.text.slice(field.end));
  return kept ? { start: field.start, end } : null;
}

/**
 * Stepping through a snippet's fields. The reader edits only the current field, so the fields
 * before it keep their offsets and those after it move by however much the text grew. Any other
 * change to the text or a lock ends the stepping, as do blur and Escape (`end`).
 */
export function useCodeSnippet(
  inputRef: RefObject<HTMLTextAreaElement | null>,
): CodeSnippetSession {
  const session = useRef<SnippetState | null>(null);
  const end = () => {
    session.current = null;
  };
  const step = (input: HTMLTextAreaElement, state: SnippetState, delta: number) => {
    const current = placeField(state, input.value);
    const caret = input.selectionStart;
    if (!current || caret < current.start || caret > current.end) return false;
    const grown = current.end - (state.stops[state.index] as CodeRange).end;
    const stops = state.stops.map((stop, index) => {
      if (index < state.index) return stop;
      if (index === state.index) return current;
      return { start: stop.start + grown, end: stop.end + grown };
    });
    const index = Math.max(0, state.index + delta);
    const target = stops[index] as CodeRange;
    input.setSelectionRange(target.start, target.end);
    session.current = index >= stops.length - 1 ? null : { stops, index, text: input.value };
    return true;
  };
  return {
    start(stops, text) {
      session.current = stops.length < 2 ? null : { stops, index: 0, text };
    },
    handleKeyDown(event) {
      const input = inputRef.current;
      const state = session.current;
      if (!input || !state || event.key !== 'Tab') return false;
      if (input.readOnly || input.disabled || !step(input, state, event.shiftKey ? -1 : 1)) {
        end();
        return false;
      }
      event.preventDefault();
      return true;
    },
    end,
  };
}
