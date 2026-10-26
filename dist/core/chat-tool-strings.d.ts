/** Strings of a chat's tool calls and their approvals. */
export interface ChatToolStrings {
    /** A tool call's status, shown beside its label. */
    toolCallStatus: (status: 'pending' | 'running' | 'approval-requested' | 'succeeded' | 'failed' | 'denied' | 'cancelled') => string;
    /** How long a tool call ran: `short` beside its label, `long` for assistive technology. */
    toolCallDuration: (milliseconds: number, style: 'short' | 'long') => string;
    /** Marks a tool call that ran without asking because it was always allowed. */
    toolCallAutoApproved: string;
    /** Titles a tool call's arguments. */
    toolCallArguments: string;
    /** Titles a tool call's result. */
    toolCallResult: string;
    /** Names the button that copies a tool call's arguments or result, from that part's title. */
    copyToolCallPart: (part: string) => string;
    /** Shown in an expanded tool call that has neither arguments nor a result. */
    toolCallNoDetails: string;
    /** Asks the reader to let a tool run, from the tool call's label. */
    toolCallApprovalPrompt: (label: string) => string;
    /** Refuses to let a tool run. */
    toolCallDeny: string;
    /** Lets a tool run now and from then on, within the scope the host names (`this conversation`). */
    toolCallAlwaysAllow: (scope: string | undefined) => string;
    /** Names the optional reason field that Deny opens. */
    toolCallDenyReason: string;
    /** The decision on a resolved approval, with the reader's reason for a denial. */
    toolCallDecision: (decision: 'approved' | 'denied' | 'always', reason: string | undefined) => string;
}
export declare const chatToolStrings: ChatToolStrings;
//# sourceMappingURL=chat-tool-strings.d.ts.map