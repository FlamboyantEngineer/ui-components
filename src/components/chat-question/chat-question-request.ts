'use client';

import { useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { isThenable } from '../../utils/is-thenable.js';
import { toErrorMessage } from '../../utils/to-error-message.js';

/** The requests a card sends its host: the reader's answers, or their dismissal. */
export type QuestionRequestKind = 'submit' | 'dismiss';

interface QuestionRequest {
  /** The request whose promise has not settled. */
  running: QuestionRequestKind | null;
  /** Why the last request failed, until the next one. */
  failure: string | null;
  /** Sends a request through `action`, unless one is running. */
  run: (kind: QuestionRequestKind, action: QuestionAction) => void;
}

/** A host callback; a returned promise keeps its request running until it settles. */
type QuestionAction = () => void | Promise<unknown>;

interface RequestState {
  /** The card the state is about: its id while it is pending. */
  scope: string | undefined;
  /** This pending lifetime, new each time the state starts over, even for the same id. */
  lifetime: object;
  /** The latest request; one that settles after another started, or after a reset, is ignored. */
  attempt: number;
  running: QuestionRequestKind | null;
  failure: string | null;
}

function startState(scope: string | undefined): RequestState {
  return { scope, lifetime: {}, attempt: 0, running: null, failure: null };
}

/**
 * The requests of a pending card, one at a time. The state belongs to `scope`, the card's id
 * while it is pending: it starts over when the card changes id or leaves pending, so a request
 * sent for one card never marks, fails or blocks another, nor the same card pending again. A callback that returns no promise leaves no
 * trace unless it throws.
 */
export function useQuestionRequest(scope: string | undefined): QuestionRequest {
  const strings = useUiStrings();
  const [state, setState] = useState(() => startState(scope));
  const attempts = useRef(0);
  // The request in flight, which refuses a second one in its lifetime before the first renders.
  const inFlight = useRef<{ lifetime: object; attempt: number } | null>(null);
  let current = state;
  if (state.scope !== scope) {
    current = startState(scope);
    setState(current);
  }
  const run = (kind: QuestionRequestKind, action: QuestionAction) => {
    const { lifetime } = current;
    if (scope === undefined || current.running || inFlight.current?.lifetime === lifetime) return;
    attempts.current += 1;
    const attempt = attempts.current;
    const fallback = kind === 'submit' ? strings.questionSubmitFailed : strings.actionFailed;
    const settle = (failure: string | null) => {
      if (inFlight.current?.attempt === attempt) inFlight.current = null;
      setState((last) => (last.attempt === attempt ? { ...last, running: null, failure } : last));
    };
    let result: unknown;
    try {
      result = action();
    } catch (error) {
      setState({ ...current, attempt, running: null, failure: toErrorMessage(error, fallback) });
      return;
    }
    if (!isThenable(result)) {
      setState((last) => (last.failure === null ? last : { ...last, attempt, failure: null }));
      return;
    }
    inFlight.current = { lifetime, attempt };
    setState({ ...current, attempt, running: kind, failure: null });
    result.then(
      () => settle(null),
      (error: unknown) => settle(toErrorMessage(error, fallback)),
    );
  };
  return { running: current.running, failure: current.failure, run };
}
