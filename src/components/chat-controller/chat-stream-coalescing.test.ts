import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createTestSend, settle, textMessage } from '../../../test/chat-controller-fixtures.js';
import { useChatController } from './chat-controller.js';

/** Lets pushed events reach the controller, without waiting for the next frame. */
const deliver = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

const deltas = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ type: 'text-delta' as const, text: `${index} ` }));

/** The controller, with how many times it rendered. */
function renderCounted() {
  const testSend = createTestSend();
  const renders = { count: 0 };
  const view = renderHook(() => {
    renders.count += 1;
    return useChatController({ send: testSend.send, currentUserId: 'ana', assistantId: 'helper' });
  });
  return { ...view, ...testSend, renders };
}

describe('useChatController stream coalescing', () => {
  it('UIC-CHAT-CONTROLLER-2.1 writes a burst of deltas to the conversation once, on the next frame', async () => {
    const { result, at, renders } = renderCounted();
    act(() => result.current.send('Soak the beans?'));
    const before = result.current.messages;
    const rendersBefore = renders.count;
    at().push(...deltas(20));
    await deliver();
    expect(result.current.messages).toBe(before);
    await settle();
    expect(renders.count - rendersBefore).toBe(1);
    expect(result.current.messages[1]?.parts).toEqual([
      {
        type: 'text',
        text: deltas(20)
          .map(({ text }) => text)
          .join(''),
        status: 'streaming',
      },
    ]);
  });

  it('UIC-CHAT-CONTROLLER-2.1 writes an approval request and the end of the reply at once', async () => {
    const { result, at } = renderCounted();
    act(() => result.current.send('Clean up'));
    at().push(...deltas(3), { type: 'tool-call', id: 'call-1', name: 'delete_draft' });
    at().push({ type: 'approval-request', id: 'call-1', await: true });
    await deliver();
    expect(result.current.messages[1]?.parts.map((part) => part.type)).toEqual([
      'text',
      'tool-call',
    ]);
    at().push(...deltas(2), { type: 'finish' });
    await deliver();
    expect(result.current.isPending).toBe(false);
    expect(result.current.messages[1]).toMatchObject({ status: 'complete' });
  });

  it('UIC-CHAT-CONTROLLER-2.1 shows the host an update with what streamed so far', async () => {
    const { result, at } = renderCounted();
    act(() => result.current.send('Soak the beans?'));
    at().push(...deltas(2));
    await deliver();
    act(() =>
      result.current.updateMessages((messages) => [textMessage('m0', 'ben', 'Older'), ...messages]),
    );
    expect(result.current.messages.map(({ parts }) => parts[0])).toMatchObject([
      { text: 'Older' },
      { text: 'Soak the beans?' },
      { text: '0 1 ' },
    ]);
    await settle();
    expect(result.current.messages[2]?.parts[0]).toMatchObject({ text: '0 1 ' });
  });
});
