import { act, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderChat } from '../../../test/chat-fixtures.js';
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
  return { user, ...view };
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

  it("UIC-CHAT-3.13 keeps a wait to its conversation", async () => {
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
});
