/**
 * Strings of chat messages and the parts around them: message names, delivery, markers, quotes,
 * typing, read receipts and the unread divider.
 */
export interface ChatMessageStrings {
    /**
     * Names a message by its author and its absolute date and time (`Maria Santos, Apr 20, 2026,
     * 10:12 AM`); either part may be missing.
     */
    chatMessageLabel: (author: string | undefined, time: string | undefined) => string;
    /** Names the delivery status of a message the reader sent. */
    chatDelivery: (delivery: 'sending' | 'sent' | 'delivered' | 'read' | 'failed') => string;
    /** Replaces the content of a deleted message. */
    chatMessageDeleted: string;
    /** Marks a reply the reader stopped before it finished. */
    chatStopped: string;
    /** Names a quoted message that jumps to the original, from its author and its excerpt. */
    chatQuoteLabel: (authorName: string, excerpt: string) => string;
    /** Says who is typing, from their names in order (`Ana and 2 others are typing…`). */
    chatTyping: (names: readonly string[]) => string;
    /** Says an assistant is working on its reply, inside the reply. */
    chatThinking: string;
    /** Says who has seen a message, from their names in order (`Seen by Ana, Ben and 3 others`). */
    chatSeenBy: (names: readonly string[]) => string;
    /** Marks where the messages the reader has not seen yet begin. */
    chatNewMessages: string;
}
export declare const chatMessageStrings: ChatMessageStrings;
//# sourceMappingURL=chat-message-strings.d.ts.map