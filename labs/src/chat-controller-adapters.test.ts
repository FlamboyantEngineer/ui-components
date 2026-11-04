import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ChatStreamEvent } from '../../src/components/chat-controller/chat-controller.js';
import { renderController, settle } from '../../test/chat-controller-fixtures.js';
import {
  type AgUiEvent,
  fromAgUi,
  fromUiMessageStream,
  type UiMessageChunk,
} from './chat-controller-adapters.js';

async function* emit<T>(items: readonly T[]) {
  yield* items;
}

async function collect(events: AsyncIterable<ChatStreamEvent>) {
  const collected: ChatStreamEvent[] = [];
  for await (const event of events) collected.push(event);
  return collected;
}

describe('Stream adapter examples', () => {
  it('UIC-CHAT-CONTROLLER-5.2 maps an AG-UI-style stream onto the events', async () => {
    const events = await collect(
      fromAgUi(
        emit<AgUiEvent>([
          { type: 'RUN_STARTED' },
          { type: 'STEP_STARTED', stepName: 'Checking the weather…' },
          { type: 'THINKING_START' },
          { type: 'THINKING_TEXT_MESSAGE_CONTENT', delta: 'Porto?' },
          { type: 'THINKING_END' },
          { type: 'TOOL_CALL_START', toolCallId: 't1', toolCallName: 'get_weather' },
          { type: 'TOOL_CALL_ARGS', toolCallId: 't1', delta: '{"city":' },
          { type: 'TOOL_CALL_ARGS', toolCallId: 't1', delta: '"Porto"}' },
          { type: 'TOOL_CALL_END', toolCallId: 't1' },
          { type: 'TOOL_CALL_RESULT', toolCallId: 't1', content: 'Sunny' },
          { type: 'STEP_FINISHED', stepName: 'Checking the weather…' },
          { type: 'TEXT_MESSAGE_START' },
          { type: 'TEXT_MESSAGE_CONTENT', delta: 'Sunny.' },
          { type: 'TEXT_MESSAGE_END' },
          { type: 'RUN_ERROR', message: 'Lost the connection.' },
          { type: 'RUN_FINISHED' },
        ]),
      ),
    );
    expect(events).toEqual([
      { type: 'status', text: 'Checking the weather…' },
      { type: 'reasoning-delta', id: 'thinking-1', text: 'Porto?' },
      { type: 'reasoning-end', id: 'thinking-1' },
      { type: 'tool-call', id: 't1', name: 'get_weather' },
      { type: 'tool-call', id: 't1', name: 'get_weather', args: { city: 'Porto' } },
      { type: 'tool-result', id: 't1', result: 'Sunny' },
      { type: 'status', text: '' },
      { type: 'text-delta', text: 'Sunny.' },
      { type: 'error', message: 'Lost the connection.' },
      { type: 'finish' },
    ]);
  });

  it('UIC-CHAT-CONTROLLER-5.2 maps an AI SDK-style UI message stream onto the events', async () => {
    const events = await collect(
      fromUiMessageStream(
        emit<UiMessageChunk>([
          { type: 'start' },
          { type: 'reasoning-start', id: 'r' },
          { type: 'reasoning-delta', id: 'r', delta: 'Trains?' },
          { type: 'reasoning-end', id: 'r' },
          {
            type: 'tool-input-available',
            toolCallId: 'c',
            toolName: 'find_trains',
            input: { to: 'Porto' },
          },
          { type: 'tool-approval-request', approvalId: 'a', toolCallId: 'c' },
          { type: 'tool-output-available', toolCallId: 'c', output: ['8:05'] },
          { type: 'tool-output-error', toolCallId: 'c', errorText: 'Late' },
          { type: 'source-url', sourceId: 's', url: 'https://example.com/trains' },
          { type: 'text-delta', id: 't', delta: 'Take the 8:05 [1].' },
          { type: 'error', errorText: 'Busy.' },
          { type: 'finish' },
        ]),
      ),
    );
    expect(events).toEqual([
      { type: 'reasoning-delta', id: 'r', text: 'Trains?' },
      { type: 'reasoning-end', id: 'r' },
      { type: 'tool-call', id: 'c', name: 'find_trains', args: { to: 'Porto' } },
      { type: 'approval-request', id: 'c' },
      { type: 'tool-result', id: 'c', result: ['8:05'] },
      { type: 'tool-result', id: 'c', error: 'Late' },
      {
        type: 'source',
        source: { id: 's', title: 'https://example.com/trains', url: 'https://example.com/trains' },
      },
      { type: 'text-delta', text: 'Take the 8:05 [1].' },
      { type: 'error', message: 'Busy.' },
      { type: 'finish' },
    ]);
  });

  it('UIC-CHAT-CONTROLLER-5.2 streams an adapted reply through the controller', async () => {
    const { result } = renderController({
      send: () =>
        fromUiMessageStream(
          emit<UiMessageChunk>([
            { type: 'text-start', id: 't' },
            { type: 'text-delta', id: 't', delta: 'Take ' },
            { type: 'text-delta', id: 't', delta: 'the 8:05.' },
            { type: 'text-end', id: 't' },
            { type: 'finish' },
          ]),
        ),
    });
    act(() => result.current.send('Trains to Porto?'));
    await settle();
    expect(result.current.messages[1]).toMatchObject({
      status: 'complete',
      parts: [{ type: 'text', text: 'Take the 8:05.', status: 'complete' }],
    });
  });
});
