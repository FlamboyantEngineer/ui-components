import type { MessageArguments } from './message-format.js';
/** What a conversation row of a chat list says about the conversation, in reading order. */
interface ChatConversationLabelParts {
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

/** The message values each text function reads its arguments as. */
export const chatListArguments: MessageArguments<ChatListStrings> = {
  unreadMessages: (count) => ({ count }),
  conversationLabel: (parts) => ({
    ...parts,
    hasPresence: Boolean(parts.presence),
    hasTime: Boolean(parts.time),
  }),
};
