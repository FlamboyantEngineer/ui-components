'use client';

import { toErrorMessage } from '../../utils/to-error-message.js';
import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { useStableArray } from '../../utils/use-stable-array.js';
import { useRetainedKey } from '../../utils/use-retained-key.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { runPendingAction } from '../button/button.js';
import type { StepsStatus } from '../steps/steps.js';
import type { WizardProps, WizardStep } from './wizard.js';

type NavigationOptions = Pick<
  WizardProps,
  'steps' | 'currentKey' | 'defaultCurrentKey' | 'onCurrentKeyChange' | 'onFinish'
>;

/** The step a wizard shows and the moves the reader can make from it. */
export interface WizardNavigation {
  /** The position of the shown step. */
  index: number;
  /** Each step's status, in order. */
  statuses: StepsStatus[];
  /** While the shown step's check or the finish runs. */
  isPending: boolean;
  /** The shown step failed its check: its message, or `null` when it gave none. */
  failure: { message: string | null } | null;
  /** The heading focus moves to after each move. */
  headingRef: RefObject<HTMLHeadingElement | null>;
  /** Runs the shown step's check, then moves to the next step or finishes. */
  submit: (event: FormEvent<HTMLFormElement>) => void;
  /** Moves to a step without checking the shown one. */
  goTo: (id: Key) => void;
  /** Passes over the shown step, marking it skipped. */
  skip: () => void;
}

/** A check's answer that keeps the reader on the step: `false`, or a message to show. */
function toFailure(result: boolean | string | void): WizardNavigation['failure'] {
  if (result === false) return { message: null };
  return typeof result === 'string' && result !== '' ? { message: result } : null;
}

function withMark(keys: ReadonlySet<Key>, key: Key, isMarked: boolean): ReadonlySet<Key> {
  const next = new Set(keys);
  if (isMarked) next.add(key);
  else next.delete(key);
  return next;
}

/** Where each step stands: settled before the shown one, upcoming after it. */
function toStatuses(
  steps: readonly WizardStep[],
  { index, skipped, hasFailed }: { index: number; skipped: ReadonlySet<Key>; hasFailed: boolean },
): StepsStatus[] {
  return steps.map((step, position) => {
    if (position > index) return 'upcoming';
    if (position === index) return hasFailed ? 'error' : 'current';
    return skipped.has(step.id) ? 'skipped' : 'complete';
  });
}

/**
 * The Next or Finish under way and whether it is pending. Leaving the step or workflow it started in,
 * or unmounting, aborts it and ends the pending state.
 */
function useAttempts(shownId: Key | undefined, stepIds: readonly Key[]) {
  // The steps in order, so a replaced workflow differs from the one a check started in.
  const workflow = useStableArray(stepIds);
  const [isPending, setPending] = useState(false);
  // Refuses a second submit in the same turn, before the pending state renders.
  const runningRef = useRef(false);
  const attemptRef = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      attemptRef.current?.abort();
      attemptRef.current = null;
      runningRef.current = false;
      setPending(false);
    },
    [shownId, workflow],
  );
  return { isPending, setPending, runningRef, attemptRef, workflow };
}

/** A failed check and the step and workflow it checked. */
interface OwnedFailure {
  failure: NonNullable<WizardNavigation['failure']>;
  stepId: Key | undefined;
  workflow: readonly Key[];
}

/**
 * The shown step's failure. A failure belongs to the step and workflow whose check produced it:
 * once the wizard shows another step, however it got there, or its steps change, the failure is
 * dropped, so it never shows on another step or on a return to its own.
 */
function useStepFailure(stepId: Key | undefined, workflow: readonly Key[]) {
  const [owned, setOwned] = useState<OwnedFailure | null>(null);
  const isOwned = owned !== null && owned.stepId === stepId && owned.workflow === workflow;
  if (owned !== null && !isOwned) setOwned(null);
  const setFailure = (failure: WizardNavigation['failure']) =>
    setOwned(failure === null ? null : { failure, stepId, workflow });
  return [isOwned ? owned.failure : null, setFailure] as const;
}

/**
 * The navigation of a wizard: the shown step (controlled or not), the steps skipped on the way, the
 * pending check and its failure, and focus moving to the step's heading after each move. A Next or
 * Finish belongs to the step and workflow it started in, and finishes through the `onFinish` of that
 * render: once the wizard shows another step, its steps change or it unmounts, the attempt is
 * aborted and its outcome changes nothing.
 */
export function useWizardNavigation(options: NavigationOptions): WizardNavigation {
  const { steps } = options;
  const strings = useUiStrings();
  const [currentKey, setCurrentId] = useControllableState<Key | undefined>(
    options.currentKey,
    options.defaultCurrentKey ?? steps[0]?.id,
    (id) => (id === undefined ? undefined : options.onCurrentKeyChange?.(id)),
  );
  const [skipped, setSkipped] = useState<ReadonlySet<Key>>(() => new Set());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const movedRef = useRef(false);
  const isStep = (id: Key) => steps.some((step) => step.id === id);
  // With no current step among the steps, the step shown first stays shown while it is there.
  const shownId = useRetainedKey(currentKey, isStep, steps[0]?.id);
  const index = Math.max(
    0,
    steps.findIndex((step) => step.id === shownId),
  );
  const { isPending, setPending, runningRef, attemptRef, workflow } = useAttempts(
    steps[index]?.id,
    steps.map((step) => step.id),
  );
  const [failure, setFailure] = useStepFailure(steps[index]?.id, workflow);

  useEffect(() => {
    if (!movedRef.current) return;
    movedRef.current = false;
    headingRef.current?.focus();
  }, [currentKey]);

  const goTo = (id: Key) => {
    setFailure(null);
    movedRef.current = true;
    setCurrentId(id);
  };
  // The attempt keeps the step, steps and `onFinish` it started with, so a check's answer only ever
  // finishes the workflow it checked.
  const { onFinish } = options;
  const advance = async (step: WizardStep, signal: AbortSignal) => {
    const stay = toFailure(await step.validate?.(signal));
    if (signal.aborted) return;
    if (stay) return setFailure(stay);
    setSkipped((keys) => withMark(keys, step.id, false));
    const next = steps[index + 1];
    if (next) goTo(next.id);
    else await onFinish?.();
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const step = steps[index];
    const attempt = new AbortController();
    void runPendingAction({
      blocked: runningRef.current || !step,
      setPending: (pending) => {
        if (pending) attemptRef.current = attempt;
        else if (attemptRef.current === attempt) attemptRef.current = null;
        else return;
        runningRef.current = pending;
        setPending(pending);
        if (pending) setFailure(null);
      },
      action: step ? () => advance(step, attempt.signal) : undefined,
      onError: (error) => {
        if (attempt.signal.aborted) return;
        setFailure({ message: toErrorMessage(error, strings.actionFailed) });
      },
    });
  };
  const skip = () => {
    const step = steps[index];
    const next = steps[index + 1];
    if (!step || !next) return;
    setSkipped((keys) => withMark(keys, step.id, true));
    goTo(next.id);
  };
  const statuses = toStatuses(steps, { index, skipped, hasFailed: failure !== null });
  return { index, statuses, isPending, failure, headingRef, submit, goTo, skip };
}
