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
  /** Names a snippet field's first-line input. */
  snippetStartLine: string;
  /** Names a snippet field's last-line input. */
  snippetEndLine: string;
  /** Loads a preview of the snippet the source and lines name. */
  snippetPreview: string;
  /** Saves a previewed snippet in place of none or a different one. */
  snippetApply: string;
  /** Saves a previewed snippet whose source changed since it was saved. */
  snippetUpdate: string;
  /** Says a snippet preview is loading. */
  snippetLoading: string;
  /** Says a snippet field holds no snippet yet. */
  snippetEmpty: string;
  /** Says the previewed code is the saved code. */
  snippetUnchanged: string;
  /** Says the source changed since the saved snippet was taken from it. */
  snippetStale: string;
  /** Says a snippet's last line comes before its first. */
  snippetRangeOrder: string;
  /** Says a snippet range needs both lines, or neither for the whole source. */
  snippetRangeIncomplete: string;
  /** Names the lines a snippet was taken from. */
  snippetLines: (start: number, end: number) => string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const codeStrings = defineStrings<CodeStrings>({
  codeBlockTitle: (variant) => ({ variant }),
  codeBlockCopyCommands: (count) => ({ count }),
  snippetLines: (start, end) => ({ start, end }),
});
