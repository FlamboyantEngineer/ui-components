import { defineStrings } from '../message-format.js';
/**
 * Strings of chat messages and the parts around them: message names, delivery, markers, quotes,
 * typing, read receipts and the unread divider.
 */
interface ChatMessageStrings {
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

/** The module's text, with the message values each text function reads its arguments as. */
export const chatMessageStrings = defineStrings<ChatMessageStrings>({
  chatMessageLabel: (author, time) => ({ author, time, hasBoth: Boolean(author) && Boolean(time) }),
  chatDelivery: (delivery) => ({ delivery }),
  chatQuoteLabel: (authorName, excerpt) => ({ authorName, excerpt }),
  chatTyping: (names) => ({
    names,
    count: names.length,
    first: names[0],
    others: names.length - 1,
  }),
  chatSeenBy: (names) => ({
    names,
    first: names[0],
    second: names[1],
    others: names.length > 3 ? names.length - 2 : 0,
  }),
});
