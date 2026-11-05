'use client';

import {
  type Dispatch,
  type KeyboardEvent,
  type RefObject,
  type SetStateAction,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { callSettling, isThenable } from '../../utils/is-thenable.js';
import { useLatest } from '../../utils/use-latest.js';
import type { Completion } from './completion-match.js';
import {
  closed,
  type CompletionAnswer,
  type CompletionRange,
  type CompletionReason,
  type Completions,
  type CompletionState,
  hideCompletionState,
  isSameSource,
  type Lookup,
  lookUp,
  toPendingState,
  toState,
} from './completion-state.js';

export type {
  CompletionAnswer,
  CompletionContext,
  CompletionRange,
  CompletionReason,
  CompletionResult,
  Completions,
  CompletionSource,
} from './completion-state.js';

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
  /**
   * Hears whether the list is on screen, from its `onShownChange`: Enter and Tab insert only an
   * option the reader can see. It renders nothing.
   */
  setShown(isShown: boolean): void;
  apply(option: Completion): void;
  /** Looks the completions up for the caret after it moved. */
  track(reason: CompletionReason): void;
  /** Renders again so the list follows the caret, as after the control scrolled. */
  reposition(): void;
  close(): void;
  /** Handles Ctrl+Space and, while the list is open, its keys; returns whether the key was used. */
  handleKeyDown(event: KeyboardEvent<HTMLElement>): boolean;
  /**
   * Tab while no list shows: shows the completions for the place at the caret without inserting
   * one, or waits for an answer already on its way. Returns whether the key was used; when there
   * is nothing to show, Tab is left to move focus.
   */
  revealOnTab(event: KeyboardEvent<HTMLElement>): boolean;
  /** Follows the caret after a navigation key the list did not use. */
  handleKeyUp(event: KeyboardEvent<HTMLElement>): void;
}

interface CompletionSession {
  state: CompletionState;
  setState: Dispatch<SetStateAction<CompletionState>>;
  requestRef: RefObject<number>;
  /** The request whose answer is on its way, or 0. */
  pendingRef: RefObject<number>;
  /** The list reports itself on screen. */
  shownRef: RefObject<boolean>;
  /** The lookup the pending answer or open list belongs to, or null while there is neither. */
  lookup: RefObject<Lookup | null>;
  /** The source that lookup asked. */
  source: RefObject<Completions | undefined>;
  latest: RefObject<{ state: CompletionState; options: CompletionsOptions }>;
}

const navigationKeys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

function step(index: number, delta: number, count: number): number {
  return (index + delta + count) % count;
}

function isExplicitRequest(event: KeyboardEvent<HTMLElement>): boolean {
  return event.ctrlKey && !event.metaKey && !event.altKey && event.key === ' ';
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
  const requestRef = useRef(0);
  const pendingRef = useRef(0);
  const shownRef = useRef(false);
  const lookup = useRef<Lookup | null>(null);
  const source = useRef<Completions | undefined>(undefined);
  // Every commit: callers pass a fresh options object each render.
  const latest = useLatest({ state, options });
  const session = { state, setState, requestRef, pendingRef, shownRef, lookup, source, latest };
  const isLocked = options.isLocked || options.completions === undefined;
  // Locking hides the list in the same render; the effect drops the session's pending request.
  const [wasLocked, setWasLocked] = useState(isLocked);
  if (isLocked !== wasLocked) {
    setWasLocked(isLocked);
    if (isLocked) setState(hideCompletionState);
  }
  useLayoutEffect(() => {
    if (!isLocked) return;
    requestRef.current += 1;
    lookup.current = null;
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
      requestRef.current += 1;
      latest.current.state = hideCompletionState(latest.current.state);
    },
    [latest],
  );
  return session;
}

