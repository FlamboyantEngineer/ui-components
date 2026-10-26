import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type DecisionControlComment, type DecisionControlDetails, type DecisionControlOption, type DecisionControlSignature } from './decision-parts.js';
export type { DecisionControlComment, DecisionControlDetails, DecisionControlOption, DecisionControlSignature, } from './decision-parts.js';
export interface DecisionControlProps extends BaseProps {
    /** Names the choice of decision. Defaults to the provider's `yourDecision` string. */
    label?: string | undefined;
    /** The decisions, in order. Defaults to Approve, then Reject, which asks for a comment. */
    options?: readonly DecisionControlOption[] | undefined;
    /** The decision picked (controlled), or `null`. */
    value?: string | null | undefined;
    /** The decision picked at first. Defaults to none. */
    defaultValue?: string | null | undefined;
    /** Receives the decision the reader picks. */
    onChange?: ((value: string | null) => void) | undefined;
    /** Asks for a comment. Defaults to `optional`. */
    comment?: DecisionControlComment | undefined;
    /** Signs the decision: Submit opens a `SignatureDialog` stating the decision as its meaning. */
    signature?: DecisionControlSignature | undefined;
    /** Labels the submit button. Defaults to the provider's `submitDecision` string. */
    submitLabel?: ReactNode;
    /**
     * Submits the decision. A returned promise keeps Submit pending; a rejection shows its error and
     * keeps the comment. The comment clears once it succeeds.
     */
    onSubmit: (details: DecisionControlDetails) => void | Promise<unknown>;
    /** Refuses picking and submitting. */
    isDisabled?: boolean | undefined;
}
/**
 * The reader's own decision: a choice of decisions (approve or reject, or the scores of a vote) on
 * a `SegmentedChoice`, a comment that is optional, required, or required by the decision picked,
 * and Submit. With `signature`, Submit confirms through a `SignatureDialog` first.
 */
export declare function DecisionControl({ label, options, value, defaultValue, onChange, comment, signature, submitLabel, onSubmit, isDisabled, className, ...rest }: DecisionControlProps): import("react").JSX.Element;
//# sourceMappingURL=decision-control.d.ts.map