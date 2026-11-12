import { defineStrings } from '../message-format.js';

/** Strings of the `Chat` widget: its search, the reply and edit banners, the queue and sending. */
interface ChatWidgetStrings {
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
  /** Names the button that sends the queued message at `position` (1-based) into the conversation now. */
  chatSteerQueued: (position: number) => string;
  /** Names the button that edits the queued message at `position` (1-based). */
  chatEditQueued: (position: number) => string;
  /** Names the button that removes the queued message at `position` (1-based). */
  chatRemoveQueued: (position: number) => string;
  /** The line above the composer while the host takes time to accept what the reader did. */
  chatProgress: (action: 'send' | 'queue' | 'steer' | 'save' | 'remove') => string;
  /** Heads the reader's sending options in the composer's "+" menu. */
  chatSendOptions: string;
  /** Names the option that sends a message written during a reply at once instead of queuing it. */
  chatSteerWhilePending: string;
  /** Explains the option that steers during a reply. */
  chatSteerWhilePendingNote: string;
  /** Names the option that sends with Ctrl+Enter (Command+Enter on macOS), its chord after it. */
  chatSendWith: string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const chatWidgetStrings = defineStrings<ChatWidgetStrings>({
  chatQueuedMessages: (count) => ({ count }),
  chatSteerQueued: (position) => ({ position }),
  chatEditQueued: (position) => ({ position }),
  chatRemoveQueued: (position) => ({ position }),
  chatProgress: (action) => ({ action }),
});
