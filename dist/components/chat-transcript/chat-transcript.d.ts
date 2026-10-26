import type { ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import type { ChatTranscriptScrollMode } from './transcript-runtime.js';
export type { ChatTranscriptScrollMode } from './transcript-runtime.js';
export interface ChatTranscriptProps extends BaseProps, AriaLabellingProps {
    /** The messages, usually `ChatMessage` elements with an `id` each, oldest first. */
    children?: ReactNode;
    /** Shown while there are no messages, such as suggested first questions. */
    emptyState?: ReactNode;
    /** `follow` (default) keeps the latest message in view; `anchor` keeps the reader's sent message at the top while the reply fills in below. */
    scrollMode?: ChatTranscriptScrollMode | undefined;
    /** Called on Escape from a message, for example to move focus to the composer. */
    onEscape?: (() => void) | undefined;
    /** Called when the reader nears the top while `hasOlder`, to load older messages. */
    onLoadOlder?: (() => void) | undefined;
    /** Older messages remain to be loaded. */
    hasOlder?: boolean | undefined;
    /** Older messages are loading. */
    isLoadingOlder?: boolean | undefined;
    /** The message to scroll to, mark and focus, such as a search result. */
    highlightedMessageId?: string | undefined;
    /** The first message the reader has not read. */
    firstUnreadId?: string | undefined;
    /** Called with the newest message that has been in view or focused, once it settles. */
    onRead?: ((lastSeenId: string) => void) | undefined;
    /** Mount only the messages near the view, for very long histories. */
    virtualized?: boolean | undefined;
}
/**
 * A conversation: a `feed` of messages, one tab stop, that follows the latest message (or
 * anchors the reader's sent message at the top), keeps the reader's place as older history loads,
 * announces new messages through its own live region, marks the unread and can virtualize a very
 * long history.
 */
export declare function ChatTranscript({ children, emptyState, scrollMode, onEscape, onLoadOlder, hasOlder, isLoadingOlder, highlightedMessageId, firstUnreadId, onRead, virtualized, className, id, 'aria-label': ariaLabel, 'aria-labelledby': labelledBy, 'aria-describedby': describedBy, 'aria-details': details, ...rest }: ChatTranscriptProps): import("react").JSX.Element;
export { ChatMessage } from './chat-message.js';
export type { ChatMessageAuthor, ChatMessageDelivery, ChatMessageGroupPosition, ChatMessageVariant, ChatMessageOrigin, ChatMessageProps, ChatMessageStatus, } from './chat-message.js';
export { ChatQuote } from './chat-quote.js';
export type { ChatQuoteData, ChatQuoteProps } from './chat-quote.js';
export { ChatDateSeparator } from './chat-date-separator.js';
export { ChatUnreadDivider } from './chat-unread-divider.js';
export { ChatTypingIndicator } from './chat-typing-indicator.js';
export { ChatReadReceipts } from './chat-read-receipts.js';
export type { ChatReader } from './chat-read-receipts.js';
export { groupChatMessages } from './chat-grouping.js';
export type { ChatSequenceItem } from './chat-grouping.js';
//# sourceMappingURL=chat-transcript.d.ts.map