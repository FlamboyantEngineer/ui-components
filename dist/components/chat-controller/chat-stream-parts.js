// Pure operations on a reply's parts: adding, updating and settling them.
/**
 * Completes the streaming text and reasoning parts, except those `keep` matches, so a new part
 * starts after them. Unchanged parts keep their identity.
 */
export function closeOpenParts(parts, context, keep) {
    return parts.map((part) => {
        if (part.type !== 'text' && part.type !== 'reasoning')
            return part;
        if (part.status !== 'streaming' || keep?.(part))
            return part;
        if (part.type === 'text')
            return { ...part, status: 'complete' };
        return {
            ...part,
            status: 'complete',
            durationMs: part.durationMs ?? context.getElapsed?.(part.id),
        };
    });
}
/** Applies `update` to the part of `type` with `id`; other parts keep their identity. */
export function updatePart(parts, target, update) {
    return parts.map((part) => part.type === target.type && part.id === target.id ? update(part) : part);
}
/**
 * Closes the open parts and adds `part` at the end, or, when a part of its type has its `id`,
 * merges it into that part in place, keeping that part's status and leaving the open parts open.
 */
export function addPart(parts, part, context) {
    const index = part.id === undefined
        ? -1
        : parts.findIndex((entry) => entry.type === part.type && entry.id === part.id);
    const existing = parts[index];
    if (!existing)
        return [...closeOpenParts(parts, context), part];
    const merged = { ...existing, ...part };
    if ('status' in existing)
        Object.assign(merged, { status: existing.status });
    return parts.map((entry, position) => (position === index ? merged : entry));
}
/** Replaces the item with the new one's `id`, or adds it at the end. */
function upsertById(items, item) {
    return items.some((entry) => entry.id === item.id)
        ? items.map((entry) => (entry.id === item.id ? item : entry))
        : [...items, item];
}
/** Adds a source to the reply's sources part, which starts where the first source arrives. */
export function appendSource(parts, source) {
    if (!parts.some((part) => part.type === 'sources')) {
        return [...parts, { type: 'sources', sources: [source] }];
    }
    return parts.map((part) => part.type === 'sources' ? { ...part, sources: upsertById(part.sources, source) } : part);
}
/** Adds a file to the files part just before it, or starts a files part. */
export function appendFile(parts, attachment) {
    const last = parts.at(-1);
    if (last?.type !== 'files')
        return [...parts, { type: 'files', attachments: [attachment] }];
    return [
        ...parts.slice(0, -1),
        { ...last, attachments: upsertById(last.attachments, attachment) },
    ];
}
/** The part once its reply ended: nothing streams or runs any more. */
function settlePart(part, outcome) {
    const isCut = outcome.status !== 'complete';
    if (part.type === 'tool-call') {
        const isWaiting = part.status === 'approval-requested' && part.approval?.decision === undefined;
        const isUnfinished = part.status === 'pending' || part.status === 'running';
        return isUnfinished || (isCut && isWaiting) ? { ...part, status: 'cancelled' } : part;
    }
    if (part.type === 'question' && isCut && part.status === 'pending') {
        return { ...part, status: 'dismissed' };
    }
    return part;
}
/**
 * The reply once it ended: streaming parts complete, unfinished tool calls cancelled, its status
 * line cleared. A complete reply keeps the approvals and questions that wait for the reader; a
 * stopped or failed one cancels them.
 */
export function endChatReply(message, outcome, context) {
    const { statusText: _statusText, error: _error, ...rest } = message;
    const parts = closeOpenParts(message.parts, context).map((part) => settlePart(part, outcome));
    return outcome.status === 'error'
        ? { ...rest, parts, status: 'error', error: outcome.error }
        : { ...rest, parts, status: outcome.status };
}
//# sourceMappingURL=chat-stream-parts.js.map