import { defineStrings } from '../message-format.js';
/** Strings of a chat message's actions: the action bar, its context menu, feedback and deleting. */
export interface ChatActionsStrings {
  /** Names a message's action bar and its context menu. */
  messageActions: string;
  /** Rates a reply as good (thumbs up). */
  goodResponse: string;
  /** Rates a reply as bad (thumbs down). */
  badResponse: string;
  /** Names the ratings in a message's context menu. */
  messageFeedback: string;
  /** Titles the feedback details that follow a rating, by the rating chosen. */
  feedbackDetails: (rating: 'up' | 'down') => string;
  /** Names the reasons a reader can pick in the feedback details. */
  feedbackReasons: string;
  /** Labels the optional comment in the feedback details. */
  feedbackComment: string;
  /** Sends the feedback details with the rating. */
  submitFeedback: string;
  /** The title and message of the confirmation before a message is deleted. */
  deleteMessage: string;
  deleteMessageDescription: string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const chatActionsStrings = defineStrings<ChatActionsStrings>({
  feedbackDetails: (rating) => ({ rating }),
});
