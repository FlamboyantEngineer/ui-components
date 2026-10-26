import { type KeyboardEvent, type RefObject } from 'react';
export interface ToolCallApprovalOptions {
    /** The call waits for the reader's decision. */
    isPending: boolean;
    onApprove?: (() => void) | undefined;
    onDeny?: ((reason?: string) => void) | undefined;
}
/** A pending approval's state: the deny reason form and the keys that drive it. */
export interface ToolCallApprovalState {
    /** The deny reason form shows in place of the buttons. */
    isDenying: boolean;
    /** The reason typed so far. */
    reason: string;
    setReason: (reason: string) => void;
    /** The Deny button, which Escape focuses and the closed form returns focus to. */
    denyRef: RefObject<HTMLButtonElement | null>;
    /** Deny: opens the reason form. */
    openDenyForm: () => void;
    /** Cancel: closes the form and returns focus to Deny. */
    closeDenyForm: () => void;
    /** Send: closes the form and reports the trimmed reason, or none for a blank one. */
    sendDenial: () => void;
    /** The card's capture-phase key handler. */
    onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
}
/**
 * The approval's state and keys. While the call waits for a decision and focus is in the card,
 * Ctrl+Enter or Cmd+Enter approves (or sends the denial while its form is open) and Escape
 * focuses Deny (or cancels the open form). The keys are caught before the focused control sees
 * them, so a focused button is not pressed too; Escape on Deny itself goes on to the page.
 */
export declare function useToolCallApproval({ isPending, onApprove, onDeny, }: ToolCallApprovalOptions): ToolCallApprovalState;
//# sourceMappingURL=use-tool-call-approval.d.ts.map