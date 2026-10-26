import { type ReactNode } from 'react';
import type { IconSource } from '../icon/icon.js';
import { type SignatureDetails, type SignatureDialogCredentials, type SignatureDialogEntry } from '../signature-dialog/signature-dialog.js';
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
export interface DecisionSubmission {
    isPending: boolean;
    isSigning: boolean;
    setSigning: (isSigning: boolean) => void;
    error: string | null;
    /** Submits the decision, or opens the signature dialog first when the decision is signed. */
    start: () => void;
    /** Hands the decision to `onSubmit`, clearing the comment once it succeeds. */
    submit: (signature: SignatureDetails | null) => Promise<unknown>;
}
interface DecisionSubmissionOptions {
    details: Omit<DecisionControlDetails, 'signature'>;
    isSigned: boolean;
    isDisabled: boolean;
    onSubmit: (details: DecisionControlDetails) => void | Promise<unknown>;
    onSubmitted: () => void;
}
export declare const decisionControlHooks: import("../../core/hooks.js").ComponentHooks<"form" | "label" | "error" | "signature" | "comment" | "submit" | "choice">;
/** Submitting a decision: pending and failed while unsigned, through the signature dialog when signed. */
export declare function useDecisionSubmission({ details, isSigned, isDisabled, onSubmit, onSubmitted, }: DecisionSubmissionOptions): DecisionSubmission;
/** The signature dialog of a signed decision, stating the decision picked as its meaning. */
export declare function DecisionSignature({ signature, picked, comment, submission, }: {
    signature: DecisionControlSignature;
    picked: DecisionControlOption;
    comment: string;
    submission: DecisionSubmission;
}): import("react").JSX.Element;
/**
 * The comment field, unless no decision asks for one: required by `comment`, or by the decision
 * picked.
 */
export declare function DecisionComment({ comment, options, picked, value, onChange, isDisabled, }: {
    comment: DecisionControlComment;
    options: readonly DecisionControlOption[];
    picked: DecisionControlOption | undefined;
    value: string;
    onChange: (value: string) => void;
    isDisabled: boolean;
}): import("react").JSX.Element | null;
/** The failure of the last unsigned submission, then Submit. */
export declare function DecisionSubmit({ submission, label, isDisabled, }: {
    submission: DecisionSubmission;
    label: ReactNode;
    isDisabled: boolean;
}): import("react").JSX.Element;
export {};
//# sourceMappingURL=decision-parts.d.ts.map