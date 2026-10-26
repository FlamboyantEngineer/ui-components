import type { ChatMessageDelivery, ChatMessageGroupPosition } from './chat-message.js';
/** The fields of a message that decide where it groups. */
export interface ChatGroupableMessage {
    id: string;
    /** Who wrote it; a message without an author never groups. */
    authorId?: string | undefined;
    /** When it was written: an ISO 8601 date and time, with an offset or read as local time. */
    createdAt: string;
    /** A system notice, which never groups. */
    isSystem?: boolean | undefined;
    /** A failed send never groups. */
    delivery?: ChatMessageDelivery | undefined;
}
export interface GroupChatMessagesOptions {
    /** The first message the reader has not seen; the unread divider goes before it. */
    firstUnreadId?: string | undefined;
    /** The longest pause between two messages of one group, in milliseconds. Defaults to 5 minutes. */
    maxGap?: number | undefined;
    /** The IANA time zone whose days the date separators follow. Defaults to the reader's. */
    timeZone?: string | undefined;
}
/**
 * One entry of a conversation to render, in order: a date separator for a day (`YYYY-MM-DD`), the
 * unread divider, or a message with its group position. `key` is stable across renders.
 */
export type ChatSequenceItem<M extends ChatGroupableMessage> = {
    kind: 'date';
    key: string;
    date: string;
} | {
    kind: 'unread';
    key: string;
} | {
    kind: 'message';
    key: string;
    message: M;
    groupPosition: ChatMessageGroupPosition;
};
/**
 * Turns messages, oldest first, into the sequence to render: a date separator before the first
 * message of each day (in `timeZone`, the reader's by default), the unread divider before
 * `firstUnreadId`, and each message with its group position. Consecutive messages by one author
 * group while each follows the last within `maxGap`; a date change, the unread divider, a system
 * notice, a message without an author and a failed send break groups.
 */
export declare function groupChatMessages<M extends ChatGroupableMessage>(messages: readonly M[], options?: GroupChatMessagesOptions): Array<ChatSequenceItem<M>>;
//# sourceMappingURL=chat-grouping.d.ts.map