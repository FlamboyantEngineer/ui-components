import { type ReactNode } from 'react';
import { type ChatMessageData, type ChatPartsProps } from '../chat-parts/chat-parts.js';
import { type ChatMessageGroupPosition, type ChatReader } from '../chat-transcript/chat-transcript.js';
import { type ChatCommandContext } from './chat-commands.js';
import { type ChatMessageDisplayOptions } from './chat-message-display.js';
import { type ChatThinkingUntil } from './chat-model.js';
/** The `ChatParts` options a chat passes to every message unchanged. */
export type ChatPartOptions = Pick<ChatPartsProps, 'textFormat' | 'expandsActivity' | 'toolRenderers' | 'onApprove' | 'onDeny' | 'onAlwaysAllow' | 'onAnswerQuestion' | 'onDismissQuestion' | 'questionAnsweredMark' | 'onApplyCode' | 'renderPart' | 'getReference'>;
/** What every message of a chat shares; it keeps its identity while the chat's options do. */
export interface ChatMessageContext extends ChatCommandContext {
    /** The conversation shown; its parts start afresh when it changes. */
    conversationId: string | undefined;
    parts: ChatPartOptions;
    getNow: (() => Date) | undefined;
    onRetry: ((messageId: string) => void) | undefined;
    thinkingText: string | undefined;
    thinkingIcon: ReactNode;
    thinkingUntil: ChatThinkingUntil;
    onQuotePress: (messageId: string) => void;
    onExpandedPartsChange: (messageId: string, expanded: Record<string, boolean>) => void;
}
export interface ChatMessageViewProps {
    message: ChatMessageData;
    groupPosition: ChatMessageGroupPosition;
    /** The message this one replies to, when it is loaded. */
    quoted: ChatMessageData | undefined;
    /** The participants who read up to this message. */
    readers: readonly ChatReader[] | undefined;
    /** The reader's open and closed choices of the message's parts. */
    expandedParts: Readonly<Record<string, boolean>> | undefined;
    context: ChatMessageContext;
    /** Whether the message shows its author's avatar and name, its time and its background. */
    display: ChatMessageDisplayOptions;
}
/**
 * One message of a chat: its author, time, status, delivery and quote, its parts, reactions and
 * readers, and the commands the chat offers for it in an action bar and a context menu.
 */
export declare const ChatMessageView: import("react").MemoExoticComponent<({ message, groupPosition, quoted, readers, expandedParts, context, display, }: ChatMessageViewProps) => import("react").JSX.Element>;
//# sourceMappingURL=chat-message-view.d.ts.map