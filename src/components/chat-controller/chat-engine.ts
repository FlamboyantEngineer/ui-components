// The controller without React: the conversation's store and what the reader and the host do to it.

import { createValueStore } from '../../utils/value-store.js';
import type { ChatMessageData, ChatTextToken } from '../chat-parts/chat-parts.js';
import type { ChatQuestionAnswer } from '../chat-question/chat-question.js';
import {
  type ChatEngineConfig,
  type ChatEngineContext,
  type ChatQueuedMessage,
  type ChatSettled,
  createIdFactory,
  patchState,
  readAlwaysAllowed,
} from './chat-controller-state.js';
import {
  type ChatReaderResponse,
  createOutgoingMessage,
  isAwaitingReader,
  toDismissal,
} from './chat-reply.js';
import { abandonRun, endRun, flushRun, respond, startRun } from './chat-run.js';
import {
  abortUploads,
  attachFiles,
  hasUploadedFiles,
  removeAttachment,
  retryAttachment,
  takeUploadedFiles,
} from './chat-uploads.js';

/** An edit of the conversation as it stands, such as a reaction or an older page. */
export type ChatMessagesUpdate = (
  messages: readonly ChatMessageData[],
) => readonly ChatMessageData[];

/** Dismisses what the last message waits for: denies its approvals, dismisses its questions. */
function dismissWaiting(engine: ChatEngineContext) {
  if (engine.run) engine.run.needsContinuation = false;
  const last = engine.store.get().messages.at(-1);
  for (const part of last?.parts.filter(isAwaitingReader) ?? []) {
    if (part.id) respond(engine, { id: part.id, response: toDismissal(part), continues: false });
  }
}

/** Streams the reply to `conversation` into a new, empty reply after it. */
function startReply(engine: ChatEngineContext, conversation: readonly ChatMessageData[]) {
  const replyId = engine.createId();
  const reply: ChatMessageData = {
    id: replyId,
    authorId: engine.getConfig().assistantId,
    createdAt: engine.getConfig().getNow().toISOString(),
    parts: [],
    status: 'streaming',
  };
  patchState(engine, { messages: [...conversation, reply] });
  engine.lastRun = { replyId };
  startRun(engine, { replyId, messages: conversation });
}

/** Sends the reader's message and streams the reply to it. */
function startTurn(engine: ChatEngineContext, outgoing: ChatQueuedMessage) {
  dismissWaiting(engine);
  const author = {
    authorId: engine.getConfig().currentUserId,
    createdAt: engine.getConfig().getNow().toISOString(),
  };
  const sent = createOutgoingMessage(outgoing, author);
  startReply(engine, [...engine.store.get().messages, sent]);
}

/** Streams on into the last message, from the conversation as it stands with `reply` last. */
function continueReply(engine: ChatEngineContext, reply: ChatMessageData) {
  const { status: _status, error: _error, ...rest } = reply;
  const earlier = engine.store.get().messages.slice(0, -1);
  patchState(engine, { messages: [...earlier, { ...rest, status: 'streaming' }] });
  engine.lastRun = { replyId: reply.id, baseParts: reply.parts };
  startRun(engine, { replyId: reply.id, messages: [...earlier, { ...rest, status: 'complete' }] });
}

/** Sends the first queued message, or waits while the reader edits it. */
function sendNextQueued(engine: ChatEngineContext) {
  const [next, ...rest] = engine.store.get().queue;
  if (!next) return;
  if (next.id === engine.editingQueuedId) {
    engine.isHeldForEdit = true;
    return;
  }
  engine.isHeldForEdit = false;
  patchState(engine, { queue: rest });
  startTurn(engine, next);
}

/**
 * After a reply stopped streaming: a reply that ended by itself continues when the reader gave
 * responses it has not streamed on from, unless it still waits for the reader; otherwise the next
 * queued message goes out. A stopped or failed reply holds the queue.
 */
