import { defineStrings } from '../message-format.js';
/** Strings of the message composer's tools, edit mode and rich mode. */
export interface ComposerStrings {
  /** Opens the file chooser that attaches files to a message. */
  attachFiles: string;
  /** Opens the emoji picker that inserts an emoji at the caret. */
  insertEmoji: string;
  /** Opens the composer's "+" menu of things to add and other tools. */
  composerMenu: string;
  /** Names a composer select's trigger from what it chooses and the current option. */
  composerSelectTrigger: (label: string, value: string) => string;
  /** Says a mention or command left the message, from its label. */
  removedFromMessage: (label: string) => string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const composerStrings = defineStrings<ComposerStrings>({
  composerSelectTrigger: (label, value) => ({ label, value }),
  removedFromMessage: (label) => ({ label }),
});
