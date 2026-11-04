import { isShallowEqual } from '../../utils/is-shallow-equal.js';
import { type Completion, matchCompletions } from './completion-match.js';

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

/** The list's state: its options, the text they replace and the active one. */
export interface CompletionState extends CompletionRange {
  caret: number;
  options: readonly Completion[];
  activeIndex: number;
  isOpen: boolean;
  revision: number;
}

export interface Lookup {
  value: string;
  caret: number;
  query: string;
  reason: CompletionReason;
}

export const closed: CompletionState = {
  start: 0,
  end: 0,
  caret: 0,
  options: [],
  activeIndex: 0,
  isOpen: false,
  revision: 0,
};

/** The options an answer shows: filtered by the typed text, and none for a bare caret move. */
export function toState(
  answer: CompletionAnswer,
  lookup: Lookup,
  revision: number,
): CompletionState {
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
export function lookUp(completions: Completions, lookup: Lookup) {
  if (typeof completions === 'function') {
    const { value, caret, query } = lookup;
    return completions({ value, caret, query, isExplicit: lookup.reason === 'explicit' });
  }
  return lookup.query || lookup.reason === 'explicit' ? completions : [];
}

export function hideCompletionState(state: CompletionState): CompletionState {
  return state.isOpen ? { ...state, isOpen: false } : state;
}

/**
 * The open list while a source's answer to an edit is pending: it stays open, narrowed to the
 * options that still match the typed text, with its range following the caret, so it does not
 * blink shut on every keystroke. A caret move, or an edit before the list's start, hides it.
 */
export function toPendingState(state: CompletionState, lookup: Lookup): CompletionState {
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
export function isSameSource(
  left: Completions | undefined,
  right: Completions | undefined,
): boolean {
  if (left === right) return true;
  if (!left || !right || typeof left === 'function' || typeof right === 'function') return false;
  return (
    left.length === right.length &&
    left.every((completion, index) => isShallowEqual(completion, right[index]))
  );
}
