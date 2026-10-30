// A running reply: streaming `send`'s events into the reply, waiting for the reader, and ending.

import type { ChatMessageData } from '../chat-parts/chat-parts.js';
import { toErrorMessage } from '../../utils/to-error-message.js';
import {
  createDeferred,
  patchState,
  readAlwaysAllowed,
  updateMessage,
  type ChatEngineContext,
  type ChatRun,
} from './chat-controller-state.js';
import { findAwaitingMessage, recordResponse, type ChatReaderResponse } from './chat-reply.js';
import { reduceChatStream, type ChatStreamContext, type ChatStreamEvent } from './chat-stream.js';
import { endChatReply, type ChatReplyOutcome } from './chat-stream-parts.js';

/** The waiter that hands the response to the part `id` over to `waitFor`. */
function waiterFor(run: ChatRun, id: string) {
  let waiter = run.waiters.get(id);
  if (!waiter) {
    waiter = createDeferred<ChatReaderResponse>();
    run.waiters.set(id, waiter);
  }
  return waiter;
}

function waitFor(run: ChatRun, id: string): Promise<ChatReaderResponse> {
  const { signal } = run.controller;
  return signal.aborted ? Promise.reject(signal.reason) : waiterFor(run, id).promise;
}

/** The reducer's context at `now`: the tools always allowed, and the run's clock. */
function readContext(engine: ChatEngineContext, run: ChatRun, now: number): ChatStreamContext {
  return {
    alwaysAllowed: readAlwaysAllowed(engine),
    getElapsed: (id) => {
      const start = run.starts.get(id);
      return start === undefined ? undefined : now - start;
    },
  };
}

/** After an approval request or question: hands an automatic approval over, or notes an await. */
function noteRequest(
  engine: ChatEngineContext,
  run: ChatRun,
  event: Extract<ChatStreamEvent, { type: 'approval-request' | 'question' }>,
) {
  const reply = engine.store.get().messages.find((message) => message.id === run.replyId);
  const part = reply?.parts.find((entry) => entry.type === 'tool-call' && entry.id === event.id);
  const isAutoApproved = part?.type === 'tool-call' && part.approval?.isAutoApproved === true;
  if (isAutoApproved && event.await) {
    waiterFor(run, event.id).resolve({ type: 'approval', decision: 'approved', isAutoApproved });
  } else if (isAutoApproved) {
    run.needsContinuation = true;
  } else if (event.await) {
    run.awaited.add(event.id);
  }
}

function applyEvent(engine: ChatEngineContext, run: ChatRun, event: ChatStreamEvent) {
  const now = Date.now();
  if (
    (event.type === 'reasoning-delta' || event.type === 'tool-call') &&
    !run.starts.has(event.id)
  ) {
    run.starts.set(event.id, now);
  }
  const context = readContext(engine, run, now);
  updateMessage(engine, run.replyId, (message) => reduceChatStream(message, event, context));
  if (event.type === 'approval-request' || event.type === 'question') {
    noteRequest(engine, run, event);
  }
}

/**
 * Ends the run once: settles the reply, rejects the waiters still open and, for a stopped or
 * failed reply, aborts the signal. Then the controller continues the reply or sends the next
 * queued message.
 */
export function endRun(engine: ChatEngineContext, run: ChatRun, outcome: ChatReplyOutcome) {
  if (engine.run !== run) return;
  engine.run = undefined;
  const isComplete = outcome.status === 'complete';
  if (!isComplete) run.controller.abort();
  const reason = run.controller.signal.reason ?? new DOMException('The reply ended.', 'AbortError');
  for (const waiter of run.waiters.values()) waiter.reject(reason);
  const context = readContext(engine, run, Date.now());
  updateMessage(engine, run.replyId, (message) => endChatReply(message, outcome, context));
  patchState(engine, { isPending: false });
  engine.onSettle({ replyId: run.replyId, isComplete, needsContinuation: run.needsContinuation });
}

/**
 * Drops the run without settling it, as when the conversation is replaced: its signal aborts and its
 * waiters reject, and nothing it streams or settles later reaches the controller.
 */
export function abandonRun(engine: ChatEngineContext, run: ChatRun) {
  if (engine.run !== run) return;
  engine.run = undefined;
  run.controller.abort();
  for (const waiter of run.waiters.values()) waiter.reject(run.controller.signal.reason);
}

async function streamRun(
  engine: ChatEngineContext,
  run: ChatRun,
  messages: readonly ChatMessageData[],
) {
  const { send, failureText } = engine.getConfig();
  try {
    const events = send(messages, {
      signal: run.controller.signal,
      waitFor: (id) => waitFor(run, id),
    });
    for await (const event of events) {
      if (engine.run !== run) break;
      if (event.type === 'error') {
        endRun(engine, run, { status: 'error', error: event.message || failureText });
        break;
      }
      if (event.type === 'finish') break;
      applyEvent(engine, run, event);
    }
    endRun(engine, run, { status: 'complete' });
  } catch (error) {
    endRun(engine, run, { status: 'error', error: toErrorMessage(error, failureText) });
  }
}

/** Streams `send`'s reply to `messages` into the conversation's reply `replyId`. */
export function startRun(
  engine: ChatEngineContext,
  plan: { replyId: string; messages: readonly ChatMessageData[] },
) {
  const run: ChatRun = {
    replyId: plan.replyId,
    controller: new AbortController(),
    waiters: new Map(),
    awaited: new Set(),
    starts: new Map(),
    needsContinuation: false,
  };
  engine.run = run;
  patchState(engine, { isPending: true });
  void streamRun(engine, run, plan.messages);
}

/**
 * Records the reader's response on the part `id` while it waits for them. An awaited part hands
 * the response to `waitFor`; any other continues its reply (`continues`) once nothing else waits,
 * or once the running reply ends.
 */
export function respond(
  engine: ChatEngineContext,
  answer: { id: string; response: ChatReaderResponse; continues: boolean },
) {
  const { id, response, continues } = answer;
  const { messages } = engine.store.get();
  const index = findAwaitingMessage(messages, id);
  const message = messages[index];
  if (!message) return;
  updateMessage(engine, message.id, (current) => recordResponse(current, id, response));
  const { run } = engine;
  if (run && (run.awaited.has(id) || run.waiters.has(id))) {
    waiterFor(run, id).resolve(response);
  } else if (run?.replyId === message.id) {
    run.needsContinuation ||= continues;
  } else if (!run && continues) {
    engine.onSettle({ replyId: message.id, isComplete: true, needsContinuation: true });
  }
}
