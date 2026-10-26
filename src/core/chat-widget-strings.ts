/** Strings of the `Chat` widget: its search, the reply and edit banners and the queue. */
export interface ChatWidgetStrings {
  /** Names the button that opens the search within a conversation, and its find box. */
  chatSearch: string;
  /** Leads the banner above the composer while the reader writes a reply. */
  chatReplyingTo: string;
  /** Names the button that stops replying. */
  chatCancelReply: string;
  /** The banner above the composer while the reader edits one of their messages. */
  chatEditingMessage: string;
  /** The banner above the composer while the reader edits a queued message. */
  chatEditingQueued: string;
  /** Counts the messages waiting for the running reply to end. */
  chatQueuedMessages: (count: number) => string;
  /** Names the button that edits the queued message at `position` (1-based). */
  chatEditQueued: (position: number) => string;
  /** Names the button that removes the queued message at `position` (1-based). */
  chatRemoveQueued: (position: number) => string;
}

export const chatWidgetStrings: ChatWidgetStrings = {
  chatSearch: 'Search this conversation',
  chatReplyingTo: 'Replying to',
  chatCancelReply: 'Cancel reply',
  chatEditingMessage: 'Editing your message',
  chatEditingQueued: 'Editing a queued message',
  chatQueuedMessages: (count) => (count === 1 ? '1 queued message' : `${count} queued messages`),
  chatEditQueued: (position) => `Edit queued message ${position}`,
  chatRemoveQueued: (position) => `Remove queued message ${position}`,
};
