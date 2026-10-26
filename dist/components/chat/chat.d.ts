import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import type { ChatMessageData, ChatParticipant } from '../chat-parts/chat-parts.js';
import { type ChatTranscriptProps, type ChatTranscriptScrollMode } from '../chat-transcript/chat-transcript.js';
import { type ChatComposerOptions } from './chat-composer.js';
import { type ChatMessageDisplayOptions } from './chat-message-display.js';
import { type ChatMessageOptions } from './use-message-context.js';
export { ChatHeader } from './chat-header.js';
export type { ChatHeaderProps } from './chat-header.js';
export type { ChatMessageTextHandler } from './chat-composer.js';
export type { ChatComposerHandle, ChatComposerInsertOptions, ChatComposerInsertResult, ChatDraft, } from './chat-composer-handle.js';
export type { ChatThinkingUntil } from './chat-model.js';
export interface ChatProps extends BaseProps, AriaLabellingProps, ChatComposerOptions, ChatMessageOptions, ChatMessageDisplayOptions, Pick<ChatTranscriptProps, 'emptyState' | 'virtualized' | 'onLoadOlder' | 'hasOlder' | 'isLoadingOlder' | 'firstUnreadId' | 'onRead'> {
    /** The conversation, oldest first. */
    messages: readonly ChatMessageData[];
    /** Everyone who takes part, the reader included. An assistant among them makes an assistant chat. */
    participants: readonly ChatParticipant[];
    /** `anchor` keeps the reader's sent message at the top while the reply fills in below; `follow` keeps the latest in view. Defaults to `anchor` in an assistant chat, else `follow`. */
    scrollMode?: ChatTranscriptScrollMode | undefined;
    /** The message each participant has read up to, by participant id; their avatars show under it. */
    readPositions?: Readonly<Record<string, string>> | undefined;
    /** The participants typing now. */
    typingIds?: readonly string[] | undefined;
    /** The conversation's name; shows the header. */
    title?: string | undefined;
    /** Controls at the end of the header, such as the conversation's commands; shows the header. */
    headerActions?: ReactNode;
    /** Offers the search within the conversation in the header; shows the header. */
    showSearch?: boolean | undefined;
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
export declare function Chat(props: ChatProps): import("react").JSX.Element;
//# sourceMappingURL=chat.d.ts.map