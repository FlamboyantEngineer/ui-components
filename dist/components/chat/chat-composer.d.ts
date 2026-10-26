import { type ReactNode } from 'react';
import { type ChatAttachmentData } from '../chat-attachment/chat-attachment.js';
import type { ChatQueuedMessage } from '../chat-controller/chat-controller.js';
import { type ChatModelPickerProps } from '../chat-model-picker/chat-model-picker.js';
import type { ChatMessageData, ChatTextToken } from '../chat-parts/chat-parts.js';
import { type RichMessageComposerProps } from '../message-composer/rich/rich-message-composer.js';
import { type ChatDraftOptions } from './chat-composer-handle.js';
import { type ChatParticipantIndex } from './chat-model.js';
import type { ChatState } from './use-chat-state.js';
/**
 * Sends a text with its mentions and commands about a message: an edit or a reply. A returned
 * promise holds the composer's message until it settles, as `onSend` does.
 */
export type ChatMessageTextHandler = (messageId: string, text: string, tokens: readonly ChatTextToken[]) => void | Promise<unknown>;
/** The chat props the composer reads. */
export interface ChatComposerOptions extends ChatDraftOptions, Pick<RichMessageComposerProps, 'isPending' | 'onStop' | 'isDisabled' | 'placeholder' | 'commands' | 'history' | 'onAttach' | 'submitShortcut' | 'minRows' | 'maxRows' | 'getReference'> {
    /**
     * Sends the reader's message with its mentions and commands. Without it there is no composer. A
     * returned promise holds the message, its tokens and the quote until it settles: they clear once
     * it resolves, and stay for another try when it rejects.
     */
    onSend?: ((text: string, tokens?: readonly ChatTextToken[]) => void | Promise<unknown>) | undefined;
    /** Called when `onSend`, `onReply` or `onEdit` throws or its promise rejects; the composer keeps the message. Without it the error is rethrown. */
    onSendError?: ((error: unknown) => void) | undefined;
    /** Sends a blank message too, as when context the host adds carries the request; a complete attachment allows it as well. */
    allowsEmptySubmit?: boolean | undefined;
    /** The host's controls among the composer's tools, before the model picker. */
    composerToolbar?: ReactNode;
    /** The composer's "+" menu, first among its tools in place of the attach button; disabled with it. */
    composerMenu?: RichMessageComposerProps['menu'];
    /** Names the conversation, so the composer keeps its draft in the provider's storage. */
    conversationId?: string | undefined;
    /** Messages waiting for the running reply to end, shown above the composer. */
    queue?: readonly ChatQueuedMessage[] | undefined;
    /** Replaces the queue when the reader edits or removes a queued message; lets them send while a reply runs. */
    onQueueChange?: ((queue: readonly ChatQueuedMessage[]) => void) | undefined;
    /** The files attached to the next message. */
    attachments?: readonly ChatAttachmentData[] | undefined;
    /** Removes a file from the next message. */
    onRemoveAttachment?: ((id: string) => void) | undefined;
    /** Uploads a failed file of the next message again. */
    onRetryAttachment?: ((id: string) => void) | undefined;
    /** Saves the reader's edit of their message; offers Edit on their messages in chats between people. */
    onEdit?: ChatMessageTextHandler | undefined;
    /** Sends a reply quoting a message; offers Reply on every message between people, and on finished messages with text in an assistant chat. */
    onReply?: ChatMessageTextHandler | undefined;
    /** Shows a model and effort picker among the composer's tools, disabled with the composer. */
    modelPicker?: ChatModelPickerProps | undefined;
}
export interface ChatComposerProps {
    options: ChatComposerOptions;
    state: ChatState;
    messages: readonly ChatMessageData[];
    participants: ChatParticipantIndex;
    currentUserId: string;
    isAssistantChat: boolean;
}
/**
 * The queue of follow-ups, then the rich composer: mentions of the other participants, the host's
 * commands, a per-conversation draft, Up to edit the reader's last message (between people) or to
 * recall earlier prompts (with an assistant), the reply and edit banners, attachments, the "+"
 * menu, the host's tools, the model picker, and Stop.
 */
export declare function ChatComposer(props: ChatComposerProps): import("react").JSX.Element | null;
//# sourceMappingURL=chat-composer.d.ts.map