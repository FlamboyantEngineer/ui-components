'use client';

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { OverlayTriggerStateContext } from '../../primitives/index.js';
import { toErrorMessage } from '../../utils/to-error-message.js';
import { runPendingAction } from '../button/button.js';
import type { ModalAction } from './modal.js';

/** Which built-in footer action runs. */
export type ModalActionSlot = 'primary' | 'secondary';

interface ModalActionsOptions {
  primaryAction?: ModalAction | undefined;
  secondaryAction?: ModalAction | undefined;
}

/** The action lifecycle of one opening of a modal. */
export interface ModalActions {
  /** The action whose promise is running. */
  running: ModalActionSlot | null;
  /** The message of the last failed attempt, until the next attempt or the next opening. */
  failure: string | null;
  /** Closes this opening of the modal. */
  close: () => void;
  /** Whether the action exists, is enabled and not pending, and no action is running. */
  canRun: (slot: ModalActionSlot) => boolean;
  /** Runs the action, keeping it pending until its promise settles. */
  run: (slot: ModalActionSlot) => void;
}

/**
 * Runs the footer actions of the enclosing modal. Each opening gets a generation, so a request from
 * an earlier opening never releases, fails or closes a later one, and closing clears the state.
 */
export function useModalActions({
  primaryAction,
  secondaryAction,
}: ModalActionsOptions): ModalActions {
  const state = useContext(OverlayTriggerStateContext);
  const strings = useUiStrings();
  const [running, setRunning] = useState<ModalActionSlot | null>(null);
  // Refuses a second request issued in the same turn, before the pending state renders.
  const runningRef = useRef<ModalActionSlot | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const generation = useRef(0);
  const isOpen = state?.isOpen ?? true;

  // Closing clears the pending and failed states in the same render; the effect ends the opening.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (!isOpen) {
      setRunning(null);
      setFailure(null);
    }
  }
  useEffect(() => {
    if (isOpen) return;
    generation.current += 1;
    runningRef.current = null;
  }, [isOpen]);
  useEffect(
    () => () => {
      generation.current += 1;
    },
    [],
  );

  const closeOpening = useCallback(
    (opening: number) => {
      if (generation.current === opening) state?.close();
    },
    [state],
  );
  const close = useCallback(() => closeOpening(generation.current), [closeOpening]);

  const actionIn = (slot: ModalActionSlot) =>
    slot === 'primary' ? primaryAction : secondaryAction;
  const canRun = (slot: ModalActionSlot) => {
    const action = actionIn(slot);
    return Boolean(action && !action.isDisabled && !action.isPending && !runningRef.current);
  };
  const run = (slot: ModalActionSlot) => {
    const opening = generation.current;
    const onPress = actionIn(slot)?.onPress;
    void runPendingAction({
      blocked: !canRun(slot),
      setPending: (pending) => {
        if (generation.current !== opening) return;
        runningRef.current = pending ? slot : null;
        setRunning(pending ? slot : null);
        if (pending) setFailure(null);
      },
      action: onPress ? () => onPress(() => closeOpening(opening)) : undefined,
      onError: (error) => {
        if (generation.current === opening) setFailure(toErrorMessage(error, strings.actionFailed));
      },
    });
  };

  return { running, failure, close, canRun, run };
}
