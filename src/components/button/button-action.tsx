'use client';

import { useCallback, useRef, useState, type MouseEvent, type RefObject } from 'react';
import type { PressEvent } from '../../core/events.js';
import type { ElementRender } from '../../utils/render-element.js';
import { isThenable } from '../../utils/is-thenable.js';
import { useActiveAfter } from '../../utils/use-delayed-flag.js';
import type { ButtonProps, ButtonRenderState } from './button.js';
import { runPendingAction, type PendingAction } from './pending-action.js';

/** The pending lifecycle shared by buttons and controls that run work. */
export interface ButtonActionProps {
  /** Receives a failed action; without it the error is rethrown. */
  onError?: ((error: unknown) => void) | undefined;
  /** Milliseconds before showing pending, while repeat presses are already refused. Defaults to zero. */
  pendingDelay?: number | undefined;
}

/**
 * The pending lifecycle of a control that runs actions: `pending` is the caller's `isPending`, else
 * whether an action the control started is unsettled. `run` starts an action unless the control is
 * disabled or pending, and `isBusy` says, ahead of the next render, whether one is still running.
 */
export function usePendingAction({
  isPending,
  isDisabled,
  onError,
}: Pick<ButtonProps, 'isPending' | 'onError'> & { isDisabled: boolean }) {
  const [internalPending, setInternalPending] = useState(false);
  const running = useRef(false);
  const pending = isPending ?? internalPending;
  const run = useCallback(
    (action: PendingAction) => {
      if (running.current) return;
      if (isDisabled || pending) return;
      let result;
      try {
        result = action?.();
      } catch (error) {
        if (!onError) throw error;
        onError(error);
        return;
      }
      if (!isThenable(result)) return;
      void runPendingAction({
        blocked: false,
        setPending: (next) => {
          running.current = next;
          setInternalPending(next);
        },
        action: () => result,
        onError,
      });
    },
    [isDisabled, pending, onError],
  );
  return { pending, run, isBusy: () => running.current || pending };
}

/**
 * Draws a submit or reset button that keeps its type while pending and cancels the native
 * activation of a click that arrives while `isBusy`, unless it is the click of the press that
 * started the action (`isAdmitted`). React Aria turns a pending submit button into a plain one,
 * which in a browser lands before the click that started the action submits; a click guard instead
 * lets that click submit and refuses the repeats, also during `pendingDelay`. Space presses before
 * its click, so the action is already running when that click arrives.
 */
function useActivationGuard(
  type: 'submit' | 'reset',
  guard: { isBusy: () => boolean; admitted: RefObject<boolean> },
  render: ButtonProps['render'],
): ElementRender<'button', ButtonRenderState> {
  return (props, state) => {
    const guarded = {
      ...props,
      type,
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        if (guard.isBusy() && !guard.admitted.current) event.preventDefault();
        props.onClick?.(event);
      },
    };
    return render ? render(guarded, state) : <button {...guarded} />;
  };
}

/** Runs a promise-returning press and keeps native submit activation guarded while it settles. */
export function useButtonAction({
  onPress,
  onError,
  isPending,
  isDisabled = false,
  pendingDelay = 0,
  type,
  render,
  href,
}: ButtonProps) {
  const { pending, run, isBusy } = usePendingAction({ isPending, isDisabled, onError });
  const showsPending = useActiveAfter(pending, pendingDelay);
  // The press that starts an action admits the click it dispatches in the same task, and no other.
  const admitted = useRef(false);
  const handlePress = useCallback(
    (event: PressEvent) => {
      const wasBusy = isBusy();
      run(onPress ? () => onPress(event) : undefined);
      if (wasBusy || !isBusy()) return;
      admitted.current = true;
      setTimeout(() => {
        admitted.current = false;
      });
    },
    [run, isBusy, onPress],
  );
  const submits = !isDisabled && (type === 'submit' || type === 'reset');
  const guarded = useActivationGuard(
    type === 'reset' ? 'reset' : 'submit',
    { isBusy, admitted },
    render,
  );
  return {
    onPress: href === undefined ? handlePress : onPress,
    isPending: href === undefined && showsPending,
    render: submits ? guarded : render,
    /** Activation is refused from the start of the pending state, ahead of its indicator. */
    isBusy: href === undefined && pending,
  };
}
