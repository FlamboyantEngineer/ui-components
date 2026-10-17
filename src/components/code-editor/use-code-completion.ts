import { useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { indentationAt, type CodeEdit } from './code-editing.js';
import type { CodeRange } from './code-ranges.js';
import {
  findCompletionQuery,
  indentInsertion,
  matchCompletions,
  parseSnippet,
  type CodeCompletion,
} from './completion-match.js';
import type { CodeSnippetSession } from './use-code-snippet.js';

/** What a completion source knows about the place it completes. */
export interface CodeCompletionContext {
  value: string;
  caret: number;
  /** The identifier-like word before the caret. */
  query: string;
  /** The reader asked for completions with Ctrl+Space. */
  isExplicit: boolean;
}

/** A source's completions, and the text they replace when it is not the word before the caret. */
export interface CodeCompletionResult {
  options: readonly CodeCompletion[];
  /** Where the replaced text starts; the typed text from here to the caret filters the options. */
  from?: number | undefined;
  /** Where the replaced text ends, at or after the caret. */
  to?: number | undefined;
}

export type CodeCompletionAnswer = readonly CodeCompletion[] | CodeCompletionResult;

/** Completes the place at the caret, at once or later. */
export type CodeCompletionSource = (
  context: CodeCompletionContext,
) => CodeCompletionAnswer | Promise<CodeCompletionAnswer>;

export interface CodeCompletionOptions {
  completions: readonly CodeCompletion[] | CodeCompletionSource | undefined;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  /** A read-only or disabled editor offers nothing. */
  isLocked: boolean;
  applyEdit: (edit: CodeEdit) => void;
  snippet: CodeSnippetSession;
}

/** Why the completions are looked up: an edit, a caret move or the reader's request. */
export type CompletionTrigger = 'input' | 'move' | 'explicit';

export interface CodeCompletionModel {
  isOpen: boolean;
  options: readonly CodeCompletion[];
  activeIndex: number;
  /** The caret offset the list belongs to. */
  caret: number;
  /** Changes whenever the caret moves on screen, so the list follows it. */
  anchorKey: number;
  setActiveIndex(index: number): void;
  apply(option: CodeCompletion): void;
  /** Looks the completions up for the caret after it moved. */
  track(trigger: CompletionTrigger): void;
  /** Follows the caret after the input scrolled. */
  reposition(): void;
  close(): void;
  /** Handles the list's keys while it is open; returns whether the key was used. */
  handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): boolean;
  /** Follows the caret after a navigation key the list did not use. */
  handleKeyUp(event: KeyboardEvent<HTMLTextAreaElement>): void;
}

interface CompletionState extends CodeRange {
  caret: number;
  options: readonly CodeCompletion[];
  activeIndex: number;
  isOpen: boolean;
  anchorKey: number;
}

interface Lookup {
  value: string;
  caret: number;
  query: string;
  trigger: CompletionTrigger;
}

const NAVIGATION_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

const closed: CompletionState = {
  start: 0,
  end: 0,
  caret: 0,
  options: [],
  activeIndex: 0,
  isOpen: false,
  anchorKey: 0,
};

function step(index: number, delta: number, count: number): number {
  return (index + delta + count) % count;
}

function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return typeof (value as Promise<T> | null)?.then === 'function';
}

/** The options an answer shows: filtered by the typed text, and none for a bare caret move. */
function toState(answer: CodeCompletionAnswer, lookup: Lookup, anchorKey: number): CompletionState {
  const result: CodeCompletionResult = 'options' in answer ? answer : { options: answer };
  const start = result.from ?? lookup.caret - lookup.query.length;
  const end = Math.max(result.to ?? lookup.caret, lookup.caret);
  const typed = lookup.value.slice(start, lookup.caret);
  const options =
    lookup.trigger === 'move' && !typed ? [] : matchCompletions(result.options, typed);
  const { caret } = lookup;
  return { start, end, caret, options, activeIndex: 0, isOpen: options.length > 0, anchorKey };
}