function settle(engine: ChatEngineContext, settled: ChatSettled) {
  if (!settled.isComplete || engine.run) return;
  const reply = engine.store.get().messages.at(-1);
  const isWaiting = reply?.parts.some(isAwaitingReader) ?? false;
  if (reply?.id === settled.replyId && settled.needsContinuation && !isWaiting) {
    continueReply(engine, reply);
  } else {
    sendNextQueued(engine);
  }
}

/** The reader's message with the uploaded files, which leave the composer; nothing when it is blank. */
function takeOutgoing(
  engine: ChatEngineContext,
  text: string,
  tokens: readonly ChatTextToken[] | undefined,
): ChatQueuedMessage | undefined {
  if (!text.trim() && !hasUploadedFiles(engine)) return undefined;
  const attachments = takeUploadedFiles(engine);
  return {
    id: engine.createId(),
    text,
    ...(tokens?.length ? { tokens } : {}),
    ...(attachments.length ? { attachments } : {}),
  };
}

function send(engine: ChatEngineContext, text: string, tokens?: readonly ChatTextToken[]) {
  const outgoing = takeOutgoing(engine, text, tokens);
  if (!outgoing) return;
  dismissWaiting(engine);
  const { queue } = engine.store.get();
  if (!engine.run && queue.length === 0) {
    startTurn(engine, outgoing);
    return;
  }
  patchState(engine, { queue: [...queue, outgoing] });
  if (!engine.run) sendNextQueued(engine);
}

/**
 * Stops the running reply, keeping what it streamed, and sends the reader's message at once, ahead
 * of the queue, which goes on once the new reply finishes.
 */
function sendNow(
  engine: ChatEngineContext,
  { text, tokens, replyTo }: { text: string; tokens?: readonly ChatTextToken[]; replyTo?: string },
) {
  const outgoing = takeOutgoing(engine, text, tokens);
  if (!outgoing) return;
  if (engine.run) endRun(engine, engine.run, { status: 'cancelled' });
  startTurn(engine, { ...outgoing, ...(replyTo === undefined ? {} : { replyTo }) });
}

/**
 * Takes the queued message `id` out of the queue and sends it at once as `sendNow` does: the running
 * reply stops, keeping what it streamed, and the rest of the queue goes on once the new reply
 * finishes.
 */
function steer(engine: ChatEngineContext, id: string) {
  const { queue } = engine.store.get();
  const outgoing = queue.find((entry) => entry.id === id);
  if (!outgoing || id === engine.editingQueuedId) return;
  patchState(engine, { queue: queue.filter((entry) => entry !== outgoing) });
  if (engine.run) endRun(engine, engine.run, { status: 'cancelled' });
  startTurn(engine, outgoing);
}

/**
 * Records the queued message the reader edits, or the edit's end, when the queue goes on from
 * where it waited for the edit, with the message's saved text.
 */
function setEditingQueued(engine: ChatEngineContext, id: string | undefined) {
  engine.editingQueuedId = id;
  if (id === undefined && engine.isHeldForEdit && !engine.run) sendNextQueued(engine);
}

/** Runs the last turn again after its reply failed: as it stood before, or from scratch. */
function retry(engine: ChatEngineContext) {
  const { messages } = engine.store.get();
  const reply = messages.at(-1);
  if (engine.run || reply?.status !== 'error') return;
  const baseParts = engine.lastRun?.replyId === reply.id ? engine.lastRun.baseParts : undefined;
  if (baseParts) {
    continueReply(engine, { ...reply, parts: baseParts });
    return;
  }
  startReply(engine, messages.slice(0, -1));
}

/**
 * Replaces the conversation and drops everything the old one owned, at once: the running reply is
 * abandoned (its signal aborts, its waiters reject, its late events are ignored and it sends nothing
 * queued), and the queue, the composer's files and their uploads and the retry record are cleared.
 */
