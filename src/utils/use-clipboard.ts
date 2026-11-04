'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { type CopyOptions, copyText } from './clipboard.js';
import { DEFAULT_COPY_TIMEOUT } from './copy-timeout.js';

/** The outcome of the last copy, until `timeout` returns it to `idle`. */
export type CopyStatus = 'idle' | 'copied' | 'failed';

export interface ClipboardOptions extends Omit<CopyOptions, 'signal' | 'owner'> {
  /** How long `copied` or `failed` lasts, in milliseconds. Defaults to 2000. */
  timeout?: number | undefined;
}

export interface ClipboardState {
  /**
   * Copies `text` with `copyText` and resolves whether it reached the clipboard. `owner`, such as the
   * pressed element, picks the window and document that take the copy.
   */
  copy: (text: string, owner?: Node | null) => Promise<boolean>;
  status: CopyStatus;
  /** Returns to `idle` at once. */
  reset: () => void;
}

/**
 * Copies text and keeps the outcome as `status` (`copied` or `failed`) for `timeout` milliseconds,
 * for feedback such as a check mark. A new copy restarts the timeout; unmounting clears it. A copy
 * a newer copy, a reset or unmounting supersedes changes no feedback and never falls back to a
 * selection copy, so it cannot overwrite what the newer copy wrote.
 */
export function useClipboard({
  timeout = DEFAULT_COPY_TIMEOUT,
  clipboard,
  fallback,
}: ClipboardOptions = {}): ClipboardState {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The latest requested copy; a newer copy, a reset or unmounting withdraws it.
  const request = useRef<AbortController | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => {
    return () => {
      request.current?.abort();
      clearTimer();
    };
  }, [clearTimer]);

  const reset = useCallback(() => {
    request.current?.abort();
    clearTimer();
    setStatus('idle');
  }, [clearTimer]);

  const copy = useCallback(
    async (text: string, owner?: Node | null) => {
      request.current?.abort();
      const current = new AbortController();
      request.current = current;
      const copied = await copyText(text, {
        owner,
        clipboard,
        fallback,
        signal: current.signal,
      });
      if (current.signal.aborted) return copied;
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
