// The commands each message offers, from the callbacks the chat was given.
import { isOwnText, readMessageText } from './chat-model.js';
/** Whether the reader already reacts to the message with `emoji`. */
function isReactedWith(message, emoji) {
    return Boolean(message.reactions?.some((entry) => entry.emoji === emoji && entry.isReacted));
}
/** Copy, once the message has text and has finished, and the ratings of an assistant's reply. */
function toReplyCommands(message, context) {
    const { copy, feedback } = context.handlers;
    const id = message.id;
    if ((message.status ?? 'complete') !== 'complete')
        return {};
    const text = readMessageText(message);
    const isAssistant = context.participants.get(message.authorId ?? '')?.kind === 'assistant';
    const canRate = feedback !== undefined && isAssistant;
    return {
        ...(copy && text ? { copyText: text, onCopy: () => copy(id) } : {}),
        ...(canRate
            ? {
                feedback: message.feedback,
                feedbackReasons: context.feedbackReasons,
                onFeedback: (rating) => feedback(id, rating),
            }
            : {}),
    };
}
/** Reply and React on any message, Edit and Delete on the reader's own: in chats between people. */
function toPeopleCommands(message, context) {
    const { reply, react, edit, delete: remove } = context.handlers;
    const id = message.id;
    const isOwn = message.authorId === context.currentUserId;
    const canEdit = edit !== undefined && isOwnText(message, context.currentUserId);
    return {
        ...(reply ? { onReply: () => reply(id) } : {}),
        ...(react
            ? { onReact: (emoji) => react(id, emoji, !isReactedWith(message, emoji)) }
            : {}),
        ...(canEdit ? { onEdit: () => edit(id) } : {}),
        ...(remove && isOwn ? { onDelete: () => remove(id) } : {}),
    };
}
/** Reply, quoting a finished message that has text: in chats with an assistant. */
function toQuoteCommands(message, context) {
    const { reply } = context.handlers;
    const isFinished = (message.status ?? 'complete') === 'complete';
    if (!reply || !isFinished || !readMessageText(message))
        return {};
    return { onReply: () => reply(message.id) };
}
/**
 * The commands a message offers: none for a deleted message or a notice; Copy and the ratings once
 * a reply has finished; in chats without an assistant, Reply, React, and Edit and Delete on the
 * reader's own messages; and in chats with one, Reply on finished messages that have text.
 */
export function toMessageCommands(message, context) {
    if (message.isDeleted || !message.authorId)
        return {};
    return {
        ...toReplyCommands(message, context),
        ...(context.isAssistantChat
            ? toQuoteCommands(message, context)
            : toPeopleCommands(message, context)),
    };
}
//# sourceMappingURL=chat-commands.js.map