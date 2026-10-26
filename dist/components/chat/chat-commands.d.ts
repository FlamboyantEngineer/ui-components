import type { ChatFeedback, ChatMessageCommandProps } from '../chat-message-actions/chat-message-actions.js';
import type { ChatMessageData } from '../chat-parts/chat-parts.js';
import { type ChatParticipantIndex } from './chat-model.js';
/**
 * The message commands a chat offers, each bound to a message id and present only when the chat
 * has the callback behind it. Their identities stay the same while that presence does.
 */
export interface ChatCommandHandlers {
    copy?: ((messageId: string) => void) | undefined;
    feedback?: ((messageId: string, feedback: ChatFeedback) => void) | undefined;
    reply?: ((messageId: string) => void) | undefined;
    react?: ((messageId: string, emoji: string, isReacted: boolean) => void) | undefined;
    edit?: ((messageId: string) => void) | undefined;
    delete?: ((messageId: string) => void) | undefined;
}
/** What the commands of a message depend on besides the message. */
export interface ChatCommandContext {
    handlers: ChatCommandHandlers;
    currentUserId: string;
    isAssistantChat: boolean;
    participants: ChatParticipantIndex;
    feedbackReasons: readonly string[] | undefined;
}
/**
 * The commands a message offers: none for a deleted message or a notice; Copy and the ratings once
 * a reply has finished; in chats without an assistant, Reply, React, and Edit and Delete on the
 * reader's own messages; and in chats with one, Reply on finished messages that have text.
 */
export declare function toMessageCommands(message: ChatMessageData, context: ChatCommandContext): ChatMessageCommandProps;
//# sourceMappingURL=chat-commands.d.ts.map