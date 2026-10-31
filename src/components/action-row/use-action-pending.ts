'use client';

import { useCallback, useRef, useState } from 'react';
import type { PressEvent } from '../../core/events.js';
import { isThenable } from '../../utils/is-thenable.js';
import { runPendingAction } from '../button/button.js';
import type { ActionRowAction } from './action-verbs.js';

/** An action as its button or overflow menu item runs it: the press and the pending state. */
export interface ActionPress {
  /** Runs the action's `onPress`, unless it is disabled, pending or still running. */
  onPress: ((event: PressEvent) => void) | undefined;
  /** The caller's `isPending`, else whether a press the row ran is unsettled. */
  isPending: boolean | undefined;
}

/**
 * The pending state of the row's actions, by action identity. A promise an action's `onPress`
 * returns keeps that action pending and refuses its repeat presses until it settles, whether the
 * action is a button or an overflow menu item, and while it moves between the two. A rejection
 * reaches the action's `onError`, or is rethrown, as a `Button` does.
 */
export function useActionPending() {
  const running = useRef(new Set<string>());
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(() => new Set());
  const setPending = useCallback((key: string, isPending: boolean) => {
    if (isPending) running.current.add(key);
    else running.current.delete(key);
    setPendingKeys(new Set(running.current));
  }, []);
  return useCallback(
    (action: ActionRowAction, key: string): ActionPress => {
      const isPending = action.isPending ?? pendingKeys.has(key);
      const { onPress, onError } = action;
      if (!onPress) return { onPress, isPending };
      return {
        isPending,
        onPress: (event) => {
          if (action.isDisabled || action.isPending || running.current.has(key)) return;
          let result: unknown;
          try {
            result = onPress(event);
          } catch (error) {
            if (!onError) throw error;
            onError(error);
            return;
          }
          if (!isThenable(result)) return;
          void runPendingAction({
            blocked: false,
            setPending: (next) => setPending(key, next),
            action: () => result,
            onError,
          });
        },
      };
    },
    [pendingKeys, setPending],
  );
}
