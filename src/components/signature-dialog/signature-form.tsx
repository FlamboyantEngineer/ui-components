'use client';

import { type Ref, type RefObject, useImperativeHandle, useRef, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useLifetimeSignal } from '../../utils/use-lifetime-signal.js';
import { Choice, ChoiceGroup } from '../choice-group/choice-group.js';
import { Form } from '../form/form.js';
import { SignaturePad, type SignatureValue } from '../signature-pad/signature-pad.js';
import { TextField } from '../text-field/text-field.js';

/** A meaning a signature can give: what the signer asserts by signing. */
export interface SignatureMeaning {
  id: Key;
  /** The meaning's name, such as "Approved" or "Reviewed". */
  label: string;
  /** What signing with this meaning asserts, under its name. */
  description?: string | undefined;
}

/** What the signer re-enters: the password, or the user name and the password. */
export type SignatureDialogCredentials = 'password' | 'username-password';

/** Whether the dialog asks for an entry, and whether the signer must give it. */
export type SignatureDialogEntry = 'none' | 'optional' | 'required';

/** What the signer gave, handed to `onSign`. */
export interface SignatureDetails {
  /** `userName`, or the user name the signer typed with `username-password` credentials. */
  userName: string;
  password: string;
  /** The `id` of the meaning signed with. */
  meaning: Key;
  /** The reason given, or empty text. */
  reason: string;
  /** The drawn, typed or image signature, or `null` when none was asked or given. */
  signature: SignatureValue | null;
}

/** Validates the form and, when it passes, signs and closes; resolves nothing when invalid. */
export type SignatureSubmit = (close: () => void) => Promise<unknown> | undefined;

interface SignatureFormProps {
  userName: string;
  credentials: SignatureDialogCredentials;
  meanings: readonly SignatureMeaning[];
  reason: SignatureDialogEntry;
  drawing: SignatureDialogEntry;
  onSign: (details: SignatureDetails) => void | Promise<unknown>;
  /** Receives the submit function that the dialog's Sign action runs. */
  submitRef: Ref<SignatureSubmit>;
}

export const signatureDialogHooks = createHooks('signature-dialog', [
  'summary',
  'form',
  'meaning',
  'signer',
]);

const hooks = signatureDialogHooks;

