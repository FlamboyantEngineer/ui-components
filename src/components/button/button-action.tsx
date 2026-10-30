'use client';

import { useCallback, useRef, useState, type MouseEvent } from 'react';
import type { PressEvent } from '../../core/events.js';
import type { ElementRender } from '../../utils/render-element.js';
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
      if (
        !result ||
        typeof result !== 'object' ||
        !('then' in result) ||
        typeof result.then !== 'function'
      )
        return;
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
 * activation of a click that arrives while `isBusy`. React Aria turns a pending submit button into a
 * plain one, which in a browser lands before the click that started the action submits; a click
 * guard instead lets that click submit and refuses the repeats, also during `pendingDelay`.
 */
function guardActivation(
  type: 'submit' | 'reset',
  isBusy: () => boolean,
  render: ButtonProps['render'],
): ElementRender<'button', ButtonRenderState> {
  return (props, state) => {
    const guarded = {
      ...props,
      type,
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        if (isBusy()) event.preventDefault();
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
  const handlePress = useCallback(
    (event: PressEvent) => run(onPress ? () => onPress(event) : undefined),
    [run, onPress],
  );
  const submits = !isDisabled && (type === 'submit' || type === 'reset');
  return {
    onPress: href === undefined ? handlePress : onPress,
    isPending: href === undefined && showsPending,
    render: submits ? guardActivation(type, isBusy, render) : render,
  };
}
