'use client';

import { toErrorMessage } from '../../utils/to-error-message.js';
import { useRef, useState, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { runPendingAction } from '../button/button.js';
import type { IconSource } from '../icon/icon.js';
import { InlineError } from '../inline-error/inline-error.js';
import {
  SignatureDialog,
  type SignatureDetails,
  type SignatureDialogCredentials,
  type SignatureDialogEntry,
} from '../signature-dialog/signature-dialog.js';
import { TextField } from '../text-field/text-field.js';
import { useLifetimeSignal } from '../../utils/use-lifetime-signal.js';
import { useLatest } from '../../utils/use-latest.js';

/** One decision the reader can make: approve, reject, or a score on a vote. */
export interface DecisionControlOption {
  value: string;
  /** The decision's name, on its segment and in the signature's meaning. */
  label: string;
  /** A decorative icon before the label. */
  icon?: IconSource;
  /** Asks for a comment with this decision, whatever `comment` says. */
  requiresComment?: boolean | undefined;
}

/** Whether the control asks for a comment, and whether the reader must give one. */
export type DecisionControlComment = 'none' | 'optional' | 'required';

/** Signing a decision: the signer and what they re-enter, as `SignatureDialog` asks. */
export interface DecisionControlSignature {
  /** The signer's user name. */
  userName: string;
  /** What the signer re-enters. Defaults to `password`. */
  credentials?: SignatureDialogCredentials | undefined;
  /** Asks for a drawn or typed signature. Defaults to `none`. */
  drawing?: SignatureDialogEntry | undefined;
}

/** What the reader decided, handed to `onSubmit`. */
export interface DecisionControlDetails {
  /** The `value` of the decision made. */
  decision: string;
  /** The comment given, or empty text. */
  comment: string;
  /** What the signer gave when the decision is signed, else `null`. */
  signature: SignatureDetails | null;
}

interface DecisionSubmission {
  isPending: boolean;
  isSigning: boolean;
  setSigning: (isSigning: boolean) => void;
  error: string | null;
  /** Submits the decision, or opens the signature dialog first when the decision is signed. */
  start: () => void;
  /**
   * Hands the decision to `onSubmit`; once it succeeds, clears the comment if the decision and
   * comment are still the ones submitted.
   */
  submit: (signature: SignatureDetails | null) => Promise<unknown>;
}

interface DecisionSubmissionOptions {
  details: Omit<DecisionControlDetails, 'signature'>;
  /**
   * What a signature signs for: the decision, whether it needs a comment and the signer's
   * configuration, or `null` while the decision cannot be signed (no signature, no decision picked,
   * or disabled). Signing ends when it changes.
   */
  signingContext: string | null;
  /** The decision asks for a comment and has none, so it cannot be submitted. */
  isIncomplete: boolean;
  isDisabled: boolean;
  onSubmit: (details: DecisionControlDetails) => void | Promise<unknown>;
  /** Called once a submission succeeds while its decision and comment are unchanged. */
  onSubmitted: () => void;
}

export const decisionControlHooks = createHooks('decision-control', [
  'form',
  'label',
  'choice',
  'comment',
  'error',
  'submit',
  'signature',
]);

const hooks = decisionControlHooks;

/**
 * What a signature would sign for, and whether the decision lacks a comment it needs: the signing
 * context is the decision, its comment requirement and the signer's configuration, or `null` while
 * the decision cannot be signed.
 */
export function describeSigning({
  signature,
  picked,
  comment,
  commentText,
  isDisabled,
}: {
  signature: DecisionControlSignature | undefined;
  picked: DecisionControlOption | undefined;
  comment: DecisionControlComment;
  commentText: string;
  isDisabled: boolean;
}): Pick<DecisionSubmissionOptions, 'signingContext' | 'isIncomplete'> {
  const needsComment = comment === 'required' || Boolean(picked?.requiresComment);
  const signingContext =
    signature && picked && !isDisabled
      ? JSON.stringify([
          picked.value,
          needsComment,
          signature.userName,
          signature.credentials ?? 'password',
          signature.drawing ?? 'none',
        ])
      : null;
  return { signingContext, isIncomplete: !picked || (needsComment && commentText === '') };
}

/**
 * Submitting a decision: pending and failed while unsigned, through the signature dialog when
 * signed. A signature is tied to the context it was started for: when the decision, its comment
 * requirement or the signer's configuration changes, or the control is disabled, signing ends and
 * needs a new Submit. A success settles only in the mounted control, and only while the reader has
 * not changed the decision or the comment since submitting, so later edits stay.
 */
export function useDecisionSubmission({
  details,
  signingContext,
  isIncomplete,
  isDisabled,
  onSubmit,
  onSubmitted,
}: DecisionSubmissionOptions): DecisionSubmission {
  const strings = useUiStrings();
  const [isPending, setPending] = useState(false);
  const [signingFor, setSigningFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);
  const latest = useLatest(details);
  const beginSubmission = useLifetimeSignal();
  // A signature in progress ends with its context, and does not come back with it.
  if (signingFor !== null && signingFor !== signingContext) setSigningFor(null);
  const isSigning = signingFor !== null && signingFor === signingContext;
  const submit = async (signature: SignatureDetails | null) => {
    if (isDisabled || isIncomplete || running.current) return;
    running.current = true;
    const sent = details;
    const signal = beginSubmission();
    try {
      await onSubmit({ ...sent, signature });
      const current = latest.current;
      const isUnchanged = current.decision === sent.decision && current.comment === sent.comment;
      if (!signal.aborted && isUnchanged) onSubmitted();
    } finally {
      running.current = false;
    }
  };
  const start = () => {
    if (isDisabled || isIncomplete || running.current) return;
    if (signingContext !== null) {
      setSigningFor(signingContext);
      return;
    }
    setError(null);
    void runPendingAction({
      blocked: false,
      setPending,
      action: () => submit(null),
      onError: (reason) => setError(toErrorMessage(reason, strings.decisionFailed)),
    });
  };
  const setSigning = (next: boolean) => setSigningFor(next ? signingContext : null);
  return { isPending, isSigning, setSigning, error, start, submit };
}

/** The signature dialog of a signed decision, stating the decision picked as its meaning. */
export function DecisionSignature({
  signature,
  picked,
  comment,
  submission,
}: {
  signature: DecisionControlSignature;
  picked: DecisionControlOption;
  comment: string;
  submission: DecisionSubmission;
}) {
  const strings = useUiStrings();
  return (
    <SignatureDialog
      isOpen={submission.isSigning}
      onOpenChange={submission.setSigning}
      title={strings.signDecision}
      userName={signature.userName}
      credentials={signature.credentials}
      drawing={signature.drawing}
      reason="none"
      meanings={[{ id: picked.value, label: picked.label }]}
      onSign={submission.submit}
      className={hooks.slotClass('signature')}
    >
      {comment.trim() ? comment : null}
    </SignatureDialog>
  );
}

/**
 * The comment field, unless no decision asks for one: required by `comment`, or by the decision
 * picked.
 */
export function DecisionComment({
  comment,
  options,
  picked,
  value,
  onChange,
  isDisabled,
}: {
  comment: DecisionControlComment;
  options: readonly DecisionControlOption[];
  picked: DecisionControlOption | undefined;
  value: string;
  onChange: (value: string) => void;
  isDisabled: boolean;
}) {
  const strings = useUiStrings();
  if (comment === 'none' && !options.some((option) => option.requiresComment)) return null;
  return (
    <TextField
      label={strings.comment}
      multiline
      isRequired={comment === 'required' || Boolean(picked?.requiresComment)}
      isDisabled={isDisabled}
      value={value}
      onChange={onChange}
      className={hooks.slotClass('comment')}
    />
  );
}

/** The failure of the last unsigned submission, then Submit. */
export function DecisionSubmit({
  submission,
  label,
  isDisabled,
}: {
  submission: DecisionSubmission;
  label: ReactNode;
  isDisabled: boolean;
}) {
  const strings = useUiStrings();
  return (
    <>
      {submission.error ? (
        <InlineError className={hooks.slotClass('error')}>{submission.error}</InlineError>
      ) : null}
      <Button
        type="submit"
        variant="primary"
        isDisabled={isDisabled}
        isPending={submission.isPending}
        className={hooks.slotClass('submit')}
      >
        {label ?? strings.submitDecision}
      </Button>
    </>
  );
}
