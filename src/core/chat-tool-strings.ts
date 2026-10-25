/** Strings of a chat's tool calls and their approvals. */
export interface ChatToolStrings {
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
  toolCallDecision: (
    decision: 'approved' | 'denied' | 'always',
    reason: string | undefined,
  ) => string;
}

const statusNames = {
  pending: 'Pending',
  running: 'Running',
  'approval-requested': 'Needs approval',
  succeeded: 'Done',
  failed: 'Failed',
  denied: 'Denied',
  cancelled: 'Cancelled',
} as const;

/** A count with its unit, singular for one. */
function formatUnit(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

/** Seconds with at most one decimal, without a trailing `.0`. */
function formatSeconds(milliseconds: number): string {
  return (milliseconds / 1000).toFixed(1).replace(/\.0$/, '');
}

function formatDuration(milliseconds: number, style: 'short' | 'long'): string {
  const short = style === 'short';
  const rounded = Math.max(0, Math.round(milliseconds));
  if (rounded < 1000) return short ? `${rounded} ms` : formatUnit(rounded, 'millisecond');
  if (rounded < 60_000) {
    const seconds = formatSeconds(rounded);
    return short ? `${seconds} s` : `${seconds} second${seconds === '1' ? '' : 's'}`;
  }
  const minutes = Math.floor(rounded / 60_000);
  const seconds = Math.round((rounded % 60_000) / 1000);
  if (short) return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds} s`;
  const spoken = formatUnit(minutes, 'minute');
  return seconds === 0 ? spoken : `${spoken} ${formatUnit(seconds, 'second')}`;
}

const decisionNames = { approved: 'Approved', denied: 'Denied', always: 'Always allowed' } as const;

export const chatToolStrings: ChatToolStrings = {
  toolCallStatus: (status) => statusNames[status],
  toolCallDuration: formatDuration,
  toolCallAutoApproved: 'Auto-approved',
  toolCallArguments: 'Arguments',
  toolCallResult: 'Result',
  copyToolCallPart: (part) => `Copy ${part.toLowerCase()}`,
  toolCallNoDetails: 'No details',
  toolCallApprovalPrompt: (label) => `Allow “${label}”?`,
  toolCallDeny: 'Deny',
  toolCallAlwaysAllow: (scope) => (scope ? `Always allow in ${scope}` : 'Always allow'),
  toolCallDenyReason: 'Reason (optional)',
  toolCallDecision: (decision, reason) =>
    decision === 'denied' && reason ? `Denied: ${reason}` : decisionNames[decision],
};
