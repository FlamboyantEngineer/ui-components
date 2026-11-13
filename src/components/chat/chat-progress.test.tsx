import { act, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { article, renderChat } from '../../../test/chat-fixtures.js';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';
import type { ChatProps } from './chat.js';

installEditorDom();

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

/** A promise the test settles. */
function deferred() {
  let resolve: () => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

const box = () => screen.getByRole('textbox', { name: 'Message' });
const line = () => document.querySelector('.ui-chat__progress') as HTMLElement;
const action = () => document.querySelector('.ui-message-composer__action') as HTMLElement;

function setup(props: Partial<ChatProps>) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const view = renderChat(props);
  return { ...view, user };
}

/** Lets the host's wait pass the chat's delay. */
function wait(milliseconds: number) {
  act(() => {
    vi.advanceTimersByTime(milliseconds);
  });
}

/** Settles a promise the chat waits for, then lets React apply what follows. */
async function settle(run: () => void) {
  await act(async () => {
    run();
    await Promise.resolve();
  });
}

describe('Chat progress', () => {
  it('UIC-CHAT-3.13 UIC-MESSAGE-COMPOSER-3.9 shows a slow send in the line and the send button after 400 ms', async () => {
    const sending = deferred();
    const { user } = setup({ onSend: () => sending.promise });
    expect(line()).toHaveAttribute('role', 'status');
    expect(line()).toBeEmptyDOMElement();
    await user.type(box(), 'Lunch at noon?');
    await user.keyboard('{Enter}');
    wait(300);
    expect(line()).toBeEmptyDOMElement();
    expect(action()).not.toHaveAttribute('data-pending');
    wait(100);
    expect(line()).toHaveAttribute('data-action', 'send');
    expect(line().querySelector('.ui-chat__progress-label')).toHaveTextContent('Sending…');
    expect(line().querySelector('.ui-chat__progress-icon')).toHaveAttribute('data-glyph', 'clock');
    expect(action()).toHaveAttribute('data-pending', 'true');
    expect(screen.getByRole('progressbar', { name: 'Sending' })).toBeInTheDocument();
    await settle(sending.resolve);
    expect(line()).toBeEmptyDOMElement();
    expect(line()).not.toHaveAttribute('data-action');
    expect(action()).not.toHaveAttribute('data-pending');
  });

  it('UIC-CHAT-3.13 shows nothing for a host that answers within 400 ms', async () => {
    const sending = deferred();
    const { user } = setup({ onSend: () => sending.promise });
    await user.type(box(), 'Lunch?');
    await user.keyboard('{Enter}');
    wait(200);
    await settle(sending.resolve);
    wait(400);
    expect(line()).toBeEmptyDOMElement();
    expect(action()).not.toHaveAttribute('data-pending');
  });

  it('UIC-CHAT-3.13 UIC-MESSAGE-COMPOSER-3.8 reads Queuing while a message sent during a reply waits, keeping Send', async () => {
    const queuing = deferred();
    const { user } = setup({
      isPending: true,
      onStop: vi.fn(),
      onQueueChange: vi.fn(),
      onSend: () => queuing.promise,
    });
    await user.type(box(), 'And dessert?');
    await user.keyboard('{Enter}');
    wait(400);
    expect(line()).toHaveAttribute('data-action', 'queue');
    expect(line()).toHaveTextContent('Queuing…');
    expect(action()).toHaveAccessibleName(/^Send/);
    expect(action()).toHaveAttribute('data-pending', 'true');
    await settle(queuing.resolve);
    expect(action()).toHaveAccessibleName('Stop');
  });

  it('UIC-CHAT-3.13 reads Sending for a reply sent while a response runs', async () => {
    const replying = deferred();
    const { user } = setup({
      isPending: true,
      onStop: vi.fn(),
      onQueueChange: vi.fn(),
      onReply: () => replying.promise,
    });
    await user.hover(article('m1'));
    await user.click(within(article('m1')).getByRole('button', { name: 'Reply' }));
    await user.keyboard('Still on!{Enter}');
    wait(400);
    expect(line()).toHaveAttribute('data-action', 'send');
    expect(line()).toHaveTextContent('Sending…');
    await settle(replying.resolve);
  });

  it('UIC-CHAT-3.4 leaves out the messages still being removed from the next queue', async () => {
    const removals = [deferred(), deferred()];
    const onQueueChange = vi
      .fn<NonNullable<ChatProps['onQueueChange']>>()
      .mockReturnValueOnce(removals[0]?.promise)
      .mockReturnValueOnce(removals[1]?.promise);
    const queue = [
      { id: 'q1', text: 'First' },
      { id: 'q2', text: 'Second' },
      { id: 'q3', text: 'Third' },
    ];
    const { user } = setup({ queue, onQueueChange });
    await user.click(screen.getByRole('button', { name: 'Remove queued message 1' }));
    await user.click(screen.getByRole('button', { name: 'Remove queued message 2' }));
    expect(onQueueChange).toHaveBeenLastCalledWith([queue[2]]);
    // A saved edit builds on the same queue.
    await user.click(screen.getByRole('button', { name: 'Edit queued message 3' }));
    await user.keyboard(' draft{Enter}');
    expect(onQueueChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: 'q3', text: 'Third draft' }),
    ]);
    // A removal the host answered no longer counts: the host's queue says what is left.
    await settle(() => removals[0]?.resolve());
    await user.click(screen.getByRole('button', { name: 'Remove queued message 3' }));
    expect(onQueueChange).toHaveBeenLastCalledWith([queue[0]]);
    await settle(() => removals[1]?.resolve());
  });

  it('UIC-CHAT-2.5 UIC-CHAT-3.4 leaves focus on what the reader presses right after Edit', async () => {
    const queue = [
      { id: 'q1', text: 'First' },
      { id: 'q2', text: 'Second' },
    ];
    const host = { onQueueChange: () => undefined, onSteer: () => undefined };
    const { user, rerenderWith } = setup({ queue, ...host });
    await user.click(screen.getByRole('button', { name: 'Edit queued message 2' }));
    expect(box()).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Steer with queued message 1' }));
    rerenderWith({ queue: queue.slice(1), ...host });
    const remove = screen.getByRole('button', { name: 'Remove queued message 1' });
    expect(remove).toHaveFocus();
    // The composer's second focus, two frames after Edit, is for a menu that hands focus back.
    wait(100);
    expect(remove).toHaveFocus();
  });

  it('UIC-CHAT-3.4 keeps a steer that waits to its conversation', async () => {
    const steering = deferred();
    const queue = [
      { id: 'q1', text: 'First' },
      { id: 'q2', text: 'Second' },
    ];
    const props = { queue, onQueueChange: vi.fn(), onSteer: () => steering.promise };
    const { user, rerenderWith } = setup({ ...props, conversationId: 'a' });
    const steers = () => screen.getAllByRole('button', { name: /^Steer with queued message/ });
    const marked = () =>
      [...document.querySelectorAll('.ui-chat__queue-item')].map((item) =>
        item.hasAttribute('data-steering'),
      );
    await user.click(steers()[0] as HTMLElement);
    expect(marked()).toEqual([true, false]);
    expect(steers()[1]).toBeDisabled();
    rerenderWith({ ...props, conversationId: 'b' });
    expect(marked()).toEqual([false, false]);
    expect(steers()[0]).toBeEnabled();
    expect(steers()[1]).toBeEnabled();
    rerenderWith({ ...props, conversationId: 'a' });
    expect(marked()).toEqual([true, false]);
    await settle(steering.resolve);
    expect(marked()).toEqual([false, false]);
  });

  it('UIC-CHAT-3.4 UIC-CHAT-3.13 marks a slow steer, holds the other steers and reads Steering', async () => {
    const steering = deferred();
    const queue = [
      { id: 'q1', text: 'First' },
      { id: 'q2', text: 'Second' },
    ];
    const { user } = setup({ queue, onQueueChange: vi.fn(), onSteer: () => steering.promise });
    const first = screen.getByRole('button', { name: 'Steer with queued message 1' });
    const second = screen.getByRole('button', { name: 'Steer with queued message 2' });
    await user.click(first);
    const items = document.querySelectorAll('.ui-chat__queue-item');
    expect(items[0]).toHaveAttribute('data-steering', 'true');
    expect(items[1]).not.toHaveAttribute('data-steering');
    expect(second).toBeDisabled();
    expect(first).not.toHaveAttribute('data-pending');
    wait(400);
    expect(first).toHaveAttribute('data-pending', 'true');
    expect(line()).toHaveAttribute('data-action', 'steer');
    expect(line()).toHaveTextContent('Steering…');
    await settle(steering.resolve);
    expect(items[0]).not.toHaveAttribute('data-steering');
    expect(second).toBeEnabled();
    expect(line()).toBeEmptyDOMElement();
  });

  it('UIC-CHAT-3.4 hands a refused steer to onSendError and keeps the message', async () => {
    const steering = deferred();
    const onSendError = vi.fn();
    const { user } = setup({
      queue: [{ id: 'q1', text: 'First' }],
      onQueueChange: vi.fn(),
      onSteer: () => steering.promise,
      onSendError,
    });
    await user.click(screen.getByRole('button', { name: 'Steer with queued message 1' }));
    const refusal = new Error('offline');
    await settle(() => steering.reject(refusal));
    await act(async () => {
      await Promise.resolve();
    });
    expect(onSendError).toHaveBeenCalledWith(refusal);
    expect(document.querySelector('.ui-chat__queue-item')).not.toHaveAttribute('data-steering');
    expect(line()).toBeEmptyDOMElement();
  });

  it('UIC-CHAT-3.4 UIC-CHAT-3.13 reads Removing while a slow removal waits', async () => {
    const removing = deferred();
    const { user } = setup({
      queue: [{ id: 'q1', text: 'First' }],
      onQueueChange: () => removing.promise,
    });
    const remove = screen.getByRole('button', { name: 'Remove queued message 1' });
    await user.click(remove);
    wait(400);
    expect(line()).toHaveTextContent('Removing…');
    expect(remove).toHaveAttribute('data-pending', 'true');
    await settle(removing.resolve);
    expect(line()).toBeEmptyDOMElement();
  });

  it('UIC-CHAT-3.13 shows the spinner or the host icon in place of the clock with progressIcon', async () => {
    const sending = deferred();
    const { user, rerenderWith } = setup({ onSend: () => sending.promise, progressIcon: true });
    await user.type(box(), 'Lunch?');
    await user.keyboard('{Enter}');
    wait(400);
    const icon = line().querySelector('.ui-chat__progress-icon');
    expect(icon).toHaveClass('ui-spinner');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    rerenderWith({ onSend: () => sending.promise, progressIcon: <svg data-icon="hourglass" /> });
    expect(line().querySelector('.ui-chat__progress-icon [data-icon="hourglass"]')).not.toBeNull();
    await settle(sending.resolve);
  });

  it('UIC-CHAT-3.13 keeps a wait to its conversation', async () => {
    const sending = deferred();
    const onSend = () => sending.promise;
    const { user, rerenderWith } = setup({ conversationId: 'a', onSend });
    await user.type(box(), 'Lunch?');
    await user.keyboard('{Enter}');
    wait(400);
    expect(line()).toHaveTextContent('Sending…');
    rerenderWith({ conversationId: 'b', onSend });
    expect(line()).toBeEmptyDOMElement();
    rerenderWith({ conversationId: 'a', onSend });
    wait(400);
    expect(line()).toHaveTextContent('Sending…');
    await settle(sending.resolve);
  });

  it("UIC-CHAT-3.4 UIC-CHAT-3.13 holds a queued message's edit until the host accepts it, reading Saving", async () => {
    const saving = deferred();
    const onQueueChange = vi.fn(() => saving.promise);
    const { user } = setup({ queue: [{ id: 'q1', text: 'First' }], onQueueChange });
    await user.click(screen.getByRole('button', { name: 'Edit queued message 1' }));
    await user.keyboard(' draft');
    await user.keyboard('{Enter}');
    expect(onQueueChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'q1', text: 'First draft' }),
    ]);
    wait(400);
    expect(line()).toHaveTextContent('Saving…');
    expect(document.querySelector('.ui-chat__banner')).toHaveTextContent(
      'Editing a queued message',
    );
    await settle(saving.resolve);
    expect(document.querySelector('.ui-chat__banner')).toBeNull();
    expect(line()).toBeEmptyDOMElement();
  });
});
