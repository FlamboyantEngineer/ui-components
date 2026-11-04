import { defineStrings, toSelectKey } from '../message-format.js';
/** Strings of a chat's tool calls and their approvals. */
interface ChatToolStrings {
  /** A tool call's status, shown beside its label. */
  toolCallStatus: (
    status:
      | 'pending'
      | 'running'
      | 'approval-requested'
      | 'succeeded'
      | 'failed'
      | 'denied'
      | 'cancelled',
  ) => string;
  /** How long a tool call ran: `short` beside its label, `long` for assistive technology. */
  toolCallDuration: (milliseconds: number, style: 'short' | 'long') => string;
  /** Marks a tool call that ran without asking because it was always allowed. */
  toolCallAutoApproved: string;
  /** Titles a tool call's arguments. */
  toolCallArguments: string;
  /** Titles a tool call's result. */
  toolCallResult: string;
  /** Names the button that copies a tool call's arguments or result. */
  copyToolCallPart: (part: 'arguments' | 'result') => string;
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
  toolCallDecision: (
    decision: 'approved' | 'denied' | 'always',
    reason: string | undefined,
  ) => string;
}

/**
 * A duration in whole milliseconds under a second, in seconds with one decimal under a minute, and
 * else in whole minutes and seconds.
 */
function toDurationParts(milliseconds: number) {
  const rounded = Math.max(0, Math.round(milliseconds));
  if (rounded < 1000) return { unit: 'ms', milliseconds: rounded, seconds: 0, minutes: 0 };
  // The unit comes from the value as shown, so 59.95 s reads as 1 min, never 60 s.
  const tenths = Math.round(rounded / 100);
  if (tenths < 600)
    return { unit: 'seconds', milliseconds: rounded, seconds: tenths / 10, minutes: 0 };
  const totalSeconds = Math.round(rounded / 1000);
  return {
    unit: 'minutes',
    milliseconds: rounded,
    seconds: totalSeconds % 60,
    minutes: Math.floor(totalSeconds / 60),
  };
}

/** The module's text, with the message values each text function reads its arguments as. */
export const chatToolStrings = defineStrings<ChatToolStrings>({
  toolCallStatus: (status) => ({ status: toSelectKey(status) }),
  toolCallDuration: (milliseconds, style) => ({ style, ...toDurationParts(milliseconds) }),
  copyToolCallPart: (part) => ({ part }),
  toolCallApprovalPrompt: (label) => ({ label }),
  toolCallAlwaysAllow: (scope) => ({ scope, hasScope: Boolean(scope) }),
  toolCallDecision: (decision, reason) => ({ decision, reason, hasReason: Boolean(reason) }),
});
