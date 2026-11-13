// Pure operations on the conversation for the reader's side: their messages, prompts and responses.

import type { ChatMessageData, ChatPart } from '../chat-parts/chat-parts.js';
import type { ChatQuestionAnswer } from '../chat-question/chat-question.js';
import type { ChatToolCallDecision } from '../chat-tool-call/chat-tool-call.js';
import type { ChatQueuedMessage } from './chat-controller-state.js';

/** The reader's decision on an approval request, as `waitFor` resolves it. */
export interface ChatApprovalResponse {
  type: 'approval';
  decision: ChatToolCallDecision;
  /** The reader's reason for a denial. */
  reason?: string | undefined;
  /** Approved without asking, because the reader always allows the tool. */
  isAutoApproved?: boolean | undefined;
}

/** The reader's answers to a question card, or its dismissal, as `waitFor` resolves it. */
export interface ChatQuestionResponse {
  type: 'question';
  status: 'answered' | 'dismissed';
  /** One answer per question when answered; empty when dismissed. */
  answers: ChatQuestionAnswer[];
}

/** What the reader answered to a part that waited for them. */
export type ChatReaderResponse = ChatApprovalResponse | ChatQuestionResponse;

/**
 * Whether the part waits for the reader: an undecided approval request or a pending question. A
 * running reply that holds one is not busy for assistive technology, so its card stays readable.
 */
export function isAwaitingReader(part: ChatPart): boolean {
  if (part.type === 'question') return part.status === 'pending';
  return (
    part.type === 'tool-call' &&
    part.status === 'approval-requested' &&
    part.approval?.decision === undefined
  );
}

/** Whether the response is of the kind the part asks for: a decision on a call, answers to a card. */
function fitsResponse(part: ChatPart, response: ChatReaderResponse): boolean {
  return response.type === 'question' ? part.type === 'question' : part.type === 'tool-call';
}

/** Whether the part `id` waits for the reader and the response fits it. */
function takesResponse(part: ChatPart, id: string, response: ChatReaderResponse): boolean {
  return part.id === id && isAwaitingReader(part) && fitsResponse(part, response);
}

/**
 * The index of the last message holding the part `id` that waits for the reader and that the
 * response fits, or -1.
 */
export function findAwaitingMessage(
  messages: readonly ChatMessageData[],
  id: string,
  response: ChatReaderResponse,
): number {
  return messages.findLastIndex((message) =>
    message.parts.some((part) => takesResponse(part, id, response)),
  );
}

/** The response that dismisses a part waiting for the reader: a denial, or a dismissed card. */
export function toDismissal(part: ChatPart): ChatReaderResponse {
  return part.type === 'question'
    ? { type: 'question', status: 'dismissed', answers: [] }
    : { type: 'approval', decision: 'denied' };
}

/** The part with the reader's response recorded; the caller checked that the response fits it. */
function recordOnPart(part: ChatPart, response: ChatReaderResponse): ChatPart {
  if (response.type === 'question') {
    if (part.type !== 'question') return part;
    return response.status === 'answered'
      ? { ...part, status: 'answered', answers: response.answers }
      : { ...part, status: 'dismissed' };
  }
  if (part.type !== 'tool-call') return part;
  const { decision, reason } = response;
  return {
    ...part,
    status: decision === 'denied' ? 'denied' : 'running',
    approval: { ...part.approval, decision, ...(reason === undefined ? {} : { reason }) },
  };
}

/**
 * The message with the reader's response recorded on its part `id` while that part waits for
 * them: an approved or always-allowed call runs, a denied one is denied, a question is answered
 * or dismissed.
 */
export function recordResponse(
  message: ChatMessageData,
  id: string,
  response: ChatReaderResponse,
): ChatMessageData {
  return {
    ...message,
    parts: message.parts.map((part) =>
      takesResponse(part, id, response) ? recordOnPart(part, response) : part,
    ),
  };
}

/** The reader's message: the files it carries, then its text with the mentions and commands. */
export function createOutgoingMessage(
  outgoing: ChatQueuedMessage,
  author: { authorId: string; createdAt: string },
): ChatMessageData {
  const { id, text, tokens, attachments, replyTo } = outgoing;
  const parts: ChatPart[] = [];
  if (attachments?.length) parts.push({ type: 'files', attachments });
  if (text) parts.push(tokens?.length ? { type: 'text', text, tokens } : { type: 'text', text });
  return { id, ...author, parts, ...(replyTo === undefined ? {} : { replyTo }) };
}

/** The text of every message the reader wrote, oldest first, for the composer's recall. */
export function listPrompts(
  messages: readonly ChatMessageData[],
  currentUserId: string,
): readonly string[] {
  return messages
    .filter((message) => message.authorId === currentUserId && !message.isDeleted)
    .map((message) =>
      message.parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])).join('\n\n'),
    )
    .filter(Boolean);
}
