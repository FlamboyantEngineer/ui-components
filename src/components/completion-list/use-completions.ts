'use client';

import {
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type RefObject,
  type SetStateAction,
} from 'react';
import { isThenable } from '../../utils/is-thenable.js';
import { matchCompletions, type Completion } from './completion-match.js';
import { isShallowEqual } from '../../utils/is-shallow-equal.js';
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

interface CompletionSession {
  state: CompletionState;
  setState: Dispatch<SetStateAction<CompletionState>>;
  request: RefObject<number>;
  /** The lookup the pending answer or open list belongs to, or null while there is neither. */
  lookup: RefObject<Lookup | null>;
  /** The source that lookup asked. */
  source: RefObject<Completions | undefined>;
  latest: RefObject<{ state: CompletionState; options: CompletionsOptions }>;
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

/**
 * Whether two sources are the same: the same source function, or vocabularies listing equal
 * completions in the same order, as an inline list written again on each render does.
 */
function isSameSource(left: Completions | undefined, right: Completions | undefined): boolean {
  if (left === right) return true;
  if (!left || !right || typeof left === 'function' || typeof right === 'function') return false;
  return (
    left.length === right.length &&
    left.every((completion, index) => isShallowEqual(completion, right[index]))
  );
}

/** Whether the control still holds the text the session completes. */
function holdsSessionText(session: CompletionSession): boolean {
  const value = session.latest.current.options.inputRef.current?.value;
  return session.lookup.current !== null && value === session.lookup.current.value;
}

/** Whether the session's source still is the control's. */
function hasSessionSource(session: CompletionSession): boolean {
  return isSameSource(session.source.current, session.latest.current.options.completions);
}

function useCompletionState(options: CompletionsOptions) {
  const [state, setState] = useState<CompletionState>(closed);
  const request = useRef(0);
  const lookup = useRef<Lookup | null>(null);
  const source = useRef<Completions | undefined>(undefined);
  // Every commit: callers pass a fresh options object each render.
  const latest = useLatest({ state, options });
  const session = { state, setState, request, lookup, source, latest };
  const isLocked = options.isLocked || options.completions === undefined;
  useLayoutEffect(() => {
    if (!isLocked) return;
    request.current += 1;
    lookup.current = null;
    setState(hideCompletionState);
  }, [isLocked]);
  // A value the control was given from outside, such as a controlled replacement, ends the session:
  // its answer and range belong to the text it was looked up for. A new source answers it again.
  useLayoutEffect(() => {
    const current = lookup.current;
    if (current === null) return;
    if (!holdsSessionText(session)) closeCompletions(session);
    else if (!hasSessionSource(session)) askSource(session, current, true);
  });
  useLayoutEffect(
    () => () => {
      request.current += 1;
      latest.current.state = hideCompletionState(latest.current.state);
    },
    [latest],
  );
  return session;
}

function closeCompletions(session: CompletionSession) {
  session.request.current += 1;
  session.lookup.current = null;
  session.latest.current.state = hideCompletionState(session.latest.current.state);
  session.setState(hideCompletionState);
}

function applyCompletion(session: CompletionSession, option: Completion) {
  const current = session.latest.current;
  if (
    current.options.isLocked ||
    !current.options.completions ||
    !current.state.isOpen ||
    !current.state.options.includes(option)
  )
    return;
  if (!holdsSessionText(session) || !hasSessionSource(session)) return closeCompletions(session);
  const { start, end } = current.state;
  current.state = hideCompletionState(current.state);
  try {
    current.options.insert(option, { start, end });
  } finally {
    closeCompletions(session);
  }
}

/**
 * Asks the control's source for `lookup` and shows only that answer, while the control still holds
 * the text it was looked up for and has not changed source. A list another source answered never
 * stays open while the new source answers, so its options cannot be shown or inserted.
 */
function askSource(session: CompletionSession, lookup: Lookup, isNewSource: boolean) {
  const { completions } = session.latest.current.options;
  if (!completions) return;
  const id = (session.request.current += 1);
  session.lookup.current = lookup;
  session.source.current = completions;
  const show = (answer: CompletionAnswer) => {
    if (id !== session.request.current || session.latest.current.options.isLocked) return;
    if (!holdsSessionText(session) || !hasSessionSource(session)) return closeCompletions(session);
    session.setState((state) => toState(answer, lookup, state.revision + 1));
  };
  const answer = lookUp(completions, lookup);
  if (!isThenable(answer)) return show(answer);
  session.setState((state) =>
    isNewSource ? hideCompletionState(state) : toPendingState(state, lookup),
  );
  answer.then(show, () => undefined);
}

function trackCompletions(session: CompletionSession, reason: CompletionReason) {
  const current = session.latest.current.options;
  const input = current.inputRef.current;
  if (!input || !current.completions || current.isLocked) return;
  // Inputs without a caret (such as `email`) report none; complete at the end.
  const caret = input.selectionStart ?? input.value.length;
  const query = current.findQuery(input.value, caret);
  askSource(session, { value: input.value, caret, query, reason }, false);
}

/**
 * Completion for a text control that keeps focus: the options for the place at the caret, from a
 * vocabulary or a source, ranked against the typed text; an active option moved with the arrow
 * keys; Enter or Tab inserts it, Escape closes the list and Ctrl+Space asks for it. Only the latest
 * lookup's answer shows, and only while the control holds the text it was looked up for.
 */
export function useCompletions(options: CompletionsOptions): CompletionsModel {
  const { completions, isLocked } = options;
  const session = useCompletionState(options);
  const { state, setState, request } = session;
  const usedKey = useRef<string | null>(null);
  const isOpen = state.isOpen && !isLocked && completions !== undefined;
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
