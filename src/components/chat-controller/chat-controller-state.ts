// The controller's state, the host's functions it calls, and the mutable context its parts share.

import type { ValueStore } from '../../utils/value-store.js';
import type { ChatAttachmentData } from '../chat-attachment/chat-attachment.js';
import type { ChatMessageData, ChatPart, ChatTextToken } from '../chat-parts/chat-parts.js';
import type { ChatReaderResponse } from './chat-reply.js';
import type { ChatStreamEvent } from './chat-stream.js';

/** A message the reader sent while a reply was running, waiting to go out. */
export interface ChatQueuedMessage {
  id: string;
  text: string;
  /** The mentions and commands in `text`. */
  tokens?: readonly ChatTextToken[] | undefined;
  /** The files it carries. */
  attachments?: readonly ChatAttachmentData[] | undefined;
}

/** What `send` receives besides the conversation. */
export interface ChatSendContext {
  /** Aborts when the reader stops the reply. */
  signal: AbortSignal;
  /**
   * Resolves with the reader's response to the approval request or question `id` the stream
   * asked with `await: true`. Rejects when the reply stops or fails.
   */
  waitFor: (id: string) => Promise<ChatReaderResponse>;
}

/** Streams the assistant's reply to the conversation as library events. */
export type ChatSendFunction = (
  messages: readonly ChatMessageData[],
  context: ChatSendContext,
) => AsyncIterable<ChatStreamEvent>;

/** What `upload` receives besides the file. */
export interface ChatUploadContext {
  /** Aborts when the reader removes the file. */
  signal: AbortSignal;
  /** Reports the uploaded share, from 0 to 1. */
  onProgress: (progress: number) => void;
}

/** Uploads a file the reader attached and resolves with what the attachment gains, such as its `url`. */
export type ChatUploadFunction = (
  file: File,
  context: ChatUploadContext,
) => Promise<Partial<ChatAttachmentData>>;

/** The controller's state, which the hook renders. */
export interface ChatControllerState {
  messages: readonly ChatMessageData[];
  /** A reply is running. */
  isPending: boolean;
  queue: readonly ChatQueuedMessage[];
  /** The files the composer holds for the next message. */
  attachments: readonly ChatAttachmentData[];
  /** The tools the reader always allows, while the host does not control them. */
  alwaysAllowed: readonly string[];
}

/** The host's options as the controller reads them, latest first. */
export interface ChatEngineConfig {
  send: ChatSendFunction;
  currentUserId: string;
  assistantId: string;
  upload?: ChatUploadFunction | undefined;
  alwaysAllowed?: readonly string[] | undefined;
  onAlwaysAllowedChange?: ((tools: readonly string[]) => void) | undefined;
  /** The error a failed reply shows when the failure has no message. */
  failureText: string;
}

/** One running reply. */
export interface ChatRun {
  readonly replyId: string;
  readonly controller: AbortController;
  /** The responses `waitFor` hands over, by part id. */
  readonly waiters: Map<string, Deferred<ChatReaderResponse>>;
  /** The parts the stream asked with `await: true`. */
  readonly awaited: Set<string>;
  /** When each reasoning part and tool call started. */
  readonly starts: Map<string, number>;
  /** A response the stream did not await was given, so the reply continues once it ends. */
  needsContinuation: boolean;
  /** The reply with the events streamed since the last write to the conversation, if any. */
  pending: ChatMessageData | undefined;
  /** Cancels the scheduled write of `pending`. */
  cancelFlush: (() => void) | undefined;
}

/** A reply that stopped streaming, for now or for good. */
export interface ChatSettled {
  replyId: string;
  /** It ended by itself rather than stopping or failing. */
  isComplete: boolean;
  /** It holds responses it has not streamed on from yet. */
  needsContinuation: boolean;
}

/** The state the controller's modules share. */
export interface ChatEngineContext {
  readonly store: ValueStore<ChatControllerState>;
  readonly getConfig: () => ChatEngineConfig;
  readonly createId: () => string;
  readonly uploads: Map<string, { file: File; controller: AbortController }>;
  run: ChatRun | undefined;
  /** The reply the last run streamed into, and its parts before, when it continued one. */
  lastRun: { replyId: string; baseParts?: readonly ChatPart[] | undefined } | undefined;
  /**
   * Called when a run ends, or when the reader answers a reply that is not running, to continue
   * the reply or send the next queued message.
   */
  onSettle: (settled: ChatSettled) => void;
}

/** A promise with its settle functions. */
interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

/** A promise settled from outside; an unawaited rejection is not reported as unhandled. */
export function createDeferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => {};
  let reject: (reason: unknown) => void = () => {};
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  promise.catch(() => {});
  return { promise, resolve, reject };
}

/** Ids unique across sessions, so stored messages never clash with new ones. */
export function createIdFactory(): () => string {
  const prefix = `chat-${Math.random().toString(36).slice(2, 10)}`;
  let count = 0;
  return () => {
    count += 1;
    return `${prefix}-${count}`;
  };
}

/** Merges `patch` into the state. */
export function patchState(engine: ChatEngineContext, patch: Partial<ChatControllerState>) {
  engine.store.set({ ...engine.store.get(), ...patch });
}

/** Applies `update` to the message `id`, when the conversation still holds it. */
export function updateMessage(
  engine: ChatEngineContext,
  id: string,
  update: (message: ChatMessageData) => ChatMessageData,
) {
  const { messages } = engine.store.get();
  if (!messages.some((message) => message.id === id)) return;
  patchState(engine, {
    messages: messages.map((message) => (message.id === id ? update(message) : message)),
  });
}

/** The tools the reader always allows: the host's, else the controller's own. */
export function readAlwaysAllowed(engine: ChatEngineContext): readonly string[] {
  return engine.getConfig().alwaysAllowed ?? engine.store.get().alwaysAllowed;
}
