'use client';

// Sending a composer's value: at once, or once the host accepts it (specs/MESSAGE-COMPOSER.md,
// UIC-MESSAGE-COMPOSER-3.9).

import { useEffect, useRef, useState } from 'react';
import { useUiStorage } from '../../core/provider.js';
import type { UiStorage } from '../../core/storage.js';
import { isThenable } from '../../utils/is-thenable.js';
import { useLatest } from '../../utils/use-latest.js';
import type { ComposerFormat } from './use-composer-state.js';

/** Hands a value to the host, which may accept it later through a promise. */
export type Submitter<T> = (value: T) => void | Promise<unknown>;

interface SubmissionOptions<T> {
  onSubmit?: Submitter<T> | undefined;
  onSubmitError?: ((error: unknown) => void) | undefined;
  persistKey?: string | undefined;
  format: ComposerFormat<T>;
  /** The host holds the draft, so the provider's storage does not. */
  isControlled: boolean;
  draft: T;
  setDraft: (next: T) => void;
}

interface Submission<T> {
  /** A message sent from this draft waits for the host to accept it. */
  isSubmitting: boolean;
  /**
   * Sends the value through `submitter` (`onSubmit` by default); with `clearsDraft`, empties the
   * draft once the host has accepted it.
   */
  send: (value: T, clearsDraft: boolean, submitter?: Submitter<T>) => void;
}

/**
 * Whose draft a message was sent from: the key, and the storage adapter that holds the draft under
 * it. A draft without a key, or one the host controls, belongs to no adapter.
 */
interface DraftOwner {
  key: string | undefined;
  storage: UiStorage | undefined;
}

const isSameOwner = (a: DraftOwner, b: DraftOwner) => a.key === b.key && a.storage === b.storage;

/**
 * Sends through `onSubmit`, or the submitter a send names. A promise it returns holds sending from the same draft until it
 * settles: once it resolves the draft empties, unless the reader has changed it since, and where
 * the draft is another owner's now (the key or the storage adapter changed, or the composer
 * unmounted) only the stored draft it was sent from empties. A throw or a rejection keeps the draft
 * and goes to `onSubmitError`, or is rethrown without it.
 */
export function useSubmission<T>(options: SubmissionOptions<T>): Submission<T> {
  const adapter = useUiStorage();
  const latest = useLatest(options);
  const owner: DraftOwner = {
    key: options.persistKey,
    storage: options.persistKey === undefined || options.isControlled ? undefined : adapter,
  };
  const latestOwner = useLatest(owner);
  const [waiting, setWaiting] = useState<readonly DraftOwner[]>([]);
  const inFlight = useRef<DraftOwner[]>([]);
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fail = (error: unknown) => {
    const onSubmitError = latest.current.onSubmitError;
    if (!onSubmitError) throw error;
    onSubmitError(error);
  };
  const clear = (from: DraftOwner, sent: string) => {
    const { format, draft, setDraft } = latest.current;
    if (isMounted.current && isSameOwner(latestOwner.current, from)) {
      if (format.codec.stringify(draft) === sent) setDraft(format.empty);
    } else if (from.key !== undefined && from.storage?.getItem(from.key) === sent) {
      from.storage.setItem(from.key, format.codec.stringify(format.empty));
    }
  };
  const track = (from: DraftOwner, isWaiting: boolean) => {
    const update = (current: readonly DraftOwner[]) =>
      isWaiting ? [...current, from] : current.filter((entry) => entry !== from);
    inFlight.current = update(inFlight.current);
    setWaiting(update);
  };

  const send = (value: T, clearsDraft: boolean, submitter = options.onSubmit) => {
    if (inFlight.current.some((entry) => isSameOwner(entry, owner))) return;
    let result: void | Promise<unknown>;
    try {
      result = submitter?.(value);
    } catch (error) {
      fail(error);
      return;
    }
    if (!isThenable(result)) {
      if (clearsDraft) options.setDraft(options.format.empty);
      return;
    }
    const sent = options.format.codec.stringify(value);
    track(owner, true);
    void Promise.resolve(result).then(
      () => {
        track(owner, false);
        if (clearsDraft) clear(owner, sent);
      },
      (error: unknown) => {
        track(owner, false);
        fail(error);
      },
    );
  };
  return { isSubmitting: waiting.some((entry) => isSameOwner(entry, owner)), send };
}
