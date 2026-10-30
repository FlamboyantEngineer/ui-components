'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { copyText, type CopyOptions } from './clipboard.js';
import { DEFAULT_COPY_TIMEOUT } from './copy-timeout.js';

/** The outcome of the last copy, until `timeout` returns it to `idle`. */
export type CopyStatus = 'idle' | 'copied' | 'failed';

export interface ClipboardOptions extends CopyOptions {
  /** How long `copied` or `failed` lasts, in milliseconds. Defaults to 2000. */
  timeout?: number | undefined;
}

export interface ClipboardState {
  /** Copies `text` with `copyText` and resolves whether it reached the clipboard. */
  copy: (text: string) => Promise<boolean>;
  status: CopyStatus;
  /** Returns to `idle` at once. */
  reset: () => void;
}

/**
 * Copies text and keeps the outcome as `status` (`copied` or `failed`) for `timeout` milliseconds,
 * for feedback such as a check mark. A new copy restarts the timeout; unmounting clears it.
 */
export function useClipboard({
  timeout = DEFAULT_COPY_TIMEOUT,
  clipboard,
  fallback,
}: ClipboardOptions = {}): ClipboardState {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);
  const request = useRef(0);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      request.current += 1;
      clearTimer();
    };
  }, [clearTimer]);

  const reset = useCallback(() => {
    request.current += 1;
    clearTimer();
    setStatus('idle');
  }, [clearTimer]);

  const copy = useCallback(
    async (text: string) => {
      const current = ++request.current;
      const copied = await copyText(text, { clipboard, fallback });
      if (!isMounted.current || current !== request.current) return copied;
      clearTimer();
      setStatus(copied ? 'copied' : 'failed');
      timer.current = setTimeout(() => {
        timer.current = null;
        setStatus('idle');
      }, timeout);
      return copied;
    },
    [clipboard, fallback, timeout, clearTimer],
  );

  return { copy, status, reset };
}
