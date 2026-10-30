import { useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { matchCompletions, type Completion } from './completion-match.js';
import { useLatest } from '../../utils/use-latest.js';

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

interface CompletionsOptions {
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

type CompletionSession = ReturnType<typeof useCompletionState>;

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

function hideCompletionState(state: CompletionState): CompletionState {
  return state.isOpen ? { ...state, isOpen: false } : state;
}

/**
 * The open list while a source's answer to an edit is pending: it stays open, narrowed to the
 * options that still match the typed text, with its range following the caret, so it does not
 * blink shut on every keystroke. A caret move, or an edit before the list's start, hides it.
 */
function toPendingState(state: CompletionState, lookup: Lookup): CompletionState {
  if (!state.isOpen || lookup.reason === 'move' || lookup.caret < state.start) {
    return hideCompletionState(state);
  }
  const options = matchCompletions(state.options, lookup.value.slice(state.start, lookup.caret));
  const active = options.indexOf(state.options[state.activeIndex] as Completion);
  return {
    ...state,
    end: lookup.caret + Math.max(state.end - state.caret, 0),
    caret: lookup.caret,
    options,
    activeIndex: Math.max(active, 0),
    isOpen: options.length > 0,
    revision: state.revision + 1,
  };
}

function useCompletionState(options: CompletionsOptions) {
  const [state, setState] = useState<CompletionState>(closed);
  const request = useRef(0);
  // Every commit: callers pass a fresh options object each render.
  const latest = useLatest({ state, options });
  const { isLocked } = options;
  useLayoutEffect(() => {
    if (!isLocked) return;
    request.current += 1;
    setState(hideCompletionState);
  }, [isLocked]);
  useLayoutEffect(
    () => () => {
      request.current += 1;
      latest.current.state = hideCompletionState(latest.current.state);
    },
    [latest],
  );
  return { state, setState, request, latest };
}

function closeCompletions(session: CompletionSession) {
  session.request.current += 1;
  session.latest.current.state = hideCompletionState(session.latest.current.state);
  session.setState(hideCompletionState);
}

function applyCompletion(session: CompletionSession, option: Completion) {
  const current = session.latest.current;
  if (current.options.isLocked || !current.state.isOpen || !current.state.options.includes(option))
    return;
  const { start, end } = current.state;
  current.state = hideCompletionState(current.state);
  try {
    current.options.insert(option, { start, end });
  } finally {
    closeCompletions(session);
  }
}

function trackCompletions(session: CompletionSession, reason: CompletionReason) {
  const current = session.latest.current.options;
  const input = current.inputRef.current;
  if (!input || !current.completions || current.isLocked) return;
  // Inputs without a caret (such as `email`) report none; complete at the end.
  const caret = input.selectionStart ?? input.value.length;
  const lookup = {
    value: input.value,
    caret,
    query: current.findQuery(input.value, caret),
    reason,
  };
  const id = (session.request.current += 1);
  const show = (answer: CompletionAnswer) => {
    if (id === session.request.current && !session.latest.current.options.isLocked)
      session.setState((state) => toState(answer, lookup, state.revision + 1));
  };
  const answer = lookUp(current.completions, lookup);
  if (!isPromise(answer)) return show(answer);
  session.setState((state) => toPendingState(state, lookup));
  answer.then(show, () => undefined);
}

/**
 * Completion for a text control that keeps focus: the options for the place at the caret, from a
 * vocabulary or a source, ranked against the typed text; an active option moved with the arrow
 * keys; Enter or Tab inserts it, Escape closes the list and Ctrl+Space asks for it. Only the latest
 * lookup's answer shows.
 */
export function useCompletions(options: CompletionsOptions): CompletionsModel {
  const { completions, isLocked } = options;
  const session = useCompletionState(options);
  const { state, setState, request } = session;
  const usedKey = useRef<string | null>(null);
  const isOpen = state.isOpen && !isLocked;
  const close = () => closeCompletions(session);
  const setActiveIndex = (index: number) =>
    setState((current) => ({ ...current, activeIndex: index }));
  const apply = (option: Completion) => applyCompletion(session, option);
  const track = (reason: CompletionReason) => trackCompletions(session, reason);

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
