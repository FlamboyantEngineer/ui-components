import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { ChatDateSeparator, ChatTranscript, ChatTypingIndicator, ChatUnreadDivider, groupChatMessages, } from '../chat-transcript/chat-transcript.js';
import { TextMatchProvider } from '../text-match/text-match.js';
import { ChatComposer } from './chat-composer.js';
import { ChatHeader } from './chat-header.js';
import { chatHooks as hooks } from './chat-hooks.js';
import { useMessageDisplay } from './chat-message-display.js';
import { ChatMessageView } from './chat-message-view.js';
import { findStatusText, hasAssistant, indexParticipants, listReaders, listTypingNames, } from './chat-model.js';
import { ChatSearchBar, ChatSearchToggle, useChatSearch } from './chat-search.js';
import { useChatState } from './use-chat-state.js';
import { useMessageContext } from './use-message-context.js';
export { ChatHeader } from './chat-header.js';
/** The transcript's children: date separators, the unread divider and the messages. */
function useSequence({ props, context, display, }, expanded) {
    const { messages, firstUnreadId, readPositions, currentUserId } = props;
    const { participants } = context;
    const items = useMemo(() => groupChatMessages(messages, { firstUnreadId }), [messages, firstUnreadId]);
    const byId = useMemo(() => new Map(messages.map((message) => [message.id, message])), [messages]);
    const readers = useMemo(() => listReaders(readPositions, participants, currentUserId), [readPositions, participants, currentUserId]);
    return items.map((item) => {
        if (item.kind === 'date') {
            return _jsx(ChatDateSeparator, { date: item.date, getNow: context.getNow }, item.key);
        }
        if (item.kind === 'unread')
            return _jsx(ChatUnreadDivider, {}, item.key);
        const { message } = item;
        return (_jsx(ChatMessageView, { message: message, groupPosition: item.groupPosition, quoted: message.replyTo === undefined ? undefined : byId.get(message.replyTo), readers: readers.get(message.id), expandedParts: expanded[message.id], context: context, display: display }, item.key));
    });
}
/** Who is typing, below the transcript. */
function ChatTyping({ props, participants }) {
    return (_jsx(ChatTypingIndicator, { className: hooks.slotClass('typing'), names: listTypingNames(props.typingIds, participants, props.currentUserId) }));
}
/** The header's line: who is typing, else what the assistant is doing. */
function useHeaderStatus({ props, participants }) {
    const strings = useUiStrings();
    const typing = listTypingNames(props.typingIds, participants, props.currentUserId);
    return typing.length > 0 ? strings.chatTyping(typing) : findStatusText(props.messages);
}
/**
 * A whole conversation from the host's messages and callbacks: an optional header with the
 * participants, search and the host's controls; the transcript with date separators, grouping, the
 * unread divider, read receipts and each message's parts and commands, and in a reply that streams
 * what the assistant is thinking or doing; who is typing; the queue of follow-ups; and the rich
 * composer, with an optional model picker among its tools. It serves assistant chats (streaming, tool calls, approvals, questions)
 * and chats between people alike, and holds no conversation state of its own: spread a
 * `useChatController`'s `props` into it, or pass your own.
 */
export function Chat(props) {
    const { messages, participants: list, currentUserId, className, id } = props;
    const participants = useMemo(() => indexParticipants(list), [list]);
    const isAssistantChat = useMemo(() => hasAssistant(list), [list]);
    const state = useChatState(props.conversationId);
    const search = useChatSearch(messages);
    const context = useMessageContext(props, state, { participants, isAssistantChat });
    const display = useMessageDisplay(props);
    const sequence = useSequence({ props, context, display }, state.expanded);
    const headerStatus = useHeaderStatus({ props, participants });
    const showHeader = Boolean(props.title || props.headerActions || props.showSearch);
    const others = list.filter((participant) => participant.id !== currentUserId);
    const { 'aria-label': ariaLabel, 'aria-labelledby': labelledBy, 'aria-describedby': describedBy, 'aria-details': details, } = props;
    return (_jsxs("div", { id: id, ...hooks.root({ className, props }), children: [showHeader ? (_jsx(ChatHeader, { title: props.title ?? '', participants: others, status: headerStatus, actions: _jsxs(_Fragment, { children: [props.showSearch ? _jsx(ChatSearchToggle, { search: search }) : null, props.headerActions] }) })) : null, _jsx(ChatSearchBar, { search: search }), _jsx(TextMatchProvider, { query: search.query, ignoreAccents: true, children: _jsx(ChatTranscript, { className: hooks.slotClass('transcript'), "aria-label": ariaLabel ?? (labelledBy ? undefined : props.title || undefined), "aria-labelledby": labelledBy, "aria-describedby": describedBy, "aria-details": details, emptyState: props.emptyState, scrollMode: props.scrollMode ?? (isAssistantChat ? 'anchor' : 'follow'), onEscape: props.onSend ? () => state.composerRef.current?.focus() : undefined, onLoadOlder: props.onLoadOlder, hasOlder: props.hasOlder, isLoadingOlder: props.isLoadingOlder, highlightedMessageId: search.highlightedId ?? state.jumpedId, firstUnreadId: props.firstUnreadId, onRead: props.onRead, virtualized: props.virtualized, children: sequence }) }), _jsx(ChatTyping, { props: props, participants: participants }), _jsx(ChatComposer, { options: props, state: state, messages: messages, participants: participants, currentUserId: currentUserId, isAssistantChat: isAssistantChat })] }));
}
//# sourceMappingURL=chat.js.map