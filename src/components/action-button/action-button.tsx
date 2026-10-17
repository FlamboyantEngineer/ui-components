import { useCallback, useRef, useState } from 'react';
import type { PressEvent } from 'react-aria-components';
import { Button, type ButtonProps } from '../button/button.js';

export interface ActionButtonProps extends Omit<ButtonProps, 'onPress'> {
  /** The action. When it returns a promise, the button is pending until the promise settles. */
  onPress?: ((event: PressEvent) => void | Promise<unknown>) | undefined;
  /** Receives a rejected action's error. Without it the rejection is rethrown. */
  onError?: ((error: unknown) => void) | undefined;
}

/**
 * Runs `action` unless `blocked`, keeping `setPending(true)` until it settles. Resolves to whether the
 * action ran. A rejection reaches `onError`, or is rethrown.
 */
export async function runPendingAction(options: {
  blocked: boolean;
  setPending: (pending: boolean) => void;
  action?: (() => void | Promise<unknown>) | undefined;
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

/** A button that runs an asynchronous action and refuses repeat presses until it settles. */
export function ActionButton({
  variant = 'primary',
  onPress,
  onError,
  isPending,
  isDisabled = false,
  ...rest
}: ActionButtonProps) {
  const [internalPending, setInternalPending] = useState(false);
  const running = useRef(false);
  const pending = isPending ?? internalPending;

  const handlePress = useCallback(
    (event: PressEvent) => {
      if (running.current) return;
      void runPendingAction({
        blocked: isDisabled || pending,
        setPending: (next) => {
          running.current = next;
          setInternalPending(next);
        },
        action: onPress ? () => onPress(event) : undefined,
        onError,
      });
    },
    [isDisabled, pending, onPress, onError],
  );

  return (
    <Button
      {...rest}
      variant={variant}
      isDisabled={isDisabled}
      isPending={pending}
      onPress={handlePress}
    />
  );
}
