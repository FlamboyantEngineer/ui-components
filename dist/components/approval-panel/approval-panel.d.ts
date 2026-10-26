import { type ReactNode, type Ref } from 'react';
import type { BaseProps, Key } from '../../core/props.js';
import { type AvatarIdentity } from '../avatar/avatar.js';
/** Where one approver's decision stands. */
export type ApprovalPanelDecision = 'pending' | 'approved' | 'rejected' | 'abstained';
/** Where the whole approval stands: approved once enough approve, rejected by any rejection. */
export type ApprovalPanelOutcome = 'pending' | 'approved' | 'rejected';
/** A person or a group whose decision is asked. */
export interface ApprovalPanelApprover {
    /** Identifies the approver. */
    id: Key;
    /** Who decides: a person, or a group with `kind: 'group'`. */
    person: AvatarIdentity;
    decision: ApprovalPanelDecision;
    /** When they decided: an ISO 8601 date or date and time. */
    time?: string | null | undefined;
    /** What they said with their decision. */
    comment?: ReactNode;
}
export interface ApprovalPanelProps extends BaseProps {
    /** The approvers, in the order they show. */
    approvers: readonly ApprovalPanelApprover[];
    /** The approvals needed. Defaults to every approver. */
    requiredCount?: number | undefined;
    /** The heading, which names the panel. Defaults to the provider's `approvals` string. */
    title?: ReactNode;
    /** The reader's own approver: marked as `You`. */
    currentApproverId?: Key | undefined;
    /** Draws a Remind button on each pending approver's row that calls this with their id. */
    onRemind?: ((id: Key) => void) | undefined;
    /** Draws a Request again button on each decided approver's row that calls this with their id. */
    onRequestAgain?: ((id: Key) => void) | undefined;
    /** The clock decision times are read against. Defaults to the current time. */
    getNow?: (() => Date) | undefined;
    /** The reader's own decision, such as a `DecisionControl`, under the approvers. */
    children?: ReactNode;
    /** The root `<section>`. */
    ref?: Ref<HTMLElement> | undefined;
}
/**
 * Who must decide on something and where each decision stands: a heading with the outcome, the
 * approvals given against those needed over a bar of every decision, one row per approver with
 * their decision, time and comment, Remind and Request again actions, and the reader's own
 * decision under them.
 */
export declare function ApprovalPanel({ approvers, requiredCount, title, currentApproverId, onRemind, onRequestAgain, getNow, children, className, ...rest }: ApprovalPanelProps): import("react").JSX.Element;
//# sourceMappingURL=approval-panel.d.ts.map