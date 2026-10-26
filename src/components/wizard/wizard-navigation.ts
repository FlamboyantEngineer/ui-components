import { toErrorMessage } from '../../utils/to-error-message.js';
import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { runPendingAction } from '../button/button.js';
import type { StepsStatus } from '../steps/steps.js';
import type { WizardProps, WizardStep } from './wizard.js';

type NavigationOptions = Pick<
  WizardProps,
  'steps' | 'currentId' | 'defaultCurrentId' | 'onCurrentIdChange' | 'onFinish'
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
 * The navigation of a wizard: the shown step (controlled or not), the steps skipped on the way, the
 * pending check and its failure, and focus moving to the step's heading after each move.
 */
export function useWizardNavigation(options: NavigationOptions): WizardNavigation {
  const { steps, onFinish } = options;
  const strings = useUiStrings();
  const [currentId, setCurrentId] = useControllableState<Key | undefined>(
    options.currentId,
    options.defaultCurrentId ?? steps[0]?.id,
    (id) => (id === undefined ? undefined : options.onCurrentIdChange?.(id)),
  );
  const [skipped, setSkipped] = useState<ReadonlySet<Key>>(() => new Set());
  const [failure, setFailure] = useState<WizardNavigation['failure']>(null);
  const [isPending, setPending] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const movedRef = useRef(false);
  // Refuses a second submit in the same turn, before the pending state renders.
  const runningRef = useRef(false);
  const index = Math.max(
    0,
    steps.findIndex((step) => step.id === currentId),
  );

  useEffect(() => {
    if (!movedRef.current) return;
    movedRef.current = false;
    headingRef.current?.focus();
  }, [currentId]);

  const goTo = (id: Key) => {
    setFailure(null);
    movedRef.current = true;
    setCurrentId(id);
  };
  const advance = async (step: WizardStep) => {
    const stay = toFailure(await step.validate?.());
    if (stay) return setFailure(stay);
    setSkipped((keys) => withMark(keys, step.id, false));
    const next = steps[index + 1];
    if (next) goTo(next.id);
    else await onFinish?.();
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const step = steps[index];
    void runPendingAction({
      blocked: runningRef.current || !step,
      setPending: (pending) => {
        runningRef.current = pending;
        setPending(pending);
        if (pending) setFailure(null);
      },
      action: step ? () => advance(step) : undefined,
      onError: (error) => setFailure({ message: toErrorMessage(error, strings.actionFailed) }),
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
