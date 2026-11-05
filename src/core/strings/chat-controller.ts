import { defineStrings } from '../message-format.js';

/** Strings of the chat controller. */
interface ChatControllerStrings {
  /** The error a failed reply shows when the failure gives no reason. */
  chatReplyFailed: string;
}

/** The module's text, which takes no arguments. */
export const chatControllerStrings = defineStrings<ChatControllerStrings>({});