function resetConversation(engine: ChatEngineContext, messages: readonly ChatMessageData[]) {
  if (engine.run) abandonRun(engine, engine.run);
  abortUploads(engine);
  engine.lastRun = undefined;
  engine.isHeldForEdit = false;
  patchState(engine, { messages, isPending: false, queue: [], attachments: [] });
}

/** Records Always allow for the call's tool and lets the call run. */
function alwaysAllow(engine: ChatEngineContext, callId: string) {
  const call = engine.store
    .get()
    .messages.flatMap((message) => message.parts)
    .findLast((part) => part.type === 'tool-call' && part.id === callId && isAwaitingReader(part));
  if (call?.type !== 'tool-call') return;
  const allowed = readAlwaysAllowed(engine);
  if (!allowed.includes(call.name)) {
    const next = [...allowed, call.name];
    if (engine.getConfig().alwaysAllowed === undefined) patchState(engine, { alwaysAllowed: next });
    engine.getConfig().onAlwaysAllowedChange?.(next);
  }
  respond(engine, {
    id: callId,
    response: { type: 'approval', decision: 'always' },
    continues: true,
  });
}

/** Creates the controller over `initialMessages`, reading the host's options through `getConfig`. */
export function createChatEngine(
  getConfig: () => ChatEngineConfig,
  initialMessages: readonly ChatMessageData[],
) {
  const engine: ChatEngineContext = {
    store: createValueStore({
      messages: initialMessages,
      isPending: false,
      queue: [],
      attachments: [],
      alwaysAllowed: [],
    }),
    getConfig,
    createId: createIdFactory(),
    uploads: new Map(),
    run: undefined,
    editingQueuedId: undefined,
    isHeldForEdit: false,
    lastRun: undefined,
    onSettle: (settled) => settle(engine, settled),
  };
  const answer = (id: string, response: ChatReaderResponse) => {
    respond(engine, { id, response, continues: true });
  };
  return {
    store: engine.store,
    send: (text: string, tokens?: readonly ChatTextToken[]) => send(engine, text, tokens),
    sendNow: (text: string, tokens?: readonly ChatTextToken[], replyTo?: string) =>
      sendNow(engine, { text, tokens, replyTo }),
    steer: (id: string) => steer(engine, id),
    stop: () => {
      if (engine.run) endRun(engine, engine.run, { status: 'cancelled' });
    },
    retry: () => retry(engine),
    updateMessages: (update: ChatMessagesUpdate) => {
      // The host's update sees, and keeps, what the running reply streamed so far.
      if (engine.run) flushRun(engine, engine.run);
      patchState(engine, { messages: update(engine.store.get().messages) });
    },
    resetConversation: (messages: readonly ChatMessageData[] = []) =>
      resetConversation(engine, messages),
    setQueue: (queue: readonly ChatQueuedMessage[]) => patchState(engine, { queue }),
    setEditingQueued: (id: string | undefined) => setEditingQueued(engine, id),
    approve: (id: string) => answer(id, { type: 'approval', decision: 'approved' }),
    deny: (id: string, reason?: string) =>
      answer(id, { type: 'approval', decision: 'denied', reason }),
    alwaysAllow: (id: string) => alwaysAllow(engine, id),
    answerQuestion: (id: string, answers: ChatQuestionAnswer[]) =>
      answer(id, { type: 'question', status: 'answered', answers }),
    dismissQuestion: (id: string) =>
      answer(id, { type: 'question', status: 'dismissed', answers: [] }),
    attach: (files: File[]) => attachFiles(engine, files),
    removeAttachment: (id: string) => removeAttachment(engine, id),
    retryAttachment: (id: string) => retryAttachment(engine, id),
    /** Stops the running reply and the uploads, as when the hook's component unmounts. */
    dispose: () => {
      if (engine.run) endRun(engine, engine.run, { status: 'cancelled' });
      abortUploads(engine);
    },
  };
}

/** The controller `createChatEngine` returns. */
export type ChatEngine = ReturnType<typeof createChatEngine>;
