'use client';

// Sending a composer's draft: at once, or once the host accepts it (specs/MESSAGE-COMPOSER.md,
// UIC-MESSAGE-COMPOSER-3.9; specs/COMMENT-COMPOSER.md, UIC-COMMENT-COMPOSER-1.3).

import { useRef, useState } from 'react';
import { type PersistCodec, useUiStorage } from '../core/provider.js';
import type { UiStorage } from '../core/storage.js';
import { isThenable } from './is-thenable.js';
import { useLatest } from './use-latest.js';
import { useLifetimeSignal } from './use-lifetime-signal.js';

/** Hands a value to the host, which may accept it later through a promise. */
export type Submitter<T> = (value: T) => void | Promise<unknown>;

interface SubmissionOptions<T> {
  onSubmit?: Submitter<T> | undefined;
  onSubmitError?: ((error: unknown) => void) | undefined;
  persistKey?: string | undefined;
  /** The draft once it is sent. */
  empty: T;
  /** How the draft is stored under `persistKey`, which also tells whether two drafts are the same. */
  codec: PersistCodec<T>;
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
  /**
   * Changes the draft as the reader does. A message sent before empties the draft only while no
   * such change came since, even one that typed the same words again.
   */
  setDraft: (next: T) => void;
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
 * settles: once it resolves the draft empties, unless the reader has changed it since through the
 * returned `setDraft` (even back to the same words) or it no longer holds the words sent, and where
 * the draft is another owner's now (the key or the storage adapter changed, or the composer
 * unmounted) only the stored draft it was sent from empties. A throw or a rejection keeps the draft
 * and goes to `onSubmitError`, or is rethrown without it.
 */
export function useDraftSubmission<T>(options: SubmissionOptions<T>): Submission<T> {
  const adapter = useUiStorage();
  const latest = useLatest(options);
  const owner: DraftOwner = {
    key: options.persistKey,
    storage: options.persistKey === undefined || options.isControlled ? undefined : adapter,
  };
  const latestOwner = useLatest(owner);
  const [waiting, setWaiting] = useState<readonly DraftOwner[]>([]);
  const inFlight = useRef<DraftOwner[]>([]);
  const revision = useRef(0);
  const beginSubmission = useLifetimeSignal();

  const fail = (error: unknown) => {
    const onSubmitError = latest.current.onSubmitError;
    if (!onSubmitError) throw error;
    onSubmitError(error);
  };
  const clear = (
    from: DraftOwner,
    sent: { text: string; revision: number },
    signal: AbortSignal,
  ) => {
    const { empty, codec, draft, setDraft } = latest.current;
    if (!signal.aborted && isSameOwner(latestOwner.current, from)) {
      if (revision.current === sent.revision && codec.stringify(draft) === sent.text)
        setDraft(empty);
    } else if (from.key !== undefined && from.storage?.getItem(from.key) === sent.text) {
      from.storage.setItem(from.key, codec.stringify(empty));
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
      if (clearsDraft) options.setDraft(options.empty);
      return;
    }
    const sent = { text: options.codec.stringify(value), revision: revision.current };
    const signal = beginSubmission();
    track(owner, true);
    void Promise.resolve(result).then(
      () => {
        track(owner, false);
        if (clearsDraft) clear(owner, sent, signal);
      },
      (error: unknown) => {
        track(owner, false);
        fail(error);
      },
    );
  };
  const setDraft = (next: T) => {
    revision.current += 1;
    options.setDraft(next);
  };
  return { isSubmitting: waiting.some((entry) => isSameOwner(entry, owner)), send, setDraft };
}
