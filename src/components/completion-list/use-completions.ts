import { useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { matchCompletions, type Completion } from './completion-match.js';

/** What a completion source knows about the place it completes. */
export interface CompletionContext {
  value: string;
  caret: number;
  /** The word before the caret, as the control reads words. */
  query: string;
  /** The reader asked for completions with Ctrl+Space. */
  isExplicit: boolean;
}

/** A source's completions, and the text they replace when it is not the word before the caret. */
export interface CompletionResult {
  options: readonly Completion[];
  /** Where the replaced text starts; the typed text from here to the caret filters the options. */
  from?: number | undefined;
  /** Where the replaced text ends, at or after the caret. */
  to?: number | undefined;
  /** Matches the options against the typed text. Defaults to true; false shows them as given. */
  filter?: boolean | undefined;
}

export type CompletionAnswer = readonly Completion[] | CompletionResult;

/** Completes the place at the caret, at once or later. */
export type CompletionSource = (
  context: CompletionContext,
) => CompletionAnswer | Promise<CompletionAnswer>;

/** A vocabulary for the word before the caret, or a source that completes the place at the caret. */
export type Completions = readonly Completion[] | CompletionSource;

/** The text a completion replaces. */
export interface CompletionRange {
  start: number;
  end: number;
}

/** Why the completions are looked up: an edit, a caret move or the reader's request. */
export type CompletionReason = 'input' | 'move' | 'explicit';

export interface CompletionsOptions {
  completions: Completions | undefined;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  /** A read-only or disabled control offers nothing. */
  isLocked: boolean;
  /** The word before the caret that a vocabulary completes. */
  findQuery: (value: string, caret: number) => string;
  /** Inserts a completion over the text it replaces. */
  insert: (completion: Completion, range: CompletionRange) => void;
}

export interface CompletionsModel {
  isOpen: boolean;
  options: readonly Completion[];
  activeIndex: number;
  /** The caret offset the list belongs to. */
  caret: number;
  setActiveIndex(index: number): void;
  apply(option: Completion): void;
  /** Looks the completions up for the caret after it moved. */
  track(reason: CompletionReason): void;
  /** Renders again so the list follows the caret, as after the control scrolled. */
  reposition(): void;
  close(): void;
  /** Handles Ctrl+Space and, while the list is open, its keys; returns whether the key was used. */
  handleKeyDown(event: KeyboardEvent<HTMLElement>): boolean;
  /** Follows the caret after a navigation key the list did not use. */
  handleKeyUp(event: KeyboardEvent<HTMLElement>): void;
}

interface CompletionState extends CompletionRange {
  caret: number;
  options: readonly Completion[];
  activeIndex: number;
  isOpen: boolean;
  revision: number;
}

interface Lookup {
  value: string;
  caret: number;
  query: string;
  reason: CompletionReason;
}

const NAVIGATION_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

const closed: CompletionState = {
  start: 0,
  end: 0,
  caret: 0,
  options: [],
  activeIndex: 0,
  isOpen: false,
  revision: 0,
};

function step(index: number, delta: number, count: number): number {
  return (index + delta + count) % count;
}

function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return typeof (value as Promise<T> | null)?.then === 'function';
}

function isExplicitRequest(event: KeyboardEvent<HTMLElement>): boolean {
  return event.ctrlKey && !event.metaKey && !event.altKey && event.key === ' ';
}

/** The options an answer shows: filtered by the typed text, and none for a bare caret move. */
function toState(answer: CompletionAnswer, lookup: Lookup, revision: number): CompletionState {
  const result: CompletionResult = 'options' in answer ? answer : { options: answer };
  const start = result.from ?? lookup.caret - lookup.query.length;
  const end = Math.max(result.to ?? lookup.caret, lookup.caret);
  const typed = lookup.value.slice(start, lookup.caret);
  const matched =
    result.filter === false ? [...result.options] : matchCompletions(result.options, typed);
  const options = lookup.reason === 'move' && !typed ? [] : matched;
  const { caret } = lookup;
  return { start, end, caret, options, activeIndex: 0, isOpen: options.length > 0, revision };
}

/** What to look up: a list completes a typed word (any word when asked); a source decides itself. */
function lookUp(completions: Completions, lookup: Lookup) {
  if (typeof completions === 'function') {
    const { value, caret, query } = lookup;
    return completions({ value, caret, query, isExplicit: lookup.reason === 'explicit' });
  }
  return lookup.query || lookup.reason === 'explicit' ? completions : [];
}

/**
 * Completion for a text control that keeps focus: the options for the place at the caret, from a
 * vocabulary or a source, ranked against the typed text; an active option moved with the arrow
 * keys; Enter or Tab inserts it, Escape closes the list and Ctrl+Space asks for it. Only the latest
 * lookup's answer shows.
 */
export function useCompletions(options: CompletionsOptions): CompletionsModel {
  const { completions, inputRef, isLocked, findQuery, insert } = options;
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
  const apply = (option: Completion) => {
    insert(option, { start: state.start, end: state.end });
    close();
  };

  const track = (reason: CompletionReason) => {
    const input = inputRef.current;
    if (!input || !completions || isLocked) return;
    // Inputs without a caret (such as `email`) report none; complete at the end.
    const caret = input.selectionStart ?? input.value.length;
    const lookup = { value: input.value, caret, query: findQuery(input.value, caret), reason };
    const id = (request.current += 1);
    const show = (answer: CompletionAnswer) => {
      if (id === request.current)
        setState((current) => toState(answer, lookup, current.revision + 1));
    };
    const answer = lookUp(completions, lookup);
    if (!isPromise(answer)) return show(answer);
    hide();
    answer.then(show, () => undefined);
  };

  /** The list's own keys while it is open; returns whether the key was used. */
  const choose = (key: string, shiftKey: boolean): boolean => {
    const option = state.options[state.activeIndex];
    const count = state.options.length;
    if (key === 'ArrowDown') setActiveIndex(step(state.activeIndex, 1, count));
    else if (key === 'ArrowUp') setActiveIndex(step(state.activeIndex, -1, count));
    else if ((key === 'Enter' || (key === 'Tab' && !shiftKey)) && option) apply(option);
    else if (key === 'Escape') close();
    else return false;
    return true;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>): boolean => {
    // Escape also drops a lookup that has not answered yet.
    if (!isOpen && event.key === 'Escape') request.current += 1;
    if (event.nativeEvent.isComposing) return false;
    const isRequest = isExplicitRequest(event) && Boolean(completions) && !isLocked;
    if (isRequest) track('explicit');
    else if (!isOpen || !choose(event.key, event.shiftKey)) return false;
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
    setActiveIndex,
    apply,
    track,
    reposition: () => setState((current) => ({ ...current, revision: current.revision + 1 })),
    close,
    handleKeyDown,
    handleKeyUp(event) {
      const used = usedKey.current === event.key;
      usedKey.current = null;
      if (!used && NAVIGATION_KEYS.has(event.key)) track('move');
    },
  };
}
