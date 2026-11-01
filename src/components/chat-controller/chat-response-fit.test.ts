import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
  const outcome: { value?: ChatReaderResponse } = {};
  void stream.context.waitFor(id).then((value) => (outcome.value = value));
  return outcome;
}

describe('useChatController responses that do not fit', () => {
  it('UIC-CHAT-CONTROLLER-3.1 leaves an awaited question waiting when it receives a decision', async () => {
    const { result, at } = renderController();
    act(() => result.current.send('Plan dinner'));
    await push(at(), { type: 'question', id: 'card', questions, await: true });
    const outcome = track(at(), 'card');
    act(() => result.current.props.onApprove('card'));
    act(() => result.current.props.onDeny('card', 'No'));
    await settle();
    expect(outcome.value).toBeUndefined();
    expect(result.current.messages[1]?.parts[0]).toMatchObject({ status: 'pending' });
    act(() => result.current.props.onAnswerQuestion('card', answers));
    await settle();
    expect(outcome.value).toEqual({ type: 'question', status: 'answered', answers });
    act(() => result.current.props.onDismissQuestion('card'));
    await settle();
    expect(result.current.messages[1]?.parts[0]).toMatchObject({ status: 'answered', answers });
  });

  it('UIC-CHAT-CONTROLLER-3.1 leaves an awaited approval waiting when it receives answers', async () => {
    const { result, at } = renderController();
    act(() => result.current.send('Clean up'));
    await push(at(), draftCall, { type: 'approval-request', id: 'call-1', await: true });
    const outcome = track(at(), 'call-1');
    act(() => result.current.props.onAnswerQuestion('call-1', []));
    act(() => result.current.props.onDismissQuestion('call-1'));
    await settle();
    expect(outcome.value).toBeUndefined();
    expect(result.current.messages[1]?.parts[0]).toMatchObject({ status: 'approval-requested' });
    act(() => result.current.props.onApprove('call-1'));
    await settle();
    expect(outcome.value).toEqual({ type: 'approval', decision: 'approved' });
  });

  it('UIC-CHAT-CONTROLLER-3.2 continues the reply only for a response that fits its part', async () => {
    const { result, at, send } = renderController();
    act(() => result.current.send('Plan dinner'));
    await push(
      at(),
      { type: 'question', id: 'card', questions },
      draftCall,
      { type: 'approval-request', id: 'call-1' },
      { type: 'finish' },
    );
    act(() => result.current.props.onApprove('card'));
    act(() => result.current.props.onAnswerQuestion('call-1', answers));
    expect(send).toHaveBeenCalledTimes(1);
    expect(result.current.messages[1]?.parts).toMatchObject([
      { status: 'pending' },
      { status: 'approval-requested' },
    ]);
    act(() => result.current.props.onAnswerQuestion('card', answers));
    expect(send).toHaveBeenCalledTimes(1);
    act(() => result.current.props.onApprove('call-1'));
    expect(send).toHaveBeenCalledTimes(2);
    expect(at().messages.at(-1)?.parts).toMatchObject([
      { status: 'answered', answers },
      { status: 'running', approval: { decision: 'approved' } },
    ]);
  });
});
