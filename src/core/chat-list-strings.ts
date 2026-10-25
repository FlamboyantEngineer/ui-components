/** What a conversation row of a chat list says about the conversation, in reading order. */
export interface ChatConversationLabelParts {
  /** The conversation's title. */
  title: string;
  /** The other person's presence, read after their name in a one-to-one conversation. */
  presence?: string | undefined;
  /** How many messages the reader has not read. */
  unreadCount: number;
  /** The reader turned the conversation's notifications off. */
  isMuted: boolean;
  /** When the last message arrived, as the row shows it. */
  time?: string | undefined;
}

/** Strings of the chat conversation list. */
export interface ChatListStrings {
  /** Default name of a list of conversations. */
  conversations: string;
  /** Names and hints the search field of a list of conversations. */
  searchConversations: string;
  /** Starts a new conversation. */
  newChat: string;
  /** Fills a list that has no conversations. */
  noConversations: string;
  /** Fills a list whose search matches no conversation. */
  noMatchingConversations: string;
  /** Announces that the conversations are loading. */
  loadingConversations: string;
  /** Reads a conversation's unread count. */
  unreadMessages: (count: number) => string;
  /** Marks a conversation whose notifications are off. */
  conversationMuted: string;
  /** Names a conversation row from what it shows. */
  conversationLabel: (parts: ChatConversationLabelParts) => string;
}

const unreadText = (count: number) =>
  count === 1 ? '1 unread message' : `${count} unread messages`;

export const chatListStrings: ChatListStrings = {
  conversations: 'Conversations',
  searchConversations: 'Search conversations',
  newChat: 'New chat',
  noConversations: 'No conversations yet',
  noMatchingConversations: 'No matching conversations',
  loadingConversations: 'Loading conversations',
  unreadMessages: unreadText,
  conversationMuted: 'Muted',
  conversationLabel: ({ title, presence, unreadCount, isMuted, time }) =>
    [
      title,
      presence,
      unreadCount > 0 ? unreadText(unreadCount) : undefined,
      isMuted ? 'muted' : undefined,
      time,
    ]
      .filter(Boolean)
      .join(', '),
};
