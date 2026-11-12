'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUiClock, useUiStrings } from '../../core/provider.js';
import { useLatest } from '../../utils/use-latest.js';
import { useStoreValue } from '../../utils/use-store-value.js';
import type { ChatAttachmentData } from '../chat-attachment/chat-attachment.js';
import type { ChatMessageData, ChatTextToken } from '../chat-parts/chat-parts.js';
import type { ChatQuestionAnswer } from '../chat-question/chat-question.js';
import type {
  ChatEngineConfig,
  ChatQueuedMessage,
  ChatSendFunction,
  ChatUploadFunction,
} from './chat-controller-state.js';
import { type ChatEngine, type ChatMessagesUpdate, createChatEngine } from './chat-engine.js';
import { listPrompts } from './chat-reply.js';

export type {
  ChatQueuedMessage,
  ChatSendContext,
  ChatSendFunction,
  ChatUploadContext,
  ChatUploadFunction,
} from './chat-controller-state.js';
export type { ChatMessagesUpdate } from './chat-engine.js';
export type {
  ChatApprovalResponse,
  ChatQuestionResponse,
  ChatReaderResponse,
} from './chat-reply.js';
export { isAwaitingReader } from './chat-reply.js';
export type { ChatStreamContext, ChatStreamEvent, ChatStreamEventType } from './chat-stream.js';
export { reduceChatStream } from './chat-stream.js';

export interface ChatControllerOptions {
  /** Streams the assistant's reply to the conversation, which ends with the reader's message. */
  send: ChatSendFunction;
  /** The reader's participant id, the author of the messages they send. */
  currentUserId: string;
  /** The assistant's participant id, the author of its replies. */
  assistantId: string;
  /** The conversation at first. */
  initialMessages?: readonly ChatMessageData[] | undefined;
  /** Uploads a file the reader attaches; without it, the reader cannot attach files. */
  upload?: ChatUploadFunction | undefined;
  /** The tools the reader always allows (controlled). Uncontrolled, the controller keeps them. */
  alwaysAllowed?: readonly string[] | undefined;
  /** Receives the tools the reader always allows when Always allow adds one. */
  onAlwaysAllowedChange?: ((tools: readonly string[]) => void) | undefined;
}

/** What a chat needs from the controller, to spread into it. */
export interface ChatControllerProps {
  messages: readonly ChatMessageData[];
  /** A reply is running. */
  isPending: boolean;
  /** Sends the reader's message, or queues it while a reply runs. */
  onSend: (text: string, tokens?: readonly ChatTextToken[]) => void;
  /** Stops the running reply and sends the reader's message at once, ahead of the queue. */
  onSendNow: (text: string, tokens?: readonly ChatTextToken[]) => void;
  /** Stops the running reply and sends the queued message `id` at once, ahead of the rest of the queue. */
  onSteer: (id: string) => void;
  /** Stops the running reply. */
  onStop: () => void;
  /** Runs the last turn again when `messageId` is the reply that failed. */
  onRetry: (messageId: string) => void;
  /** Lets the tool call `callId` run once. */
  onApprove: (callId: string) => void;
  /** Refuses the tool call `callId`, with the reader's reason. */
  onDeny: (callId: string, reason?: string) => void;
  /** Lets the tool call `callId` run, and its tool run from then on without asking. */
  onAlwaysAllow: (callId: string) => void;
  /** Records the reader's answers to the question card `questionId`. */
  onAnswerQuestion: (questionId: string, answers: ChatQuestionAnswer[]) => void;
  /** Dismisses the question card `questionId`. */
  onDismissQuestion: (questionId: string) => void;
  /** The messages waiting for the running reply to end. */
  queue: readonly ChatQueuedMessage[];
  /** Replaces the queue, as when the reader edits or removes a queued message. */
  onQueueChange: (queue: readonly ChatQueuedMessage[]) => void;
  /** Records the queued message the reader edits, or `undefined` when the edit ends; it waits meanwhile. */
  onQueuedEditChange: (id: string | undefined) => void;
  /** The text of the messages the reader sent, oldest first, for the composer's recall. */
  history: readonly string[];
  /** The files the composer holds for the next message. */
  attachments: readonly ChatAttachmentData[];
  /** Attaches and uploads files; set only with `upload`. */
  onAttach: ((files: File[]) => void) | undefined;
  /** Removes a file from the composer, aborting its upload; set only with `upload`. */
  onRemoveAttachment: ((id: string) => void) | undefined;
  /** Uploads a failed file again; set only with `upload`. */
  onRetryAttachment: ((id: string) => void) | undefined;
}

