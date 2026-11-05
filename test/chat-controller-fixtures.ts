// Shared fixtures for the chat controller's tests: streams a test drives event by event.

import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import {
  type ChatControllerOptions,
  type ChatSendContext,
  type ChatStreamEvent,
  useChatController,
} from '../src/components/chat-controller/chat-controller.js';
import type { ChatMessageData } from '../src/components/chat-parts/chat-parts.js';

/** A stream the test pushes events into and ends; it also ends when its signal aborts. */
export interface TestStream {
  messages: readonly ChatMessageData[];
  context: ChatSendContext;
  push: (...events: ChatStreamEvent[]) => void;
  end: () => void;
}

function createTestStream(
  messages: readonly ChatMessageData[],
  context: ChatSendContext,
): { stream: TestStream; events: AsyncIterable<ChatStreamEvent> } {
  const pending: ChatStreamEvent[] = [];
  let isDone = false;
  let wake = () => {};
  async function* iterate() {
    for (;;) {
      const next = pending.shift();
      if (next) yield next;
      else if (isDone) return;
      else await new Promise<void>((resolve) => (wake = resolve));
    }
  }
  const stream: TestStream = {
    messages,
    context,
    push: (...events) => {
      pending.push(...events);
      wake();
    },
    end: () => {
      isDone = true;
      wake();
    },
  };
  context.signal.addEventListener('abort', stream.end);
  return { stream, events: iterate() };
}

/** A `send` that opens a test stream per call, kept in `streams` in call order. */
export function createTestSend() {
  const streams: TestStream[] = [];
  const send = vi.fn((messages: readonly ChatMessageData[], context: ChatSendContext) => {
    const { stream, events } = createTestStream(messages, context);
    streams.push(stream);
    return events;
  });
  /** The stream of the `index`th call, the latest by default. */
  const at = (index = streams.length - 1): TestStream => {
    const stream = streams[index];
    if (!stream) throw new Error(`send was called ${streams.length} times`);
    return stream;
  };
  return { send, streams, at };
}

/** Lets pending promises and the events they stream settle, inside `act`. */
export function settle(): Promise<void> {
  return act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    // The controller writes streamed events to the conversation once per frame.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  });
}

/** Pushes events into a stream and lets them settle, through the next frame's write. */
export async function push(stream: TestStream, ...events: ChatStreamEvent[]): Promise<void> {
  stream.push(...events);
  await settle();
}

/** Renders the controller for the reader `ana` and the assistant `helper`. */
export function renderController(options: Partial<ChatControllerOptions> = {}) {
  const testSend = createTestSend();
  const view = renderHook(
    (props: Partial<ChatControllerOptions>) =>
      useChatController({
        send: testSend.send,
        currentUserId: 'ana',
        assistantId: 'helper',
        ...props,
      }),
    { initialProps: options },
  );
  return { ...view, ...testSend };
}

/** A message by `authorId` holding one complete text part. */
export function textMessage(id: string, authorId: string, text: string): ChatMessageData {
  return {
    id,
    authorId,
    createdAt: '2026-04-20T10:00:00.000Z',
    parts: [{ type: 'text', text }],
  };
}
