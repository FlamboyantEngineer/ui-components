const statusNames = {
    pending: 'Pending',
    running: 'Running',
    'approval-requested': 'Needs approval',
    succeeded: 'Done',
    failed: 'Failed',
    denied: 'Denied',
    cancelled: 'Cancelled',
};
/** A count with its unit, singular for one. */
function formatUnit(count, unit) {
    return `${count} ${unit}${count === 1 ? '' : 's'}`;
}
/** Seconds with at most one decimal, without a trailing `.0`. */
function formatSeconds(milliseconds) {
    return (milliseconds / 1000).toFixed(1).replace(/\.0$/, '');
}
function formatDuration(milliseconds, style) {
    const short = style === 'short';
    const rounded = Math.max(0, Math.round(milliseconds));
    if (rounded < 1000)
        return short ? `${rounded} ms` : formatUnit(rounded, 'millisecond');
    if (rounded < 60_000) {
        const seconds = formatSeconds(rounded);
        return short ? `${seconds} s` : `${seconds} second${seconds === '1' ? '' : 's'}`;
    }
    const minutes = Math.floor(rounded / 60_000);
    const seconds = Math.round((rounded % 60_000) / 1000);
    if (short)
        return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds} s`;
    const spoken = formatUnit(minutes, 'minute');
    return seconds === 0 ? spoken : `${spoken} ${formatUnit(seconds, 'second')}`;
}
const decisionNames = { approved: 'Approved', denied: 'Denied', always: 'Always allowed' };
export const chatToolStrings = {
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
    toolCallDecision: (decision, reason) => decision === 'denied' && reason ? `Denied: ${reason}` : decisionNames[decision],
};
//# sourceMappingURL=chat-tool-strings.js.map