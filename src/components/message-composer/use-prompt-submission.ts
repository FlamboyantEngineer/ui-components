'use client';

import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import type { PersistCodec } from '../../core/provider.js';
import { useDraftSubmission } from '../../utils/use-draft-submission.js';
import { matchesComposerSubmitKey, useComposerKeys } from './composer-keys.js';

export interface PromptSubmissionOptions {
  /** The caller's current prompt. */
  value: string;
  /** Updates the prompt as it is edited, and clears it once accepted. */
  onChange: (value: string) => void;
  /** Accepts the prompt. Returning a promise holds sending until that promise settles. */
  onSubmit: (value: string) => void | Promise<unknown>;
  /** Receives a thrown error or rejected promise. Without it the error is rethrown. */
  onSubmitError?: ((error: unknown) => void) | undefined;
  /** Blocks sending while a reply is running. */
  isPending?: boolean | undefined;
  /** Blocks sending. Set the controls' disabled props separately as needed. */
  isDisabled?: boolean | undefined;
}

export interface PromptSubmission {
  /** A nonblank prompt can be sent. Use this to enable the submit button. */
  canSubmit: boolean;
  /** The caller's promise for the sent prompt has yet to settle. */
  isSubmitting: boolean;
  /** Pass to the form to send the prompt and stay on the page. */
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  /** Pass to the textarea so edits are tracked while a submission is in flight. */
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  /** Pass to the textarea to submit its associated form on a sending chord. */
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
}

const textCodec: PersistCodec<string> = {
  parse: (text) => text,
  stringify: (text) => text,
};

/**
 * Gives a form and its textarea the plain composer's submission behavior. Enter and Ctrl+Enter
 * submit through the form, Shift+Enter inserts a newline, and bare Enter also inserts a newline
 * on a coarse-pointer device.
 */
export function usePromptSubmission(options: PromptSubmissionOptions): PromptSubmission {
  const { value, onChange, isPending, isDisabled } = options;
  const { submit } = useComposerKeys(undefined, { isPending: false, isEditing: false });
  const submission = useDraftSubmission({
    ...options,
    empty: '',
    codec: textCodec,
    isControlled: true,
    draft: value,
    setDraft: onChange,
  });
  const canSubmit = !isPending && !isDisabled && !submission.isSubmitting && value.trim() !== '';

  return {
    canSubmit,
    isSubmitting: submission.isSubmitting,
    onSubmit(event) {
      if (event.target !== event.currentTarget || event.defaultPrevented) return;
      event.preventDefault();
      if (canSubmit) submission.send(value, true);
    },
    onChange: (event) => submission.setDraft(event.currentTarget.value),
    onKeyDown(event) {
      const form = event.currentTarget.form;
      if (!form || event.defaultPrevented || !matchesComposerSubmitKey(event.nativeEvent, submit))
        return;
      event.preventDefault();
      if (canSubmit) form.requestSubmit();
    },
  };
}
