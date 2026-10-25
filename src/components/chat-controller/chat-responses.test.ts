import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  push,
  renderController,
  settle,
  type TestStream,
} from '../../../test/chat-controller-fixtures.js';
import type { ChatReaderResponse } from './chat-controller.js';

const draftCall = { type: 'tool-call', id: 'call-1', name: 'delete_draft' } as const;
const questions = [
  {
    id: 'q1',
    question: 'Which beans?',
    selectionMode: 'single',
    options: [{ id: 'black', label: 'Black beans' }],
  },
] as const;
const answers = [{ questionId: 'q1', optionIds: ['black'] }];

/** Calls the stream's `waitFor(id)` and records what it settles with. */
function track(stream: TestStream, id: string) {
  const { waitFor: waitForReader } = stream.context;
  const outcome: { value?: ChatReaderResponse; error?: unknown } = {};
  waitForReader(id).then(
    (value) => (outcome.value = value),
    (error: unknown) => (outcome.error = error),
  );
  return outcome;
}

describe('useChatController responses', () => {
  it('UIC-CHAT-CONTROLLER-3.1 hands an awaited approval to waitFor and keeps streaming', async () => {
    const { result, at, send } = renderController();
    act(() => result.current.send('Clean up'));
    await push(at(), draftCall, { type: 'approval-request', id: 'call-1', await: true });
    const outcome = track(at(), 'call-1');
    expect(result.current.isPending).toBe(true);
    act(() => result.current.props.onApprove('call-1'));
    await settle();
    expect(outcome.value).toEqual({ type: 'approval', decision: 'approved' });
    expect(result.current.messages[1]?.parts[0]).toMatchObject({
      status: 'running',
      approval: { decision: 'approved' },
    });
    await push(at(), { type: 'tool-result', id: 'call-1', result: 'Deleted' }, { type: 'finish' });
    expect(result.current.messages[1]?.parts[0]).toMatchObject({ status: 'succeeded' });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('UIC-CHAT-CONTROLLER-3.1 hands a denial with its reason and answers to waitFor', async () => {
    const { result, at } = renderController();
    act(() => result.current.send('Clean up'));
    await push(
      at(),
      draftCall,
      { type: 'approval-request', id: 'call-1', await: true },
      { type: 'question', id: 'card', questions, await: true },
    );
    const denial = track(at(), 'call-1');
    const reply = track(at(), 'card');
    act(() => result.current.props.onDeny('call-1', 'Keep it'));
    act(() => result.current.props.onAnswerQuestion('card', answers));
    await settle();
    expect(denial.value).toEqual({ type: 'approval', decision: 'denied', reason: 'Keep it' });
    expect(reply.value).toEqual({ type: 'question', status: 'answered', answers });
    expect(result.current.messages[1]?.parts).toMatchObject([
      { status: 'denied', approval: { decision: 'denied', reason: 'Keep it' } },
      { status: 'answered', answers },
    ]);
  });

  it('UIC-CHAT-CONTROLLER-3.1 rejects waitFor when the reader stops the reply', async () => {
    const { result, at } = renderController();
    act(() => result.current.send('Clean up'));
    await push(at(), { type: 'question', id: 'card', questions, await: true });
    const stream = at();
    const outcome = track(stream, 'card');
    act(() => result.current.stop());
    await settle();
    expect(outcome.error).toMatchObject({ name: 'AbortError' });
    expect(result.current.messages[1]?.parts[0]).toMatchObject({ status: 'dismissed' });
    const { waitFor: waitForReader } = stream.context;
    await expect(waitForReader('card')).rejects.toThrow();
  });

  it('UIC-CHAT-CONTROLLER-3.2 sends again with the decision once the turn has ended', async () => {
    const { result, at, send } = renderController();
    act(() => result.current.send('Clean up'));
    await push(
      at(),
      draftCall,
      { type: 'approval-request', id: 'call-1' },
      { type: 'tool-call', id: 'call-2', name: 'delete_draft' },
      { type: 'approval-request', id: 'call-2' },
      { type: 'finish' },
    );
    expect(result.current.isPending).toBe(false);
    const replyId = result.current.messages[1]?.id;
    act(() => result.current.props.onApprove('call-1'));
    expect(send).toHaveBeenCalledTimes(1);
    act(() => result.current.props.onDeny('call-2'));
    expect(send).toHaveBeenCalledTimes(2);
    expect(result.current.isPending).toBe(true);
    expect(at().messages.at(-1)).toMatchObject({
      id: replyId,
      status: 'complete',
      parts: [
        { id: 'call-1', status: 'running', approval: { decision: 'approved' } },
        { id: 'call-2', status: 'denied', approval: { decision: 'denied' } },
      ],
    });
    await push(at(), { type: 'tool-result', id: 'call-1', result: 'Deleted' }, { type: 'finish' });
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toMatchObject({
      id: replyId,
      status: 'complete',
      parts: [{ status: 'succeeded' }, { status: 'denied' }],
    });
  });

  it('UIC-CHAT-CONTROLLER-3.2 sends again once the reader answers or dismisses a question', async () => {
    const { result, at, send } = renderController();
    act(() => result.current.send('Plan dinner'));
    await push(at(), { type: 'question', id: 'card', questions }, { type: 'finish' });
    act(() => result.current.props.onAnswerQuestion('card', answers));
    expect(send).toHaveBeenCalledTimes(2);
    expect(at().messages.at(-1)?.parts[0]).toMatchObject({ status: 'answered', answers });
    await push(at(), { type: 'question', id: 'card-2', questions }, { type: 'finish' });
    act(() => result.current.props.onDismissQuestion('card-2'));
    expect(send).toHaveBeenCalledTimes(3);
    expect(at().messages.at(-1)?.parts[1]).toMatchObject({ status: 'dismissed' });
  });

  it('UIC-CHAT-CONTROLLER-3.2 continues after the reply when the reader answers while it runs', async () => {
    const { result, at, send } = renderController();
    act(() => result.current.send('Plan dinner'));
    await push(at(), { type: 'question', id: 'card', questions });
    act(() => result.current.props.onAnswerQuestion('card', answers));
    expect(send).toHaveBeenCalledTimes(1);
    await push(at(), { type: 'finish' });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('UIC-CHAT-CONTROLLER-3.3 records Always allow and approves the tool later without asking', async () => {
    const onAlwaysAllowedChange = vi.fn();
    const { result, at, send } = renderController({ onAlwaysAllowedChange });
    act(() => result.current.send('Clean up'));
    await push(at(), draftCall, {
      type: 'approval-request',
      id: 'call-1',
      scopeLabel: 'this chat',
      await: true,
    });
    const first = track(at(), 'call-1');
    act(() => result.current.props.onAlwaysAllow('call-1'));
    await settle();
    expect(onAlwaysAllowedChange).toHaveBeenCalledWith(['delete_draft']);
    expect(first.value).toEqual({ type: 'approval', decision: 'always' });
    expect(result.current.messages[1]?.parts[0]).toMatchObject({
      status: 'running',
      approval: { scopeLabel: 'this chat', decision: 'always' },
    });
    await push(
      at(),
      { type: 'tool-call', id: 'call-2', name: 'delete_draft' },
      { type: 'approval-request', id: 'call-2', await: true },
    );
    const second = track(at(), 'call-2');
    await settle();
    expect(second.value).toEqual({ type: 'approval', decision: 'approved', isAutoApproved: true });
    expect(result.current.messages[1]?.parts[1]).toMatchObject({
      status: 'running',
      approval: { isAutoApproved: true },
    });
    await push(
      at(),
      { type: 'tool-call', id: 'call-3', name: 'delete_draft' },
      { type: 'approval-request', id: 'call-3' },
      { type: 'finish' },
    );
    expect(send).toHaveBeenCalledTimes(2);
    expect(onAlwaysAllowedChange).toHaveBeenCalledTimes(1);
  });

  it('UIC-CHAT-CONTROLLER-3.3 reads the tools always allowed from the host when controlled', async () => {
    const onAlwaysAllowedChange = vi.fn();
    const { result, at, rerender } = renderController({ alwaysAllowed: [], onAlwaysAllowedChange });
    act(() => result.current.send('Clean up'));
    await push(at(), draftCall, { type: 'approval-request', id: 'call-1' }, { type: 'finish' });
    act(() => result.current.props.onAlwaysAllow('call-1'));
    expect(onAlwaysAllowedChange).toHaveBeenCalledWith(['delete_draft']);
    await push(
      at(),
      { type: 'tool-call', id: 'call-2', name: 'delete_draft' },
      { type: 'approval-request', id: 'call-2' },
    );
    expect(result.current.messages[1]?.parts[1]).toMatchObject({ status: 'approval-requested' });
    rerender({ alwaysAllowed: ['delete_draft'], onAlwaysAllowedChange });
    await push(
      at(),
      { type: 'tool-call', id: 'call-3', name: 'delete_draft' },
      { type: 'approval-request', id: 'call-3' },
    );
    expect(result.current.messages[1]?.parts[2]).toMatchObject({
      status: 'running',
      approval: { isAutoApproved: true },
    });
  });

  it('UIC-CHAT-CONTROLLER-3.4 dismisses what waits for the reader when they send a message', async () => {
    const { result, at, send } = renderController();
    act(() => result.current.send('Plan dinner'));
    await push(
      at(),
      { type: 'question', id: 'card', questions },
      draftCall,
      { type: 'approval-request', id: 'call-1' },
      { type: 'finish' },
    );
    act(() => result.current.send('Never mind, just soup.'));
    expect(send).toHaveBeenCalledTimes(2);
    expect(result.current.messages[1]?.parts).toMatchObject([
      { status: 'dismissed' },
      { status: 'denied', approval: { decision: 'denied' } },
    ]);
    expect(at().messages.at(-1)?.parts).toEqual([{ type: 'text', text: 'Never mind, just soup.' }]);
  });

  it('UIC-CHAT-CONTROLLER-3.4 dismisses an awaited question and queues the message', async () => {
    const { result, at } = renderController();
    act(() => result.current.send('Plan dinner'));
    await push(at(), { type: 'question', id: 'card', questions, await: true });
    const outcome = track(at(), 'card');
    act(() => result.current.send('Just soup.'));
    await settle();
    expect(outcome.value).toEqual({ type: 'question', status: 'dismissed', answers: [] });
    expect(result.current.queue.map((entry) => entry.text)).toEqual(['Just soup.']);
  });

  it('UIC-CHAT-CONTROLLER-2.4 retries a failed continuation from the reply as it stood', async () => {
    const { result, at, send } = renderController();
    act(() => result.current.send('Clean up'));
    await push(at(), draftCall, { type: 'approval-request', id: 'call-1' }, { type: 'finish' });
    act(() => result.current.props.onApprove('call-1'));
    await push(at(), { type: 'text-delta', text: 'Deleting' }, { type: 'error', message: 'Busy.' });
    expect(result.current.messages[1]).toMatchObject({ status: 'error', error: 'Busy.' });
    act(() => result.current.retry());
    expect(send).toHaveBeenCalledTimes(3);
    expect(at().messages.at(-1)?.parts).toEqual(at(1).messages.at(-1)?.parts);
    expect(result.current.messages[1]).toMatchObject({ status: 'streaming' });
    expect(result.current.messages[1]?.parts).toHaveLength(1);
  });
});
