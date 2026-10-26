// Sending the composer's message as the chat's edit, queued text, reply or new message
// (specs/CHAT.md, UIC-CHAT-3.7).
import { isThenable } from '../../utils/is-thenable.js';
import { toDisplayTokens } from './chat-model.js';
/** Runs `onAccepted` once the host accepts: at once, or when its promise resolves. */
function whenAccepted(result, onAccepted) {
    if (isThenable(result))
        return Promise.resolve(result).then(onAccepted);
    onAccepted();
    return undefined;
}
/**
 * Sends the composer's message as an edit, a queued message's new text, a reply or a new message.
 * An edit or a reply ends once the host accepts it, and only in the conversation it was sent from,
 * so a rejection keeps the banner for another try.
 */
export function submitMessage({ options, state }, message) {
    const { editing, replyingId } = state;
    const { text, tokens: composerTokens } = message;
    const tokens = toDisplayTokens(composerTokens);
    const scope = options.conversationId;
    if (editing?.kind === 'message') {
        const result = options.onEdit?.(editing.id, text, tokens);
        return whenAccepted(result, () => state.endEdit(scope, editing));
    }
    if (editing) {
        const queue = options.queue ?? [];
        options.onQueueChange?.(queue.map((entry) => (entry.id === editing.id ? { ...entry, text, tokens } : entry)));
        state.cancelEdit();
        return undefined;
    }
    if (replyingId !== null && options.onReply) {
        const result = options.onReply(replyingId, text, tokens);
        return whenAccepted(result, () => state.endReply(scope, replyingId));
    }
    return options.onSend?.(text, tokens);
}
//# sourceMappingURL=chat-submit.js.map