/** What to look up: a list completes a typed word (any word when asked); a source decides itself. */
function lookUp(completions: CodeCompletionOptions['completions'], lookup: Lookup) {
  if (typeof completions === 'function') {
    const { value, caret, query } = lookup;
    return completions({ value, caret, query, isExplicit: lookup.trigger === 'explicit' });
  }
  return lookup.query || lookup.trigger === 'explicit' ? (completions ?? []) : [];
}

/** Inserts a completion over the text it replaces, selecting its first field or the end. */
function insertCompletion(
  option: CodeCompletion,
  range: CodeRange,
  { inputRef, applyEdit, snippet }: CodeCompletionOptions,
) {
  const input = inputRef.current;
  if (!input) return;
  const end = Math.max(range.end, input.selectionStart);
  const indentation = indentationAt(input.value, range.start);
  const parsed = indentInsertion(parseSnippet(option.insertText ?? option.label), indentation);
  const length = input.value.length - (end - range.start) + parsed.text.length;
  const stops = [...parsed.fields, { start: parsed.text.length, end: parsed.text.length }].map(
    (stop) => ({ start: range.start + stop.start, end: range.start + stop.end }),
  );
  applyEdit({ start: range.start, end, text: parsed.text, selection: stops[0] as CodeRange });
  snippet.start(stops, length);
}

/**
 * Completion for a code editor's input: the options for the place at the caret, from a list or a
 * source, ranked against the typed text; an active option moved with the arrow keys; Enter or Tab
 * inserts it. The input keeps focus.
 */
export function useCodeCompletion(options: CodeCompletionOptions): CodeCompletionModel {
  const { completions, inputRef, isLocked } = options;
  const [state, setState] = useState<CompletionState>(closed);
  const request = useRef(0);
  const usedKey = useRef<string | null>(null);
  const isOpen = state.isOpen && !isLocked;
  const hide = () => setState((current) => ({ ...current, isOpen: false }));
  const close = () => {
    request.current += 1;
    hide();
  };
  const setActiveIndex = (index: number) =>
    setState((current) => ({ ...current, activeIndex: index }));
  const apply = (option: CodeCompletion) => {
    insertCompletion(option, state, options);
    close();
  };

  const track = (trigger: CompletionTrigger) => {
    const input = inputRef.current;
    if (!input || !completions || isLocked) return;
    const caret = input.selectionStart;
    const lookup = {
      value: input.value,
      caret,
      query: findCompletionQuery(input.value, caret),
      trigger,
    };
    const id = (request.current += 1);
    const show = (answer: CodeCompletionAnswer) => {
      if (id === request.current)
        setState((current) => toState(answer, lookup, current.anchorKey + 1));
    };
    const answer = lookUp(completions, lookup);
    if (!isPromise(answer)) return show(answer);
    hide();
    answer.then(show, () => undefined);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): boolean => {
    // Escape also drops a lookup that has not answered yet.
    if (!isOpen && event.key === 'Escape') request.current += 1;
    if (!isOpen || event.nativeEvent.isComposing) return false;
    const option = state.options[state.activeIndex];
    const count = state.options.length;
    if (event.key === 'ArrowDown') setActiveIndex(step(state.activeIndex, 1, count));
    else if (event.key === 'ArrowUp') setActiveIndex(step(state.activeIndex, -1, count));
    else if ((event.key === 'Enter' || (event.key === 'Tab' && !event.shiftKey)) && option) {
      apply(option);
    } else if (event.key === 'Escape') close();
    else return false;
    usedKey.current = event.key;
    event.preventDefault();
    event.stopPropagation();
    return true;
  };

  return {
    isOpen,
    options: state.options,
    activeIndex: state.activeIndex,
    caret: state.caret,
    anchorKey: state.anchorKey,
    setActiveIndex,
    apply,
    track,
    reposition: () => setState((current) => ({ ...current, anchorKey: current.anchorKey + 1 })),
    close,
    handleKeyDown,
    handleKeyUp(event) {
      const used = usedKey.current === event.key;
      usedKey.current = null;
      if (!used && NAVIGATION_KEYS.has(event.key)) track('move');
    },
  };
}
