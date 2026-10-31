import { defineStrings } from '../message-format.js';
/** Strings of a conversation's transcript: its announcements, history and unread messages. */
export interface ChatStrings {
  /** Announces one new message, from its author's name (`null` for a notice) and its text. */
  newMessageAnnouncement: (author: string | null, text: string) => string;
  /** Counts new messages: on the jump button while scrolled away, and in announcements. */
  newMessageCount: (count: number) => string;
  /** Counts the unread messages, in the bar shown while the first unread message is above the view. */
  unreadMessageCount: (count: number) => string;
  /** Jumps to the first unread message. */
  jumpToUnread: string;
  /** Names the indicator shown, and is announced, while older messages load. */
  loadingOlderMessages: string;
  /** Announces how many older messages were added above. */
  olderMessagesLoaded: (count: number) => string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const chatStrings = defineStrings<ChatStrings>({
  newMessageAnnouncement: (author, text) => ({ author, text, hasAuthor: author !== null }),
  newMessageCount: (count) => ({ count }),
  unreadMessageCount: (count) => ({ count }),
  olderMessagesLoaded: (count) => ({ count }),
});
