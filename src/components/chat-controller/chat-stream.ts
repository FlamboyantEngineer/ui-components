// The events an assistant's reply streams in, and the pure reducer that folds them into the reply.

import type { ChatPlanStep, ChatPlanStepStatus } from '../chat-activity/chat-activity.js';
import type { ChatAttachmentData } from '../chat-attachment/chat-attachment.js';
import type { ChatMessageData, ChatPart } from '../chat-parts/chat-parts.js';
import type { ChatQuestionItem } from '../chat-question/chat-question.js';
import type { ChatSource } from '../chat-sources/chat-sources.js';
import type { CodeBlockData } from '../code-block/code-block.js';
import {
  addPart,
  appendFile,
  appendSource,
  closeOpenParts,
  endChatReply,
  updatePart,
  type ChatStreamContext,
} from './chat-stream-parts.js';

export type { ChatStreamContext } from './chat-stream-parts.js';

/** One step of an assistant's reply, as plain data. `send` yields these in order. */
export type ChatStreamEvent =
  /** Appends text to the reply's open text part, or starts a text part. */
  | { type: 'text-delta'; text: string }
  /** Appends text to the reasoning part `id`, or starts it. */
  | { type: 'reasoning-delta'; id: string; text: string }
  /** Completes the reasoning part `id`, timed by the controller when `durationMs` is missing. */
  | { type: 'reasoning-end'; id: string; durationMs?: number | undefined }
  /** Starts the tool call `id`, running, or updates its name, label and arguments. */
  | { type: 'tool-call'; id: string; name: string; label?: string | undefined; args?: unknown }
  /** Ends the tool call `id`: failed with an `error`, else succeeded with its `result`. */
  | {
      type: 'tool-result';
      id: string;
      result?: unknown;
      error?: string | undefined;
      durationMs?: number | undefined;
    }
  /**
   * Asks the reader to approve the tool call `id`. With `await`, `send` waits for the decision
   * through `waitFor(id)`; without it, the turn ends and the decision starts the next one.
   */
  | { type: 'approval-request'; id: string; scopeLabel?: string | undefined; await?: boolean }
  /** Asks the reader the questions of the card `id`, awaited as an approval is. */
  | { type: 'question'; id: string; questions: readonly ChatQuestionItem[]; await?: boolean }
  /** Adds the plan `id`, or replaces its title and steps. */
  | { type: 'plan'; id: string; title?: string | undefined; steps: readonly ChatPlanStep[] }
  /** Moves the step `stepId` of the plan `planId` to `status`. */
  | { type: 'plan-step'; planId: string; stepId: string; status: ChatPlanStepStatus }
  /** Adds a source to the reply's sources, or replaces the one with its `id`. */
  | { type: 'source'; source: ChatSource }
  /** Adds a file the reply produced. */
  | { type: 'file'; attachment: ChatAttachmentData }
  /** Adds a block of code or terminal output, or replaces the one with its `id`. */
  | ({ type: 'code'; id?: string | undefined } & CodeBlockData)
  /** Adds a diff, or replaces the one with its `id`. */
  | {
      type: 'diff';
      id?: string | undefined;
      title?: string | undefined;
      oldText: string;
      newText: string;
    }
  /** Adds a part the host draws itself, or replaces the one with its `id`. */
  | { type: 'custom'; id?: string | undefined; name: string; data?: unknown }
  /** Says what the assistant is doing, such as `Searching recipes…`; an empty text clears it. */
  | { type: 'status'; text: string }
  /** Ends the reply. */
  | { type: 'finish' }
  /** Ends the reply as failed, with the reason to show. */
  | { type: 'error'; message: string };

/** The kinds of stream event. */
export type ChatStreamEventType = ChatStreamEvent['type'];

type EventOf<T extends ChatStreamEventType> = Extract<ChatStreamEvent, { type: T }>;
type Handler<T extends ChatStreamEventType> = (
  message: ChatMessageData,
  event: EventOf<T>,
  context: ChatStreamContext,
) => ChatMessageData;

const withParts = (message: ChatMessageData, parts: readonly ChatPart[]): ChatMessageData => ({
  ...message,
  parts,
});

/**
 * Appends to the open text part, the last part but for the sources list (sources arriving
 * between citations do not break the text), or starts a text part.
 */
function appendText(
  message: ChatMessageData,
  { text }: EventOf<'text-delta'>,
  context: ChatStreamContext,
) {
  const parts = closeOpenParts(message.parts, context, (part) => part.type === 'text');
  const index = parts.findLastIndex((part) => part.type !== 'sources');
  const open = parts[index];
  if (open?.type === 'text' && open.status === 'streaming') {
    return withParts(
      message,
      parts.map((part, position) =>
        position === index ? { ...open, text: open.text + text } : part,
      ),
    );
  }
  return withParts(message, [...parts, { type: 'text', text, status: 'streaming' }]);
}

