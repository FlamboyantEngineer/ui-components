import type { ToolCallApprovalState } from './use-tool-call-approval.js';
/** The reader's decision on an approval: approved once, denied, or always allowed. */
export type ChatToolCallDecision = 'approved' | 'denied' | 'always';
/** How a tool call was, or is to be, approved. */
export interface ChatToolCallApproval {
    /** Names the scope of Always allow, such as `this conversation`. */
    scopeLabel?: string | undefined;
    /** The reader's decision, once made. */
    decision?: ChatToolCallDecision | undefined;
    /** The reader's reason for a denial. */
    reason?: string | undefined;
    /** The call ran without asking because it was always allowed. */
    isAutoApproved?: boolean | undefined;
}
export interface ToolCallApprovalProps {
    /** The tool call's label, which the request names. */
    label: string;
    approval: ChatToolCallApproval | undefined;
    /** The call waits for a decision that has not been made. */
    isPending: boolean;
    state: ToolCallApprovalState;
    onApprove?: (() => void) | undefined;
    onDeny?: ((reason?: string) => void) | undefined;
    onAlwaysAllow?: (() => void) | undefined;
    /** Where focus goes when the approval leaves while it holds focus. */
    getFallbackFocus: () => HTMLElement | null;
}
/**
 * The approval: while pending, the request and its buttons (or the deny reason form); once
 * resolved, the decision in a status. Resolved buttons stay, `aria-disabled`, while focus is on
 * them, and focus moves to the fallback when the approval leaves while holding it.
 */
export declare function ToolCallApproval({ label, getFallbackFocus, ...props }: ToolCallApprovalProps): import("react").JSX.Element;
//# sourceMappingURL=tool-call-approval.d.ts.map