export interface ChatController {
  messages: readonly ChatMessageData[];
  /** A reply is running. */
  isPending: boolean;
  /** The messages waiting for the running reply to end. */
  queue: readonly ChatQueuedMessage[];
  /** What the assistant is doing while its reply runs, such as `Searching recipes…`. */
  statusText: string | undefined;
  /** Sends the reader's message, or queues it while a reply runs. */
  send: (text: string, tokens?: readonly ChatTextToken[]) => void;
  /** Stops the running reply and sends the reader's message at once, ahead of the queue. */
  sendNow: (text: string, tokens?: readonly ChatTextToken[]) => void;
  /** Stops the running reply and sends the queued message `id` at once, ahead of the rest of the queue. */
  steer: (id: string) => void;
  /** Stops the running reply, keeping what it streamed. */
  stop: () => void;
  /** Runs the last turn again after its reply failed. */
  retry: () => void;
  /**
   * Edits the conversation as it stands, such as to add a reaction or older messages; the running
   * reply, the queue and the uploads carry on.
   */
  updateMessages: (update: ChatMessagesUpdate) => void;
  /**
   * Replaces the conversation (empty by default), such as to clear it or load another one, and
   * drops what the old one owned: the running reply, its waiters, the queue, the composer's files
   * and their uploads.
   */
  resetConversation: (messages?: readonly ChatMessageData[]) => void;
  /** Everything a chat needs, to spread into it. */
  props: ChatControllerProps;
}

function useChatProps(
  engine: ChatEngine,
  state: ReturnType<ChatEngine['store']['get']>,
  options: Pick<ChatControllerOptions, 'currentUserId' | 'upload'>,
): ChatControllerProps {
  const { messages, isPending, queue, attachments } = state;
  const { currentUserId, upload } = options;
  const canUpload = upload !== undefined;
  const history = useMemo(() => listPrompts(messages, currentUserId), [messages, currentUserId]);
  return useMemo(
    () => ({
      messages,
      isPending,
      onSend: engine.send,
      onSendNow: engine.sendNow,
      onSteer: engine.steer,
      onStop: engine.stop,
      onRetry: (messageId: string) => {
        if (messages.at(-1)?.id === messageId) engine.retry();
      },
      onApprove: engine.approve,
      onDeny: engine.deny,
      onAlwaysAllow: engine.alwaysAllow,
      onAnswerQuestion: engine.answerQuestion,
      onDismissQuestion: engine.dismissQuestion,
      queue,
      onQueueChange: engine.setQueue,
      onQueuedEditChange: engine.setEditingQueued,
      history,
      attachments,
      onAttach: canUpload ? engine.attach : undefined,
      onRemoveAttachment: canUpload ? engine.removeAttachment : undefined,
      onRetryAttachment: canUpload ? engine.retryAttachment : undefined,
    }),
    [engine, messages, isPending, queue, history, attachments, canUpload],
  );
}

/**
 * Turns a host's `send`, which streams library events, into a chat's state and callbacks: the
 * messages with their streaming reply, stop, retry, errors, a queue of follow-ups, approvals,
 * questions, prompt history and uploads. It keeps no backend of its own.
 */
export function useChatController(options: ChatControllerOptions): ChatController {
  const strings = useUiStrings();
  const { getNow } = useUiClock();
  const config = useLatest<ChatEngineConfig>({
    ...options,
    failureText: strings.chatReplyFailed,
    getNow,
  });
  const [engine] = useState(() =>
    createChatEngine(() => config.current, options.initialMessages ?? []),
  );
  useEffect(() => () => engine.dispose(), [engine]);
  const state = useStoreValue(engine.store);
  const props = useChatProps(engine, state, options);
  return {
    messages: state.messages,
    isPending: state.isPending,
    queue: state.queue,
    statusText: state.isPending ? state.messages.at(-1)?.statusText : undefined,
    send: engine.send,
    sendNow: engine.sendNow,
    steer: engine.steer,
    stop: engine.stop,
    retry: engine.retry,
    updateMessages: engine.updateMessages,
    resetConversation: engine.resetConversation,
    props,
  };
}
