'use client';

import { type ReactNode, useRef, useState } from 'react';
import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Modal, type ModalProps, useModalOpenState } from '../modal/modal.js';
import {
  type SignatureDetails,
  type SignatureDialogCredentials,
  type SignatureDialogEntry,
  signatureDialogHooks as hooks,
  SignatureForm,
  type SignatureMeaning,
  type SignatureSubmit,
} from './signature-form.js';

export type {
  SignatureDetails,
  SignatureDialogCredentials,
  SignatureDialogEntry,
  SignatureMeaning,
} from './signature-form.js';

export interface SignatureDialogProps
  extends
    RefProps<HTMLDivElement>,
    Pick<ModalProps, 'isOpen' | 'defaultOpen' | 'onOpenChange' | 'title' | 'size'>,
    BaseProps {
  /** What is signed: a summary of the change or a count, above the entries. */
  children?: ReactNode;
  /** The signer's user name, shown above the credentials. */
  userName: string;
  /** What the signer re-enters. Defaults to `password`. */
  credentials?: SignatureDialogCredentials | undefined;
  /** The meanings to sign with: one is stated, several are chosen from. */
  meanings: readonly SignatureMeaning[];
  /** Asks for a reason. Defaults to `optional`. */
  reason?: SignatureDialogEntry | undefined;
  /** Asks for a drawn, typed or image signature. Defaults to `none`. */
  drawing?: SignatureDialogEntry | undefined;
  /** Labels the Sign action. Defaults to the provider's `sign` string. */
  confirmLabel?: ReactNode;
  /** Signs with what the signer gave; a returned promise keeps Sign pending, and a rejection shows its error. */
  onSign: (details: SignatureDetails) => void | Promise<unknown>;
}

/**
 * Counts the dialog's openings and closings, so each opening has its own entries: the count moves
 * the moment the dialog opens or closes, not when an exit animation ends.
 */
function useOpeningCount(isOpen: boolean): number {
  const [opening, setOpening] = useState({ isOpen, count: 0 });
  if (opening.isOpen !== isOpen) setOpening({ isOpen, count: opening.count + 1 });
  return opening.isOpen === isOpen ? opening.count : opening.count + 1;
}

/**
 * A modal confirmation that binds the signer to an action: what is signed, the meaning of the
 * signature, an optional reason and drawn signature, and the signer's password asked again. Sign
 * validates the entries, then hands them to `onSign`; the dialog closes when it succeeds and shows
 * its error when it fails. The credentials are never kept: they leave with the dialog.
 */
export function SignatureDialog({
  children,
  userName,
  credentials = 'password',
  meanings,
  reason = 'optional',
  drawing = 'none',
  confirmLabel,
  onSign,
  isOpen,
  defaultOpen,
  onOpenChange,
  className,
  ...rest
}: SignatureDialogProps) {
  const strings = useUiStrings();
  const submit = useRef<SignatureSubmit>(null);
  const openState = useModalOpenState({ isOpen, defaultOpen, onOpenChange });
  const opening = useOpeningCount(openState.isOpen);
  // A new opening, a close, another signer or other credentials start a new signing session: its
  // entries start empty, and a signing still pending from the previous one settles silently.
  const session = `${opening}\u0000${credentials}\u0000${userName}`;
  return (
    <Modal
      {...rest}
      isOpen={openState.isOpen}
      onOpenChange={openState.setOpen}
      className={mergeClassNames(hooks.className, className)}
      primaryAction={{
        label: confirmLabel ?? strings.sign,
        onPress: (close) => submit.current?.(close),
      }}
    >
      {isEmptyNode(children) ? null : <div {...hooks.slot('summary')}>{children}</div>}
      <SignatureForm
        key={session}
        userName={userName}
        credentials={credentials}
        meanings={meanings}
        reason={reason}
        drawing={drawing}
        onSign={onSign}
        submitRef={submit}
      />
    </Modal>
  );
}
