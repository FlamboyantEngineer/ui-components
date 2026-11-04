import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  push,
  renderController,
  settle,
  textMessage,
} from '../../../test/chat-controller-fixtures.js';
import { requireDefined } from '../../utils/require-defined.js';
import { ChatToolCall } from '../chat-tool-call/chat-tool-call.js';
import { ChatMessage, ChatTranscript } from '../chat-transcript/chat-transcript.js';
import {
  type ChatSendContext,
  type ChatSendFunction,
  type ChatStreamEvent,
  useChatController,
} from './chat-controller.js';

afterEach(() => vi.useRealTimers());

describe('useChatController runs', () => {
  it('UIC-CHAT-CONTROLLER-2.1 sends the reader message and streams the reply into it', async () => {
    const { result, at, send } = renderController();
    const tokens = [{ start: 0, end: 5, kind: 'mention', id: 'ben', label: 'Ben' }] as const;
    act(() => result.current.send('@Ben soak the beans?', tokens));
    expect(result.current.isPending).toBe(true);
    const [sent, reply] = result.current.messages;
    expect(sent).toMatchObject({
      authorId: 'ana',
      parts: [{ type: 'text', text: '@Ben soak the beans?', tokens }],
    });
    expect(reply).toMatchObject({ authorId: 'helper', parts: [], status: 'streaming' });
    expect(send).toHaveBeenCalledTimes(1);
    expect(at().messages).toEqual([sent]);
    expect(at().context.signal.aborted).toBe(false);

    await push(
      at(),
      { type: 'text-delta', text: 'Yes, ' },
      { type: 'text-delta', text: 'overnight.' },
    );
    expect(result.current.messages[1]?.parts).toEqual([
      { type: 'text', text: 'Yes, overnight.', status: 'streaming' },
    ]);
    await push(at(), { type: 'finish' });
    expect(result.current.isPending).toBe(false);
    expect(result.current.messages[1]).toMatchObject({
      status: 'complete',
      parts: [{ type: 'text', text: 'Yes, overnight.', status: 'complete' }],
    });
  });

  it('UIC-CHAT-CONTROLLER-2.1 completes a reply whose stream ends without finish and ignores blank text', async () => {
    const { result, at, send } = renderController();
    act(() => result.current.send('   '));
    expect(send).not.toHaveBeenCalled();
    act(() => result.current.send('Hello'));
    at().end();
    await settle();
    expect(result.current.isPending).toBe(false);
    expect(result.current.messages[1]?.status).toBe('complete');
  });

  it.each(['resolves', 'throws'])(
    'UIC-CHAT-CONTROLLER-2.1 completes the reply at finish while the stream cleanup %s later',
    async (cleanupOutcome) => {
      let endCleanup: () => void = () => {};
      const cleanup = new Promise<void>((resolve) => (endCleanup = resolve));
      const finished: string[] = [];
      // A stream whose cleanup (`return`, as a generator's finally runs it) takes time, then
      // settles or fails.
      const send: ChatSendFunction = () => {
        const events: ChatStreamEvent[] = [
          { type: 'text-delta', text: 'Complete.' },
          { type: 'finish' },
        ];
        return {
          [Symbol.asyncIterator]: () => ({
            next: () => {
              const value = events.shift();
              return Promise.resolve(
                value ? { value, done: false as const } : { value: undefined, done: true as const },
              );
            },
            return: async () => {
              await cleanup;
              finished.push('cleaned up');
              if (cleanupOutcome === 'throws') throw new Error('Cleanup failed');
              return { value: undefined, done: true as const };
            },
          }),
        };
      };
      const { result } = renderController({ send });
      act(() => result.current.send('Plan dinner'));
      await settle();
      // The cleanup is still running, and the reply is already complete.
      expect(finished).toEqual([]);
      expect(result.current.isPending).toBe(false);
      expect(result.current.messages[1]).toMatchObject({
        status: 'complete',
        parts: [{ type: 'text', text: 'Complete.', status: 'complete' }],
      });
      // A message sent now starts a new reply at once.
      act(() => result.current.send('And dessert?'));
      expect(result.current.isPending).toBe(true);
      endCleanup();
      await settle();
      // Both replies' cleanups ran; a failed one turned neither reply into an error.
      expect(finished).toEqual(['cleaned up', 'cleaned up']);
      for (const index of [1, 3]) {
        expect(result.current.messages[index]).toMatchObject({ status: 'complete' });
        expect(result.current.messages[index]).not.toHaveProperty('error');
      }
      expect(result.current.isPending).toBe(false);
    },
  );

  it('UIC-CHAT-CONTROLLER-2.2 shows the status line while the reply runs', async () => {
    const { result, at } = renderController();
    act(() => result.current.send('Plan dinner'));
    await push(at(), { type: 'status', text: 'Searching recipes…' });
    expect(result.current.statusText).toBe('Searching recipes…');
    expect(result.current.messages[1]?.statusText).toBe('Searching recipes…');
    await push(at(), { type: 'finish' });
    expect(result.current.statusText).toBeUndefined();
    expect(result.current.messages[1]?.statusText).toBeUndefined();
  });

  it('UIC-CHAT-CONTROLLER-2.3 stops the reply, keeping its partial text', async () => {
    const { result, at } = renderController();
    act(() => result.current.send('Plan dinner'));
    await push(
      at(),
      { type: 'text-delta', text: 'First, soak' },
      { type: 'tool-call', id: 'call-1', name: 'search_recipes' },
    );
    const stream = at();
    act(() => result.current.stop());
    expect(stream.context.signal.aborted).toBe(true);
    expect(result.current.isPending).toBe(false);
    expect(result.current.messages[1]).toMatchObject({
      status: 'cancelled',
      parts: [
        { type: 'text', text: 'First, soak', status: 'complete' },
        { type: 'tool-call', status: 'cancelled' },
      ],
    });
    stream.push({ type: 'text-delta', text: ' the beans.' });
    await settle();
    expect(result.current.messages[1]?.parts[0]).toMatchObject({ text: 'First, soak' });
  });

  it('UIC-CHAT-CONTROLLER-2.4 marks the reply failed with the error event message', async () => {
    const { result, at } = renderController();
    act(() => result.current.send('Plan dinner'));
    await push(at(), { type: 'text-delta', text: 'Sure' }, { type: 'error', message: 'Busy.' });
    expect(result.current.isPending).toBe(false);
    expect(result.current.messages[1]).toMatchObject({ status: 'error', error: 'Busy.' });
  });

  it('UIC-CHAT-CONTROLLER-2.4 marks the reply failed when send throws', async () => {
    const failing: ChatSendFunction = async function* () {
      yield { type: 'text-delta', text: 'Sure' };
      throw new Error('Network down.');
    };
    const { result } = renderController({ send: failing });
    act(() => result.current.send('Plan dinner'));
    await settle();
    expect(result.current.messages[1]).toMatchObject({ status: 'error', error: 'Network down.' });

    const silent: ChatSendFunction = () => {
      const thrown: unknown = 'nope';
      throw thrown;
    };
    const view = renderController({ send: silent });
    act(() => view.result.current.send('Plan dinner'));
    await settle();
    expect(view.result.current.messages[1]).toMatchObject({
      status: 'error',
      error: 'The reply could not be finished.',
    });
  });

  it('UIC-CHAT-CONTROLLER-2.4 retries the failed turn with a fresh reply', async () => {
    const { result, at, send } = renderController();
    act(() => result.current.send('Plan dinner'));
    await push(at(), { type: 'error', message: 'Busy.' });
    const failedId = result.current.messages[1]?.id ?? '';
    act(() => result.current.props.onRetry('another-message'));
    expect(send).toHaveBeenCalledTimes(1);
    act(() => result.current.props.onRetry(failedId));
    expect(send).toHaveBeenCalledTimes(2);
    expect(at().messages).toEqual(result.current.messages.slice(0, 1));
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toMatchObject({ parts: [], status: 'streaming' });
    expect(result.current.messages[1]?.id).not.toBe(failedId);
    await push(at(), { type: 'text-delta', text: 'Done' }, { type: 'finish' });
    expect(result.current.messages[1]).toMatchObject({ status: 'complete' });
    act(() => result.current.retry());
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('UIC-CHAT-CONTROLLER-2.5 queues messages sent during a run and sends them in order', async () => {
    const { result, at, send } = renderController();
    act(() => result.current.send('First'));
    act(() => result.current.send('Second'));
    act(() => result.current.send('Third'));
    expect(send).toHaveBeenCalledTimes(1);
    expect(result.current.queue.map((entry) => entry.text)).toEqual(['Second', 'Third']);
    expect(result.current.props.queue).toBe(result.current.queue);

    await push(at(), { type: 'finish' });
    expect(send).toHaveBeenCalledTimes(2);
    expect(at().messages.at(-1)?.parts).toEqual([{ type: 'text', text: 'Second' }]);
    expect(result.current.queue.map((entry) => entry.text)).toEqual(['Third']);
    await push(at(), { type: 'finish' });
    expect(at().messages.at(-1)?.parts).toEqual([{ type: 'text', text: 'Third' }]);
    expect(result.current.queue).toEqual([]);
  });

  it('UIC-CHAT-CONTROLLER-2.5 lets the queue change and holds it after a stop', async () => {
    const { result, at, send } = renderController();
    act(() => result.current.send('First'));
    act(() => result.current.send('Second'));
    act(() => result.current.send('Third'));
    const [second, third] = result.current.queue;
    act(() =>
      result.current.props.onQueueChange([
        { ...requireDefined(third), text: 'Third, edited' },
        requireDefined(second),
      ]),
    );
    expect(result.current.queue.map((entry) => entry.text)).toEqual(['Third, edited', 'Second']);
    act(() => result.current.stop());
    await settle();
    expect(send).toHaveBeenCalledTimes(1);
    act(() => result.current.send('Fourth'));
    expect(send).toHaveBeenCalledTimes(2);
    expect(at().messages.at(-1)?.parts).toEqual([{ type: 'text', text: 'Third, edited' }]);
    expect(result.current.queue.map((entry) => entry.text)).toEqual(['Second', 'Fourth']);
  });

  it('UIC-CHAT-CONTROLLER-2.5 sends a message now, stopping the reply, ahead of the queue', async () => {
    const { result, at, send } = renderController();
    act(() => result.current.send('First'));
    act(() => result.current.send('Second'));
    act(() => result.current.sendNow('Now'));
    expect(send).toHaveBeenCalledTimes(2);
    expect(at().messages.at(-1)?.parts).toEqual([{ type: 'text', text: 'Now' }]);
    expect(result.current.messages.map((message) => message.status)).toEqual([
      undefined,
      'cancelled',
      undefined,
      'streaming',
    ]);
    expect(result.current.queue.map((entry) => entry.text)).toEqual(['Second']);
    await push(at(), { type: 'finish' });
    expect(send).toHaveBeenCalledTimes(3);
    expect(at().messages.at(-1)?.parts).toEqual([{ type: 'text', text: 'Second' }]);
    act(() => result.current.sendNow('   '));
    expect(send).toHaveBeenCalledTimes(3);
  });

  it('UIC-CHAT-CONTROLLER-2.6 lists the reader prompts for recall', async () => {
    const { result, at } = renderController({
      initialMessages: [
        textMessage('m1', 'ana', 'Hello'),
        textMessage('m2', 'helper', 'Hi, how can I help?'),
        { ...textMessage('m3', 'ana', 'Gone'), isDeleted: true },
      ],
    });
    expect(result.current.props.history).toEqual(['Hello']);
    act(() => result.current.send('Plan dinner'));
    await push(at(), { type: 'finish' });
    expect(result.current.props.history).toEqual(['Hello', 'Plan dinner']);
  });

  it('UIC-CHAT-CONTROLLER-2.7 times reasoning and tool calls the stream leaves untimed', async () => {
    let now = 1_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const { result, at } = renderController();
    act(() => result.current.send('Plan dinner'));
    await push(at(), { type: 'reasoning-delta', id: 'r1', text: 'Hmm' });
    now = 3_500;
    await push(at(), { type: 'tool-call', id: 'call-1', name: 'search_recipes' });
    now = 4_700;
    await push(at(), { type: 'tool-result', id: 'call-1', result: [] }, { type: 'finish' });
    expect(result.current.messages[1]?.parts).toMatchObject([
      { type: 'reasoning', status: 'complete', durationMs: 2_500 },
      { type: 'tool-call', status: 'succeeded', durationMs: 1_200 },
    ]);
  });

  it('UIC-CHAT-CONTROLLER-2.3 stops the reply when its component unmounts', () => {
    const { result, at, unmount } = renderController();
    act(() => result.current.send('Plan dinner'));
    unmount();
    expect(at().context.signal.aborted).toBe(true);
  });
});

describe('useChatController props', () => {
  it('UIC-CHAT-CONTROLLER-5.1 hands a chat everything it needs, with stable callbacks', () => {
    const { result, rerender } = renderController({ upload: vi.fn() });
    const first = result.current.props;
    expect(Object.keys(first).sort()).toEqual(
      [
        'attachments',
        'history',
        'isPending',
        'messages',
        'onAlwaysAllow',
        'onAnswerQuestion',
        'onApprove',
        'onAttach',
        'onDeny',
        'onDismissQuestion',
        'onQueueChange',
        'onRemoveAttachment',
        'onRetry',
        'onRetryAttachment',
        'onSend',
        'onSendNow',
        'onStop',
        'queue',
      ].sort(),
    );
    rerender({ upload: vi.fn() });
    expect(result.current.props).toBe(first);
    expect(result.current.props.onSend).toBe(result.current.send);
    expect(result.current.props.onSendNow).toBe(result.current.sendNow);
    expect(result.current.props.onStop).toBe(result.current.stop);
  });

  it('UIC-CHAT-CONTROLLER-5.3 edits the conversation while the reply and queue carry on', async () => {
    const { result, at, send } = renderController({
      initialMessages: [textMessage('m1', 'ana', 'Hello')],
    });
    act(() => result.current.send('First'));
    act(() => result.current.send('Second'));
    act(() =>
      result.current.updateMessages((messages) => [textMessage('m0', 'ben', 'Older'), ...messages]),
    );
    expect(result.current.messages.map((message) => message.authorId)).toEqual([
      'ben',
      'ana',
      'ana',
      'helper',
    ]);
    expect(result.current.isPending).toBe(true);
    await push(at(), { type: 'text-delta', text: 'Soak.' }, { type: 'finish' });
    expect(result.current.messages[3]?.parts).toEqual([
      { type: 'text', text: 'Soak.', status: 'complete' },
    ]);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('UIC-CHAT-CONTROLLER-5.3 resets the conversation, dropping the old reply and its queue', async () => {
    let finish = () => {};
    const gate = new Promise<void>((resolve) => (finish = resolve));
    const send = vi.fn<ChatSendFunction>(async function* () {
      // A host stream that ignores its signal and finishes late.
      await gate;
      yield { type: 'text-delta', text: 'Late text.' };
      yield { type: 'finish' };
    });
    const { result } = renderController({ send });
    act(() => result.current.send('First'));
    act(() => result.current.send('Queued follow-up'));
    const [[, context]] = send.mock.calls as unknown as [[unknown, ChatSendContext]];
    const conversation = [textMessage('b1', 'ana', 'Another conversation')];
    act(() => result.current.resetConversation(conversation));
    expect(context.signal.aborted).toBe(true);
    expect(result.current.messages).toEqual(conversation);
    expect(result.current.isPending).toBe(false);
    expect(result.current.queue).toEqual([]);
    finish();
    await settle();
    expect(send).toHaveBeenCalledTimes(1);
    expect(result.current.messages).toEqual(conversation);
    act(() => result.current.resetConversation());
    expect(result.current.props.messages).toEqual([]);
  });

  it('UIC-CHAT-CONTROLLER-5.3 rejects the old reply waiters and ignores late responses', async () => {
    const { result, at, send } = renderController();
    act(() => result.current.send('Delete the draft'));
    await push(
      at(),
      { type: 'tool-call', id: 'call-1', name: 'delete_draft' },
      { type: 'approval-request', id: 'call-1', await: true },
    );
    const waiting = at().context.waitFor('call-1');
    act(() => result.current.resetConversation([textMessage('b1', 'ana', 'Fresh start')]));
    await expect(waiting).rejects.toThrow();
    act(() => result.current.props.onApprove('call-1'));
    await settle();
    expect(send).toHaveBeenCalledTimes(1);
    expect(result.current.messages).toEqual([textMessage('b1', 'ana', 'Fresh start')]);
  });

  it('UIC-CHAT-CONTROLLER-5.3 retries a failed reply of the new conversation from scratch', async () => {
    const { result, at, send } = renderController();
    act(() => result.current.send('Plan dinner'));
    await push(at(), { type: 'text-delta', text: 'Partial' }, { type: 'error', message: 'Busy.' });
    const failed = requireDefined(result.current.messages[1]);
    const question = textMessage('b1', 'ana', 'Plan lunch');
    act(() => result.current.resetConversation([question, { ...failed, parts: [] }]));
    act(() => result.current.retry());
    expect(send).toHaveBeenCalledTimes(2);
    expect(at().messages).toEqual([question]);
  });

  it('UIC-CHAT-CONTROLLER-5.1 drives a rendered approval through the props', async () => {
    const user = userEvent.setup();
    const agent: ChatSendFunction = async function* (_messages, { waitFor }) {
      yield { type: 'tool-call', id: 'call-1', name: 'delete_draft', label: 'Delete the draft' };
      yield { type: 'approval-request', id: 'call-1', await: true };
      const response = await waitFor('call-1');
      yield {
        type: 'text-delta',
        text: `The reader chose ${response.type === 'approval' ? response.decision : ''}.`,
      };
      yield { type: 'finish' };
    };
    function Conversation() {
      const { props } = useChatController({
        send: agent,
        currentUserId: 'ana',
        assistantId: 'helper',
      });
      return (
        <>
          <ChatTranscript>
            {props.messages.map((message) => (
              <ChatMessage key={message.id} id={message.id} status={message.status}>
                {message.parts.map((part, index) =>
                  part.type === 'tool-call' ? (
                    <ChatToolCall
                      key={part.id}
                      {...part}
                      onApprove={() => props.onApprove(part.id)}
                    />
                  ) : part.type === 'text' ? (
                    <p key={index}>{part.text}</p>
                  ) : null,
                )}
              </ChatMessage>
            ))}
          </ChatTranscript>
          <button type="button" onClick={() => props.onSend('Clean up my drafts')}>
            Send
          </button>
        </>
      );
    }
    render(<Conversation />);
    await user.click(screen.getByRole('button', { name: 'Send' }));
    const approval = await screen.findByRole('group', { name: 'Allow “Delete the draft”?' });
    await user.click(within(approval).getByRole('button', { name: /Approve/ }));
    expect(await screen.findByText('The reader chose approved.')).toBeInTheDocument();
  });
});
