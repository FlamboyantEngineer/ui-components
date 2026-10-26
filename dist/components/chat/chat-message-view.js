import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { ChatStatusLine } from '../chat-activity/chat-activity.js';
import { ChatMessageActionsMenu } from '../chat-message-actions/chat-message-actions.js';
import { ChatParts } from '../chat-parts/chat-parts.js';
import { ChatMessage, ChatReadReceipts, } from '../chat-transcript/chat-transcript.js';
import { ReactionBar } from '../reaction-bar/reaction-bar.js';
import { toMessageCommands } from './chat-commands.js';
import { chatHooks as hooks } from './chat-hooks.js';
import { toMessageVariant } from './chat-message-display.js';
import { readMessageText, toDisplayStatus, toExcerpt, toMessageAuthor, toMessageOrigin, toThinkingActivity, } from './chat-model.js';
/** The quote of the message replied to: its author and the start of its text. */
function useQuote(quoted, context) {
    const strings = useUiStrings();
    if (!quoted)
        return undefined;
    const author = context.participants.get(quoted.authorId ?? '');
    const excerpt = quoted.isDeleted
        ? strings.chatMessageDeleted
        : toExcerpt(readMessageText(quoted));
    return { authorName: author?.name ?? '', excerpt, messageId: quoted.id };
}
/** The reactions, which the reader toggles in chats between people. */
function MessageReactions({ message, context }) {
    const { react } = context.handlers;
    const canReact = react !== undefined && !context.isAssistantChat;
    return (_jsx(ReactionBar, { reactions: message.reactions ?? [], onToggle: canReact ? (emoji, isReacted) => react(message.id, emoji, isReacted) : undefined }));
}
/** What the assistant is thinking or doing in its reply that streams, while it does. */
function ThinkingLine({ message, context }) {
    const activity = toThinkingActivity(message, context.thinkingUntil);
    if (!activity)
        return null;
    return (_jsx(ChatStatusLine, { className: hooks.slotClass('status'), text: message.statusText || context.thinkingText, icon: context.thinkingIcon, activity: activity }));
}
/**
 * One message of a chat: its author, time, status, delivery and quote, its parts, reactions and
 * readers, and the commands the chat offers for it in an action bar and a context menu.
 */
export const ChatMessageView = memo(function ChatMessageView({ message, groupPosition, quoted, readers, expandedParts, context, display, }) {
    const participant = context.participants.get(message.authorId ?? '');
    const quote = useQuote(quoted, context);
    const { onRetry } = context;
    const canRetry = message.status === 'error' || message.delivery === 'failed';
    const id = message.id;
    const origin = toMessageOrigin(message, context.currentUserId);
    return (_jsx(ChatMessageActionsMenu, { ...toMessageCommands(message, context), children: (actions) => (_jsxs(ChatMessage, { id: id, origin: origin, author: participant ? toMessageAuthor(participant) : undefined, showAvatar: display.showAvatars, showAuthorName: display.showAuthorNames, showTime: display.showTimes, variant: toMessageVariant(origin, display), time: message.createdAt, getNow: context.getNow, status: toDisplayStatus(message), groupPosition: groupPosition, delivery: message.delivery, error: message.error, onRetry: onRetry && canRetry ? () => onRetry(id) : undefined, isEdited: message.isEdited, isDeleted: message.isDeleted, quote: quote, onQuotePress: context.onQuotePress, reactions: message.reactions?.length ? (_jsx(MessageReactions, { message: message, context: context })) : undefined, readers: readers?.length ? _jsx(ChatReadReceipts, { readers: readers }) : undefined, actions: actions, children: [_jsx(ChatParts
                // A card's drafts and requests belong to one conversation, even where ids repeat.
                , { ...context.parts, parts: message.parts, messageId: id, isStreaming: message.status === 'streaming', expandedParts: expandedParts, onExpandedPartsChange: (expanded) => context.onExpandedPartsChange(id, expanded) }, context.conversationId), participant?.kind === 'assistant' ? (_jsx(ThinkingLine, { message: message, context: context })) : null] })) }));
});
//# sourceMappingURL=chat-message-view.js.map