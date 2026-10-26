import { type Ref } from 'react';
import type { Key } from '../../core/props.js';
import { type SignatureValue } from '../signature-pad/signature-pad.js';
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
    /** The drawn or typed signature, or `null` when none was asked or given. */
    signature: SignatureValue | null;
}
/** Validates the form and, when it passes, signs and closes; resolves nothing when invalid. */
export type SignatureSubmit = (close: () => void) => Promise<unknown> | undefined;
export interface SignatureFormProps {
    userName: string;
    credentials: SignatureDialogCredentials;
    meanings: readonly SignatureMeaning[];
    reason: SignatureDialogEntry;
    drawing: SignatureDialogEntry;
    onSign: (details: SignatureDetails) => void | Promise<unknown>;
    /** Receives the submit function that the dialog's Sign action runs. */
    submitRef: Ref<SignatureSubmit>;
}
export declare const signatureDialogHooks: import("../../core/hooks.js").ComponentHooks<"form" | "summary" | "meaning" | "signer">;
/**
 * The entries of a signature: the meaning, the reason, the drawn signature and the credentials, in
 * a form whose submit validation runs when the dialog's Sign action asks. The credentials live only
 * here, so they leave with the dialog, and a failed signing clears the password.
 */
export declare function SignatureForm({ userName, credentials, meanings, reason, drawing, onSign, submitRef, }: SignatureFormProps): import("react").JSX.Element;
//# sourceMappingURL=signature-form.d.ts.map