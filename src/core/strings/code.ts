import { defineStrings } from '../message-format.js';
/** Strings of code blocks. */
interface CodeStrings {
  /** The heading of a code block without a title or language, by its variant (`code`, `terminal`). */
  codeBlockTitle: (variant: 'code' | 'terminal') => string;
  /** Copies a code block's code. */
  codeBlockCopy: string;
  /** Copies the commands of a terminal block, without their prompts, by their count. */
  codeBlockCopyCommands: (count: number) => string;
  /** Copies a terminal block that holds only output. */
  codeBlockCopyOutput: string;
  /** Applies a code block's code to the reader's work, such as a file being edited. */
  codeBlockApply: string;
  /** Says a math preview is typesetting its source. */
  mathPending: string;
  /** Says a math source does not typeset, before the typesetter's own reason. */
  mathInvalid: string;
  /** Says a math source is too long to preview, from the longest length previewed. */
  mathTooLong: (maxLength: number) => string;
  /** Names a math field's preview of its source. */
  mathPreview: string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const codeStrings = defineStrings<CodeStrings>({
  codeBlockTitle: (variant) => ({ variant }),
  codeBlockCopyCommands: (count) => ({ count }),
  mathTooLong: (maxLength) => ({ maxLength }),
});
