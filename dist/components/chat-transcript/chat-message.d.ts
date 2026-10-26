import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type AvatarIdentity, type AvatarProps } from '../avatar/avatar.js';
import type { RelativeTimeProps } from '../relative-time/relative-time.js';
import type { ChatQuoteData } from './chat-quote.js';
/** `sent` by the reader, `received` from someone else (a person or an assistant), or a `system` notice. */
export type ChatMessageOrigin = 'sent' | 'received' | 'system';
/** `complete`, still `streaming` in, failed with an `error`, or `cancelled` (stopped) by the reader. */
export type ChatMessageStatus = 'complete' | 'streaming' | 'error' | 'cancelled';
/** Where a message the reader sent has got to: on its way, sent, delivered, read, or failed. */
export type ChatMessageDelivery = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
/** How a message's content is drawn: in a `bubble` with a background, or `plain` text on the page. */
export type ChatMessageVariant = 'bubble' | 'plain';
/** A message's place in a run of messages by one author: alone, or first, middle or last. */
export type ChatMessageGroupPosition = 'single' | 'first' | 'middle' | 'last';
/** The person or assistant who wrote a message, with their presence when known. */
export interface ChatMessageAuthor extends AvatarIdentity, Pick<AvatarProps, 'status' | 'statusLabel'> {
}
export interface ChatMessageProps extends BaseProps, Pick<RelativeTimeProps, 'getNow'> {
    /** Who the message is from, relative to the reader. Defaults to `received`. */
    origin?: ChatMessageOrigin | undefined;
    /** The person or assistant who wrote it, drawn as an avatar (with their presence) and a name. */
    author?: ChatMessageAuthor | undefined;
    /** Shows the author's avatar at the start of a group. Defaults to `true`. */
    showAvatar?: boolean | undefined;
    /** Shows the author's name at the start of a group. Defaults to `true`; the message's name keeps it. */
    showAuthorName?: boolean | undefined;
    /** Shows the time in the header. Defaults to `true`; the message's name keeps it. */
    showTime?: boolean | undefined;
    /** Draws the content in a `bubble` (the default) or as `plain` text. */
    variant?: ChatMessageVariant | undefined;
    /** When it was written: an ISO 8601 date and time, read relative to now. */
    time?: string | undefined;
    /** Defaults to `complete`. A streaming message is busy until it completes. */
    status?: ChatMessageStatus | undefined;
    /** Its place in a run of messages by one author. Defaults to `single`. */
    groupPosition?: ChatMessageGroupPosition | undefined;
    /** Where a message the reader sent has got to. */
    delivery?: ChatMessageDelivery | undefined;
    /** Why the message or its reply failed, shown as an alert. */
    error?: string | undefined;
    /** Retries a failed send or a failed reply; shows a Retry button with `error` or `failed`. */
    onRetry?: (() => void) | undefined;
    /** Marks the message as changed after it was sent. */
    isEdited?: boolean | undefined;
    /** Replaces the content, quote, reactions and actions with a deleted placeholder. */
    isDeleted?: boolean | undefined;
    /** The message this one replies to. */
    quote?: ChatQuoteData | undefined;
    /** Called with the quoted message's id when the reader presses the quote. */
    onQuotePress?: ((messageId: string) => void) | undefined;
    /** The reactions, usually a `ReactionBar`. */
    reactions?: ReactNode;
    /** Who has read up to this message, usually `ChatReadReceipts`. */
    readers?: ReactNode;
    /** Commands about the message, such as copy or retry. */
    actions?: ReactNode;
    /** The message's content, such as text or rendered markdown. */
    children?: ReactNode;
}
/**
 * One message in a conversation: an `<article>` named by its author and absolute time, with the
 * author's avatar and name at the start of a group and a relative time (each unless hidden), the content
 * in a bubble or plain, its quote, markers, delivery, error, reactions, readers and actions. A
 * streaming message is busy (`aria-busy`) so assistive technology reads it once it completes.
 */
export declare function ChatMessage({ origin, author, showAvatar, showAuthorName, showTime, variant, time, status, groupPosition, delivery, isDeleted, readers, getNow, className, ...rest }: ChatMessageProps): import("react").JSX.Element;
//# sourceMappingURL=chat-message.d.ts.map