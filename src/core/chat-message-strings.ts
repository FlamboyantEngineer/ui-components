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

const deliveryLabels = {
  sending: 'Sending',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Not sent',
} as const;

/** `A`, `A and B`, or `A, B and C`. */
function joinNames(names: readonly string[]): string {
  if (names.length < 2) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1) ?? ''}`;
}

export const chatMessageStrings: ChatMessageStrings = {
  chatMessageLabel: (author, time) => [author, time].filter(Boolean).join(', '),
  chatDelivery: (delivery) => deliveryLabels[delivery],
  chatMessageDeleted: 'Message deleted',
  chatStopped: 'Stopped',
  chatQuoteLabel: (authorName, excerpt) => `Quote from ${authorName}: ${excerpt}`,
  chatTyping: (names) => {
    if (names.length <= 1) return `${names[0] ?? ''} is typing…`;
    if (names.length === 2) return `${joinNames(names)} are typing…`;
    return `${names[0] ?? ''} and ${names.length - 1} others are typing…`;
  },
  chatThinking: 'Thinking…',
  chatSeenBy: (names) =>
    names.length <= 3
      ? `Seen by ${joinNames(names)}`
      : `Seen by ${names[0] ?? ''}, ${names[1] ?? ''} and ${names.length - 2} others`,
  chatNewMessages: 'New messages',
};
