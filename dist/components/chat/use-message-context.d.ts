import { type ReactNode } from 'react';
import type { ChatFeedback } from '../chat-message-actions/chat-message-actions.js';
import type { ChatComposerOptions } from './chat-composer.js';
import type { ChatParticipantIndex, ChatThinkingUntil } from './chat-model.js';
import type { ChatMessageContext, ChatPartOptions } from './chat-message-view.js';
import type { ChatState } from './use-chat-state.js';
/** The chat props every message reads. */
export interface ChatMessageOptions extends ChatPartOptions, Pick<ChatComposerOptions, 'conversationId' | 'onEdit' | 'onReply'> {
    currentUserId: string;
    getNow?: (() => Date) | undefined;
    onRetry?: ((messageId: string) => void) | undefined;
    onCopy?: ((messageId: string) => void) | undefined;
    onFeedback?: ((messageId: string, feedback: ChatFeedback) => void) | undefined;
    feedbackReasons?: readonly string[] | undefined;
    onReact?: ((messageId: string, emoji: string, isReacted: boolean) => void) | undefined;
    onDelete?: ((messageId: string) => void) | undefined;
    /** What a reply that streams says while the assistant thinks, unless it says what it is doing. Defaults to "Thinking…". */
    thinkingText?: string | undefined;
    /** A decorative icon in place of the busy indicator while the assistant thinks. */
    thinkingIcon?: ReactNode;
    /** Until what a reply's thinking line shows: its first `content`, its `text` or its `end`. Defaults to `text`. */
    thinkingUntil?: ChatThinkingUntil | undefined;
}
/**
 * What every message shares, kept while the chat's options stay the same, so a streamed token
 * re-renders the streaming message only.
 */
export declare function useMessageContext(options: ChatMessageOptions, state: ChatState, { participants, isAssistantChat, }: {
    participants: ChatParticipantIndex;
    isAssistantChat: boolean;
}): ChatMessageContext;
//# sourceMappingURL=use-message-context.d.ts.map