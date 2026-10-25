/** Strings of the message composer's tools, edit mode and rich mode. */
export interface ComposerStrings {
  /** Opens the file chooser that attaches files to a message. */
  attachFiles: string;
  /** Opens the emoji picker that inserts an emoji at the caret. */
  insertEmoji: string;
  /** Says a mention or command left the message, from its label. */
  removedFromMessage: (label: string) => string;
}

export const composerStrings: ComposerStrings = {
  attachFiles: 'Attach files',
  insertEmoji: 'Insert emoji',
  removedFromMessage: (label) => `${label} removed`,
};
