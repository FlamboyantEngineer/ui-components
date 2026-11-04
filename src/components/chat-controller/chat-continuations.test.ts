import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { push, renderController, settle } from '../../../test/chat-controller-fixtures.js';

const call = { type: 'tool-call', id: 'call', name: 'rename_recipe' } as const;
const request = { type: 'approval-request', id: 'call', scopeLabel: 'this conversation' } as const;
const approvals = [
  { action: 'onApprove', approval: { decision: 'approved' } },
  { action: 'onAlwaysAllow', approval: { decision: 'always' } },
  { action: 'automatic', approval: { isAutoApproved: true } },
] as const;

describe.each(approvals)('useChatController $action continuation', ({ action, approval }) => {
  it.each(['finish', 'exhaustion'] as const)(
    'UIC-CHAT-CONTROLLER-3.2 UIC-CHAT-CONTROLLER-3.3 keeps the approved call running across %s until its result',
    async (ending) => {
      const { result, at, send } = renderController({
        alwaysAllowed: action === 'automatic' ? ['rename_recipe'] : undefined,
      });
      act(() => result.current.send('Rename the recipe'));
      await push(at(), call, request);
      if (action !== 'automatic') act(() => result.current.props[action]('call'));
      const replyId = result.current.messages[1]?.id;
      const expected = {
        id: replyId,
        parts: [
          {
            id: 'call',
            status: 'running',
            approval: { scopeLabel: request.scopeLabel, ...approval },
          },
        ],
      };
      expect(send).toHaveBeenCalledTimes(1);
      expect(result.current.messages[1]).toMatchObject(expected);
      if (ending === 'finish') await push(at(), { type: 'finish' });
      else {
        at().end();
        await settle();
      }
      expect(send).toHaveBeenCalledTimes(2);
      expect(at().messages.at(-1)).toMatchObject({ ...expected, status: 'complete' });
      expect(result.current.messages[1]).toMatchObject({ ...expected, status: 'streaming' });
      expect(result.current.messages).toHaveLength(2);
      await push(at(), { type: 'tool-result', id: 'call', result: 'Renamed' }, { type: 'finish' });
      expect(result.current.messages[1]).toMatchObject({
        id: replyId,
        status: 'complete',
        parts: [{ id: 'call', status: 'succeeded', result: 'Renamed', approval }],
      });
      expect(result.current.messages).toHaveLength(2);
      expect(send).toHaveBeenCalledTimes(2);
    },
  );

  it.each(['stop', 'error'] as const)(
    'UIC-CHAT-CONTROLLER-1.7 UIC-CHAT-CONTROLLER-3.2 cancels approved unfinished work on %s before finish',
    async (ending) => {
      const { result, at, send } = renderController({
        alwaysAllowed: action === 'automatic' ? ['rename_recipe'] : undefined,
      });
      act(() => result.current.send('Rename the recipe'));
      await push(at(), call, request);
      if (action !== 'automatic') act(() => result.current.props[action]('call'));
      if (ending === 'stop') act(() => result.current.stop());
      else await push(at(), { type: 'error', message: 'Unavailable' });
      await settle();
      expect(result.current.messages[1]).toMatchObject({
        status: ending === 'stop' ? 'cancelled' : 'error',
        parts: [{ id: 'call', status: 'cancelled', approval }],
      });
      expect(send).toHaveBeenCalledTimes(1);
      expect(at().context.signal.aborted).toBe(true);
    },
  );
});

describe('useChatController continuation settlement', () => {
  it('UIC-CHAT-CONTROLLER-3.2 preserves approval while another request delays continuation and reports a failed result', async () => {
    const { result, at, send } = renderController();
    act(() => result.current.send('Rename the recipe'));
    await push(
      at(),
      call,
      request,
      { type: 'tool-call', id: 'other', name: 'delete_draft' },
      { type: 'approval-request', id: 'other' },
    );
    act(() => result.current.props.onApprove('call'));
    await push(at(), { type: 'finish' });
    expect(send).toHaveBeenCalledTimes(1);
    expect(result.current.messages[1]).toMatchObject({
      status: 'complete',
      parts: [
        { id: 'call', status: 'running' },
        { id: 'other', status: 'approval-requested' },
      ],
    });
    act(() => result.current.props.onDeny('other'));
    expect(send).toHaveBeenCalledTimes(2);
    expect(at().messages.at(-1)?.parts[0]).toMatchObject({ id: 'call', status: 'running' });
    await push(
      at(),
      { type: 'tool-result', id: 'call', error: 'Recipe is locked' },
      { type: 'finish' },
    );
    expect(result.current.messages[1]?.parts[0]).toMatchObject({
      id: 'call',
      status: 'failed',
      error: 'Recipe is locked',
      approval: { decision: 'approved' },
    });
    expect(result.current.messages).toHaveLength(2);
  });

  it('UIC-CHAT-CONTROLLER-1.7 UIC-CHAT-CONTROLLER-3.2 keeps a result received before settlement', async () => {
    const { result, at } = renderController();
    act(() => result.current.send('Rename the recipe'));
    await push(at(), call, request);
    act(() => result.current.props.onApprove('call'));
    await push(at(), { type: 'tool-result', id: 'call', result: 'Renamed' }, { type: 'finish' });
    expect(at().messages.at(-1)?.parts[0]).toMatchObject({
      status: 'succeeded',
      result: 'Renamed',
    });
    await push(at(), { type: 'finish' });
    expect(result.current.messages[1]?.parts[0]).toMatchObject({
      status: 'succeeded',
      result: 'Renamed',
    });
  });

  it.each(['stop', 'error'] as const)(
    'UIC-CHAT-CONTROLLER-1.7 UIC-CHAT-CONTROLLER-3.2 cancels approved work on %s during continuation',
    async (ending) => {
      const { result, at, send } = renderController({ alwaysAllowed: ['rename_recipe'] });
      act(() => result.current.send('Rename the recipe'));
      await push(at(), call, request, { type: 'finish' });
      expect(send).toHaveBeenCalledTimes(2);
      if (ending === 'stop') act(() => result.current.stop());
      else await push(at(), { type: 'error', message: 'Unavailable' });
      await settle();
      expect(result.current.messages[1]?.parts[0]).toMatchObject({ status: 'cancelled' });
      expect(send).toHaveBeenCalledTimes(2);
      expect(at().context.signal.aborted).toBe(true);
    },
  );
});
