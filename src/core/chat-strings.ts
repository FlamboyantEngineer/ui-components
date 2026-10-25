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

export const chatStrings: ChatStrings = {
  newMessageAnnouncement: (author, text) =>
    author === null ? `New message: ${text}` : `New message from ${author}: ${text}`,
  newMessageCount: (count) => (count === 1 ? '1 new message' : `${count} new messages`),
  unreadMessageCount: (count) => `${count} unread`,
  jumpToUnread: 'Jump',
  loadingOlderMessages: 'Loading older messages',
  olderMessagesLoaded: (count) =>
    count === 1 ? '1 older message loaded' : `${count} older messages loaded`,
};