function closeCompletions(session: CompletionSession) {
  session.requestRef.current += 1;
  session.pendingRef.current = 0;
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

function markShown(session: CompletionSession, isShown: boolean) {
  session.shownRef.current = isShown;
}

/** What a lookup came to: options to show, nothing, or an answer still on its way. */
type LookupOutcome = 'options' | 'none' | 'pending';

/**
 * Asks the control's source for `lookup` and shows only that answer, while the control still holds
 * the text it was looked up for and has not changed source. A list another source answered never
 * stays open while the new source answers, so its options cannot be shown or inserted.
 */
function askSource(
  session: CompletionSession,
  lookup: Lookup,
  isNewSource: boolean,
): LookupOutcome {
  const { completions } = session.latest.current.options;
  if (!completions) return 'none';
  const id = (session.requestRef.current += 1);
  session.lookup.current = lookup;
  session.source.current = completions;
  const show = (answer: CompletionAnswer): LookupOutcome => {
    if (id !== session.requestRef.current || session.latest.current.options.isLocked) return 'none';
    session.pendingRef.current = 0;
    if (!holdsSessionText(session) || !hasSessionSource(session)) {
      closeCompletions(session);
      return 'none';
    }
    const next = toState(answer, lookup, 0);
    session.setState((state) => ({ ...next, revision: state.revision + 1 }));
    return next.isOpen ? 'options' : 'none';
  };
  // A source that throws is a source that rejects: the lookup shows nothing, quietly.
  const answer = callSettling(() => lookUp(completions, lookup));
  if (!isThenable(answer)) return show(answer);
  session.pendingRef.current = id;
  session.setState((state) =>
    isNewSource ? hideCompletionState(state) : toPendingState(state, lookup),
  );
  // A failed lookup shows nothing, not the earlier options kept while it was pending; a failure of
  // a lookup a newer one replaced changes nothing.
  answer.then(show, () => {
    if (id === session.requestRef.current) closeCompletions(session);
  });
  return 'pending';
}

function trackCompletions(session: CompletionSession, reason: CompletionReason): LookupOutcome {
  const current = session.latest.current.options;
  const input = current.inputRef.current;
  if (!input || !current.completions || current.isLocked) return 'none';
  // Inputs without a caret (such as `email`) report none; complete at the end.
  const caret = input.selectionStart ?? input.value.length;
  const query = current.findQuery(input.value, caret);
  return askSource(session, { value: input.value, caret, query, reason }, false);
}

/** Tab alone, as an input method does not own it. */
function isPlainTab(event: KeyboardEvent<HTMLElement>): boolean {
  const { shiftKey, ctrlKey, metaKey, altKey } = event;
  return event.key === 'Tab' && !shiftKey && !ctrlKey && !metaKey && !altKey;
}

/**
 * Tab with no list on screen: an answer on its way keeps Tab and shows when it comes; otherwise the
 * place at the caret is looked up as after an edit, and Tab is kept only when that shows options.
 * Either way nothing is inserted: inserting takes another Tab once the list is on screen.
 */
function revealCompletions(session: CompletionSession, event: KeyboardEvent<HTMLElement>) {
  const { options } = session.latest.current;
  if (!isPlainTab(event) || isComposingKey(event.nativeEvent) || options.isLocked) return false;
  const isPending = session.pendingRef.current !== 0;
  if (!isPending && trackCompletions(session, 'input') !== 'options') return false;
  event.preventDefault();
  event.stopPropagation();
  return true;
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
  const { state, setState } = session;
  const usedKey = useRef<string | null>(null);
  const isOpen = state.isOpen && !isLocked && completions !== undefined;
  const close = () => closeCompletions(session);
  const setActiveIndex = (index: number) =>
    setState((current) => ({ ...current, activeIndex: index }));
  const apply = (option: Completion) => applyCompletion(session, option);
  const track = (reason: CompletionReason) => {
    trackCompletions(session, reason);
  };

  /**
   * The list's own keys while it is open; returns whether the key was used. Until the list is on
   * screen, Enter and Tab wait for it, so neither inserts an option the reader has not seen.
   */
  const choose = (key: string, shiftKey: boolean): boolean => {
    if (!session.shownRef.current) {
      if (key === 'Escape') close();
      return key === 'Escape' || key === 'Enter' || (key === 'Tab' && !shiftKey);
    }
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
    // Keys an input method owns, its confirming Enter included, never accept or dismiss.
    if (isComposingKey(event.nativeEvent)) return false;
    // Escape also drops a lookup that has not answered yet.
    if (!isOpen && event.key === 'Escape') close();
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
    setShown: (shown) => markShown(session, shown),
    apply,
    track,
    reposition: () => setState((current) => ({ ...current, revision: current.revision + 1 })),
    close,
    handleKeyDown,
    revealOnTab: (event) => revealCompletions(session, event),
    handleKeyUp(event) {
      const used = usedKey.current === event.key;
      usedKey.current = null;
      if (!used && navigationKeys.has(event.key)) track('move');
    },
  };
}
