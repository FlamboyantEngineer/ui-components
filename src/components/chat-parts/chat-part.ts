import type { ChatPlanData, ChatReasoningData } from '../chat-activity/chat-activity.js';
import type { ChatAttachmentData } from '../chat-attachment/chat-attachment.js';
import type { ChatQuestionData } from '../chat-question/chat-question.js';
import type { ChatSourcesData } from '../chat-sources/chat-sources.js';
import type { ChatToolCallData } from '../chat-tool-call/chat-tool-call.js';
import type { CodeBlockData } from '../code-block/code-block.js';

/** How a text part renders: as Markdown, or as plain text with its line breaks. */
export type ChatTextFormat = 'markdown' | 'plain';

/** A mention, command or record reference the composer inserted, as a range of the part's text. */
export interface ChatTextToken {
  /** Where the token starts in `text`, in UTF-16 code units. */
  start: number;
  /** Where the token ends in `text` (exclusive). */
  end: number;
  kind: 'mention' | 'command' | 'reference';
  /** The participant's, command's or referenced record's id. */
  id: string;
  /** The text the pill shows; a reference's chip identifier. */
  label: string;
  /** A reference's record kind or scope, as the host names it. */
  recordType?: string | undefined;
}

/** Text: Markdown by default, streamed in while `status` is `streaming`. */
export interface ChatTextPart {
  type: 'text';
  id?: string | undefined;
  text: string;
  /** Overrides the conversation's default format for this part. */
  format?: ChatTextFormat | undefined;
  /** Defaults to `complete`. */
  status?: 'streaming' | 'complete' | undefined;
  /** Mentions, commands and record references in the text. */
  tokens?: readonly ChatTextToken[] | undefined;
}

/** The agent's reasoning, shown as a disclosure. */
export interface ChatReasoningPart extends ChatReasoningData {
  type: 'reasoning';
  id: string;
}

/** A tool call, with its approval while it waits for the reader. */
export interface ChatToolCallPart extends ChatToolCallData {
  type: 'tool-call';
}

/** Questions the agent asks the reader. */
export interface ChatQuestionPart extends ChatQuestionData {
  type: 'question';
}

/** A plan or task list whose steps advance as the agent works. */
export interface ChatPlanPart extends ChatPlanData {
  type: 'plan';
  id: string;
}

/** The sources an answer cites; `[n]` markers in the message's text parts link to them. */
export interface ChatSourcesPart extends ChatSourcesData {
  type: 'sources';
  id?: string | undefined;
}

/** Files and images attached to or produced by the message. */
export interface ChatFilesPart {
  type: 'files';
  id?: string | undefined;
  attachments: readonly ChatAttachmentData[];
}

/** A block of code or terminal output (`variant: 'terminal'`). */
export interface ChatCodePart extends CodeBlockData {
  type: 'code';
  id?: string | undefined;
}

/** A change to a text, such as a file, shown as a diff. */
export interface ChatDiffPart {
  type: 'diff';
  id?: string | undefined;
  /** Names what changed, such as a file name. */
  title?: string | undefined;
  oldText: string;
  newText: string;
}

/** A part the host draws itself through `renderPart`. */
export interface ChatCustomPart {
  type: 'custom';
  id?: string | undefined;
  /** What kind of custom part it is, for the host's renderer. */
  name: string;
  data?: unknown;
}

/** One part of a message, in the order it was written. */
export type ChatPart =
  | ChatTextPart
  | ChatReasoningPart
  | ChatToolCallPart
  | ChatQuestionPart
  | ChatPlanPart
  | ChatSourcesPart
  | ChatFilesPart
  | ChatCodePart
  | ChatDiffPart
  | ChatCustomPart;

/** The kinds of part a message can hold. */
export type ChatPartType = ChatPart['type'];
