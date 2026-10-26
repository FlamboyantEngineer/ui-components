// Folds the consecutive reasoning and tool calls of a message into groups of steps, and reads
// how a group stands (specs/CHAT-PARTS.md, UIC-CHAT-PARTS-5).
export function isStepPart(part) {
    return part.type === 'reasoning' || part.type === 'tool-call';
}
/** A part's React key: its type and id, or its type and position when it has no id. */
export function toPartKey(part, index) {
    return part.id === undefined ? `${part.type}@${index}` : `${part.type}:${part.id}`;
}
/** The key a group of steps is rendered and expanded under. */
export function toStepsKey(first) {
    return `steps:${first.id}`;
}
/**
 * The parts to render in order. A run of consecutive steps becomes one group when it holds two or
 * more steps, or one step that further parts follow; a single step that ends the message stays alone.
 */
export function groupChatParts(parts) {
    const items = [];
    let start = 0;
    while (start < parts.length) {
        let end = start;
        while (end < parts.length && isStepPart(parts[end]))
            end += 1;
        const steps = parts.slice(start, end);
        const [first] = steps;
        if (first && (steps.length > 1 || end < parts.length)) {
            items.push({ kind: 'steps', key: toStepsKey(first), steps });
        }
        else if (first) {
            items.push({ kind: 'part', key: toPartKey(first, start), part: first });
        }
        const next = parts[end];
        if (next)
            items.push({ kind: 'part', key: toPartKey(next, end), part: next });
        start = end + 1;
    }
    return items;
}
/** The sum of the steps' durations, or `undefined` when none has one. */
export function sumStepDurations(steps) {
    const durations = steps.flatMap((step) => step.durationMs === undefined ? [] : [step.durationMs]);
    return durations.length === 0 ? undefined : durations.reduce((sum, ms) => sum + ms, 0);
}
/** A step still at work: reasoning that streams, or a tool call that waits to run or runs. */
export function isStepActive(step) {
    if (step.type === 'reasoning')
        return step.status === 'streaming';
    return step.status === 'pending' || step.status === 'running';
}
/** A tool call that waits for the reader's approval. */
export function isAwaitingApproval(step) {
    return (step.type === 'tool-call' &&
        step.status === 'approval-requested' &&
        step.approval?.decision === undefined);
}
/** A tool call that failed. */
export function isFailedCall(step) {
    return step.type === 'tool-call' && step.status === 'failed';
}
//# sourceMappingURL=chat-parts-grouping.js.map