/** The meaning: stated when there is one, chosen from radios when there are several. */
function MeaningChoice({
  meanings,
  value,
  onChange,
}: {
  meanings: readonly SignatureMeaning[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const strings = useUiStrings();
  const [only] = meanings;
  if (only && meanings.length === 1) {
    return <p {...hooks.slot('meaning')}>{strings.signatureMeaningIs(only.label)}</p>;
  }
  return (
    <ChoiceGroup label={strings.signatureMeaning} isRequired value={value} onChange={onChange}>
      {meanings.map((meaning) => (
        <Choice
          key={toKeyIdentity(meaning.id)}
          value={toKeyIdentity(meaning.id)}
          description={meaning.description}
        >
          {meaning.label}
        </Choice>
      ))}
    </ChoiceGroup>
  );
}

/**
 * The meaning a signature gives, by key identity, from the current meanings: the sole meaning when
 * one is stated, otherwise the signer's pick while it is still listed, and none once it is gone, so
 * a removed meaning is never signed with and the signer must choose again.
 */
function resolveMeaning(meanings: readonly SignatureMeaning[], picked: string | null) {
  const [only] = meanings;
  if (only && meanings.length === 1) return toKeyIdentity(only.id);
  return meanings.some((entry) => toKeyIdentity(entry.id) === picked) ? picked : null;
}

/** Who signs, then the user name when it is asked and the password. */
function SignerCredentials({
  userName,
  typedUserName,
  password,
  onUserNameChange,
  onPasswordChange,
}: {
  userName: string;
  /** The user name typed so far, or `null` when only the password is asked. */
  typedUserName: string | null;
  password: string;
  onUserNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}) {
  const strings = useUiStrings();
  return (
    <>
      <p {...hooks.slot('signer')}>{strings.signingAs(userName)}</p>
      {typedUserName === null ? null : (
        <TextField
          label={strings.userName}
          autoComplete="username"
          isRequired
          value={typedUserName}
          onChange={onUserNameChange}
        />
      )}
      <TextField
        label={strings.password}
        type="password"
        autoComplete="current-password"
        isRequired
        value={password}
        onChange={onPasswordChange}
      />
    </>
  );
}

/**
 * Hands the dialog's Sign action a submit function that validates the form and, when it passes,
 * signs with the details and closes. A signing that settles after its session ended (the form left
 * with a close, a new opening or another signer) neither closes, fails nor clears the session that
 * replaced it. Returns what the form calls when its submit passes validation.
 */
function useSigningSubmit({
  submitRef,
  form,
  onSign,
  clearPassword,
  getDetails,
}: {
  submitRef: Ref<SignatureSubmit>;
  form: RefObject<HTMLFormElement | null>;
  onSign: SignatureFormProps['onSign'];
  clearPassword: () => void;
  getDetails: () => SignatureDetails | null;
}) {
  const isValid = useRef(false);
  const beginSigning = useLifetimeSignal();
  useImperativeHandle(submitRef, () => (close: () => void) => {
    isValid.current = false;
    form.current?.requestSubmit();
    const details = getDetails();
    if (!isValid.current || !details) return undefined;
    const signal = beginSigning();
    return Promise.resolve()
      .then(() => onSign(details))
      .then(
        () => {
          if (!signal.aborted) close();
        },
        (error: unknown) => {
          if (signal.aborted) return;
          clearPassword();
          throw error;
        },
      );
  });
  return () => {
    isValid.current = true;
  };
}

/**
 * The entries of a signature: the meaning, the reason, the drawn signature and the credentials, in
 * a form whose submit validation runs when the dialog's Sign action asks. The credentials live only
 * here, so they leave with the dialog, and a failed signing clears the password.
 */
export function SignatureForm({
  userName,
  credentials,
  meanings,
  reason,
  drawing,
  onSign,
  submitRef,
}: SignatureFormProps) {
  const strings = useUiStrings();
  const form = useRef<HTMLFormElement>(null);
  const [typedUserName, setTypedUserName] = useState('');
  const [password, setPassword] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const meaning = resolveMeaning(meanings, picked);
  const [reasonText, setReasonText] = useState('');
  const [signature, setSignature] = useState<SignatureValue | null>(null);
  const submitted = useSigningSubmit({
    submitRef,
    form,
    onSign,
    clearPassword: () => setPassword(''),
    getDetails: () => {
      const chosen = meanings.find((entry) => toKeyIdentity(entry.id) === meaning);
      // Validation refuses a missing choice, so this only guards against a list without meanings.
      if (!chosen) return null;
      return {
        userName: credentials === 'username-password' ? typedUserName : userName,
        password,
        meaning: chosen.id,
        // An entry no longer asked for is kept for later but never signed with.
        reason: reason === 'none' ? '' : reasonText,
        signature: drawing === 'none' ? null : signature,
      };
    },
  });
  return (
    <Form
      {...hooks.slot('form')}
      ref={form}
      validationBehavior="aria"
      onSubmit={(event) => {
        event.preventDefault();
        submitted();
      }}
    >
      <MeaningChoice meanings={meanings} value={meaning} onChange={setPicked} />
      {reason === 'none' ? null : (
        <TextField
          label={strings.signatureReason}
          multiline
          isRequired={reason === 'required'}
          value={reasonText}
          onChange={setReasonText}
        />
      )}
      {drawing === 'none' ? null : (
        <SignaturePad
          label={strings.signature}
          isRequired={drawing === 'required'}
          value={signature}
          onChange={setSignature}
        />
      )}
      <SignerCredentials
        userName={userName}
        typedUserName={credentials === 'username-password' ? typedUserName : null}
        password={password}
        onUserNameChange={setTypedUserName}
        onPasswordChange={setPassword}
      />
    </Form>
  );
}
