'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { toErrorMessage } from '../../utils/to-error-message.js';

interface TreeRenameRequest {
  pending: boolean;
  error: string | null;
  reset: () => void;
  run: (action: () => unknown, onSuccess: () => void) => void;
}

/** An inline rename's pending/error feedback, scoped to the editing session that submitted it. */
export function useTreeRenameRequest(): TreeRenameRequest {
  const strings = useUiStrings();
  const token = useRef<symbol | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useLayoutEffect(
    () => () => {
      token.current = null;
    },
    [],
  );
  return useMemo(
    () => ({
      pending,
      error,
      reset() {
        token.current = null;
        setPending(false);
        setError(null);
      },
      run(action: () => unknown, onSuccess: () => void) {
        if (token.current !== null) return;
        const request = Symbol();
        token.current = request;
        setError(null);
        const settle = (failure?: unknown) => {
          if (token.current !== request) return;
          token.current = null;
          setPending(false);
          if (failure !== undefined) setError(toErrorMessage(failure, strings.actionFailed));
          else onSuccess();
        };
        try {
          const result = action();
          if (
            result !== null &&
            typeof result === 'object' &&
            'then' in result &&
            typeof result.then === 'function'
          ) {
            setPending(true);
            Promise.resolve(result).then(
              () => settle(),
              (failure: unknown) => settle(failure ?? new Error(strings.actionFailed)),
            );
          } else settle();
        } catch (failure) {
          settle(failure ?? new Error(strings.actionFailed));
        }
      },
    }),
    [pending, error, strings.actionFailed],
  );
}
