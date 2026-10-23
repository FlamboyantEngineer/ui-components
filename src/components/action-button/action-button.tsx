import { useCallback, useRef, useState, type MouseEvent, type Ref } from 'react';
import type { PressEvent } from '../../core/events.js';
import type { ElementRender } from '../../utils/render-element.js';
import { useActiveAfter } from '../../utils/use-delayed-flag.js';
import { Button, type ButtonProps, type ButtonRenderState } from '../button/button.js';

// An action runs work; it is never a link.
export interface ActionButtonProps extends Omit<
  ButtonProps,
  'onPress' | 'href' | 'target' | 'rel' | 'ref'
> {
  /** The action. When it returns a promise, the button is pending until the promise settles. */
  onPress?: ((event: PressEvent) => void | Promise<unknown>) | undefined;
  /** Receives a rejected action's error. Without it the rejection is rethrown. */
  onError?: ((error: unknown) => void) | undefined;
  /**
   * Milliseconds the button waits before it shows the pending state, so a fast action does not
   * flash a spinner. Presses are refused from the start either way. Defaults to 0.
   */
  pendingDelay?: number | undefined;
  /** The `<button>`. */
  ref?: Ref<HTMLButtonElement> | undefined;
}

type PendingAction = (() => void | Promise<unknown>) | undefined;

/**
 * Runs `action` unless `blocked`, keeping `setPending(true)` until it settles. Resolves to whether the
 * action ran. A rejection reaches `onError`, or is rethrown.
 */
export async function runPendingAction(options: {
  blocked: boolean;
  setPending: (pending: boolean) => void;
  action?: PendingAction;
  onError?: ((error: unknown) => void) | undefined;
}): Promise<boolean> {
  if (options.blocked) return false;
  options.setPending(true);
  try {
    await options.action?.();
    return true;
  } catch (error) {
    if (options.onError) {
      options.onError(error);
      return false;
    }
    throw error;
  } finally {
    options.setPending(false);
  }
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
}: Pick<ActionButtonProps, 'isPending' | 'onError'> & { isDisabled: boolean }) {
  const [internalPending, setInternalPending] = useState(false);
  const running = useRef(false);
  const pending = isPending ?? internalPending;
  const run = useCallback(
    (action: PendingAction) => {
      if (running.current) return;
      void runPendingAction({
        blocked: isDisabled || pending,
        setPending: (next) => {
          running.current = next;
          setInternalPending(next);
        },
        action,
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

/** A button that runs an asynchronous action and refuses repeat presses until it settles. */
export function ActionButton({
  variant = 'primary',
  onPress,
  onError,
  isPending,
  isDisabled = false,
  pendingDelay = 0,
  type,
  render,
  ...rest
}: ActionButtonProps) {
  const { pending, run, isBusy } = usePendingAction({ isPending, isDisabled, onError });
  const showsPending = useActiveAfter(pending, pendingDelay);
  const handlePress = useCallback(
    (event: PressEvent) => run(onPress ? () => onPress(event) : undefined),
    [run, onPress],
  );
  const submits = !isDisabled && (type === 'submit' || type === 'reset');

  return (
    <Button
      {...rest}
      type={type}
      render={submits ? guardActivation(type, isBusy, render) : render}
      variant={variant}
      isDisabled={isDisabled}
      isPending={showsPending}
      onPress={handlePress}
    />
  );
}
