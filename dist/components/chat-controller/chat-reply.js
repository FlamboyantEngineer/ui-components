// Pure operations on the conversation for the reader's side: their messages, prompts and responses.
/**
 * Whether the part waits for the reader: an undecided approval request or a pending question. A
 * running reply that holds one is not busy for assistive technology, so its card stays readable.
 */
export function isAwaitingReader(part) {
    if (part.type === 'question')
        return part.status === 'pending';
    return (part.type === 'tool-call' &&
        part.status === 'approval-requested' &&
        part.approval?.decision === undefined);
}
/** The index of the last message holding the part `id` that waits for the reader, or -1. */
export function findAwaitingMessage(messages, id) {
    return messages.findLastIndex((message) => message.parts.some((part) => part.id === id && isAwaitingReader(part)));
}
/** The response that dismisses a part waiting for the reader: a denial, or a dismissed card. */
export function toDismissal(part) {
    return part.type === 'question'
        ? { type: 'question', status: 'dismissed', answers: [] }
        : { type: 'approval', decision: 'denied' };
}
/** The part with the reader's response recorded, when the response fits it. */
function recordOnPart(part, response) {
    if (response.type === 'question') {
        if (part.type !== 'question')
            return part;
        return response.status === 'answered'
            ? { ...part, status: 'answered', answers: response.answers }
            : { ...part, status: 'dismissed' };
    }
    if (part.type !== 'tool-call')
        return part;
    const { decision, reason } = response;
    return {
        ...part,
        status: decision === 'denied' ? 'denied' : 'running',
        approval: { ...part.approval, decision, ...(reason === undefined ? {} : { reason }) },
    };
}
/**
 * The message with the reader's response recorded on its part `id` while that part waits for
 * them: an approved or always-allowed call runs, a denied one is denied, a question is answered
 * or dismissed.
 */
export function recordResponse(message, id, response) {
    return {
        ...message,
        parts: message.parts.map((part) => part.id === id && isAwaitingReader(part) ? recordOnPart(part, response) : part),
    };
}
/** The reader's message: the files it carries, then its text with the mentions and commands. */
export function createOutgoingMessage(outgoing, author) {
    const { id, text, tokens, attachments } = outgoing;
    const parts = [];
    if (attachments?.length)
        parts.push({ type: 'files', attachments });
    if (text)
        parts.push(tokens?.length ? { type: 'text', text, tokens } : { type: 'text', text });
    return { id, ...author, parts };
}
/** The text of every message the reader wrote, oldest first, for the composer's recall. */
export function listPrompts(messages, currentUserId) {
    return messages
        .filter((message) => message.authorId === currentUserId && !message.isDeleted)
        .map((message) => message.parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])).join('\n\n'))
        .filter(Boolean);
}
//# sourceMappingURL=chat-reply.js.map