function appendReasoning(
  message: ChatMessageData,
  { id, text }: EventOf<'reasoning-delta'>,
  context: ChatStreamContext,
) {
  const isSame = (part: ChatPart) => part.type === 'reasoning' && part.id === id;
  const parts = closeOpenParts(message.parts, context, isSame);
  if (!parts.some(isSame)) {
    return withParts(message, [...parts, { type: 'reasoning', id, text, status: 'streaming' }]);
  }
  return withParts(
    message,
    updatePart(parts, { type: 'reasoning', id }, (part) => ({ ...part, text: part.text + text })),
  );
}

/** Starts a tool call, running, or updates the name, label and arguments of the one with its id. */
function upsertToolCall(
  message: ChatMessageData,
  { type: _type, ...call }: EventOf<'tool-call'>,
  context: ChatStreamContext,
) {
  if (!message.parts.some((part) => part.type === 'tool-call' && part.id === call.id)) {
    return withParts(
      message,
      addPart(message.parts, { type: 'tool-call', status: 'running', ...call }, context),
    );
  }
  return withParts(
    message,
    updatePart(message.parts, { type: 'tool-call', id: call.id }, (part) => ({ ...part, ...call })),
  );
}

const handlers: { [T in ChatStreamEventType]: Handler<T> } = {
  'text-delta': appendText,
  'reasoning-delta': appendReasoning,
  'reasoning-end': (message, { id, durationMs }, context) =>
    withParts(
      message,
      updatePart(message.parts, { type: 'reasoning', id }, (part) => ({
        ...part,
        status: 'complete',
        durationMs: durationMs ?? part.durationMs ?? context.getElapsed?.(id),
      })),
    ),
  'tool-call': upsertToolCall,
  'tool-result': (message, { id, result, error, durationMs }, context) =>
    withParts(
      message,
      updatePart(message.parts, { type: 'tool-call', id }, (part) => ({
        ...part,
        status: part.status === 'denied' ? part.status : error ? 'failed' : 'succeeded',
        result,
        error,
        durationMs: durationMs ?? part.durationMs ?? context.getElapsed?.(id),
      })),
    ),
  'approval-request': (message, { id, scopeLabel }, context) =>
    withParts(
      message,
      updatePart(message.parts, { type: 'tool-call', id }, (part) =>
        context.alwaysAllowed?.includes(part.name)
          ? { ...part, status: 'running', approval: { scopeLabel, isAutoApproved: true } }
          : { ...part, status: 'approval-requested', approval: { scopeLabel } },
      ),
    ),
  question: (message, { id, questions }, context) =>
    withParts(
      message,
      addPart(message.parts, { type: 'question', id, questions, status: 'pending' }, context),
    ),
  plan: (message, { type: _type, ...plan }, context) =>
    withParts(message, addPart(message.parts, { type: 'plan', ...plan }, context)),
  'plan-step': (message, { planId, stepId, status }) =>
    withParts(
      message,
      updatePart(message.parts, { type: 'plan', id: planId }, (part) => ({
        ...part,
        steps: part.steps.map((step) => (step.id === stepId ? { ...step, status } : step)),
      })),
    ),
  source: (message, { source }) => withParts(message, appendSource(message.parts, source)),
  file: (message, { attachment }, context) =>
    withParts(message, appendFile(closeOpenParts(message.parts, context), attachment)),
  code: (message, { type: _type, ...code }, context) =>
    withParts(message, addPart(message.parts, { type: 'code', ...code }, context)),
  diff: (message, { type: _type, ...diff }, context) =>
    withParts(message, addPart(message.parts, { type: 'diff', ...diff }, context)),
  custom: (message, { type: _type, ...custom }, context) =>
    withParts(message, addPart(message.parts, { type: 'custom', ...custom }, context)),
  status: (message, { text }) => ({ ...message, statusText: text || undefined }),
  finish: (message, _event, context) => endChatReply(message, { status: 'complete' }, context),
  error: (message, { message: error }, context) =>
    endChatReply(message, { status: 'error', error }, context),
};

/**
 * Folds one stream event into the assistant's reply and returns the new reply, leaving the given
 * one unchanged. Events about a part the reply does not hold (a result for an unknown tool call, a
 * step of an unknown plan) change nothing.
 */
export function reduceChatStream(
  message: ChatMessageData,
  event: ChatStreamEvent,
  context: ChatStreamContext = {},
): ChatMessageData {
  const handler = handlers[event.type] as Handler<ChatStreamEventType>;
  return handler(message, event, context);
}
