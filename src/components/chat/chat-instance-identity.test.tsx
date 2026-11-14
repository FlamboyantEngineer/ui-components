import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { message, people } from '../../../test/chat-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';
import {
  installTranscriptLayout,
  uninstallTranscriptLayout,
} from '../../../test/transcript-layout-fixtures.js';
import { ChatMessage } from '../chat-transcript/chat-transcript.js';
import { Chat } from './chat.js';
import { ChatParts, type ChatToolCallPart } from './chat-parts.js';

installEditorDom();
beforeEach(() => {
  installTranscriptLayout({ viewportHeight: 200, messageHeight: 50 });
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  uninstallTranscriptLayout();
  vi.useRealTimers();
});

it('UIC-CHAT-1.3 UIC-CHAT-2.2 UIC-CHAT-2.4 UIC-CHAT-5.3 UIC-CHAT-TRANSCRIPT-3.7 keeps raw read, quote and action identities across equal Chat histories', async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const messages = [message('same', 'sam'), message('reply', 'ana', { replyTo: 'same' })];
  const firstRead = vi.fn();
  const secondRead = vi.fn();
  const firstCopy = vi.fn();
  const secondCopy = vi.fn();
  const { container } = render(
    <>
      <Chat
        showSearch
        aria-label="First conversation"
        messages={messages}
        participants={people}
        currentUserId="sam"
        onRead={firstRead}
        onCopy={firstCopy}
      />
      <Chat
        showSearch
        aria-label="Second conversation"
        messages={messages}
        participants={people}
        currentUserId="sam"
        onRead={secondRead}
        onCopy={secondCopy}
      />
    </>,
  );
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(firstRead).toHaveBeenLastCalledWith('reply');
  expect(secondRead).toHaveBeenLastCalledWith('reply');
  const first = screen.getByRole('feed', { name: 'First conversation' });
  const second = screen.getByRole('feed', { name: 'Second conversation' });
  const firstMessage = first.querySelector<HTMLElement>('[data-message-id="same"]');
  const secondMessage = second.querySelector<HTMLElement>('[data-message-id="same"]');
  expect(firstMessage?.id).toBeTruthy();
  expect(secondMessage?.id).not.toBe(firstMessage?.id);
  const ids = [...container.querySelectorAll('[id]')].map((element) => element.id);
  expect(new Set(ids).size).toBe(ids.length);
  expectHooksMatchSpec(container, 'CHAT');
  await user.click(within(firstMessage as HTMLElement).getByRole('button', { name: 'Copy' }));
  await waitFor(() => expect(firstCopy).toHaveBeenCalledWith('same'));
  expect(secondCopy).not.toHaveBeenCalled();
  await user.click(within(second).getByRole('button', { name: /^Quote from Sam Reed/ }));
  expect(secondMessage).toHaveAttribute('data-highlighted', 'true');
  expect(firstMessage).not.toHaveAttribute('data-highlighted');
  await waitFor(() => expect(secondMessage).toHaveFocus());
  const secondChat = second.closest('.ui-chat') as HTMLElement;
  await user.click(within(secondChat).getByRole('button', { name: 'Search this conversation' }));
  await user.type(
    within(secondChat).getByRole('searchbox', { name: 'Search this conversation' }),
    'Text of same',
  );
  await user.keyboard('{Escape}');
  expect(secondMessage).toHaveFocus();
  expect(firstMessage).not.toHaveFocus();
});

it('UIC-CHAT-TRANSCRIPT-2.3 preserves an explicit caller DOM id', () => {
  render(<ChatMessage id="host-message">An explicit host element</ChatMessage>);
  expect(screen.getByRole('article')).toHaveAttribute('id', 'host-message');
});

it('UIC-CHAT-25.2 gives equal part identities independent DOM namespaces and raw callbacks', async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const call: ChatToolCallPart = {
    type: 'tool-call',
    id: 'same-call',
    name: 'read_notes',
    label: 'Read notes',
    status: 'approval-requested',
    args: {},
    approval: { scopeLabel: 'this conversation' },
  };
  const first = vi.fn();
  const second = vi.fn();
  const { container, rerender } = render(
    <>
      <ChatParts parts={[call]} messageId="same-message" onApprove={first} />
      <ChatParts parts={[call]} messageId="same-message" onApprove={second} />
    </>,
  );
  const cards = [...container.querySelectorAll<HTMLElement>('.ui-chat-tool-call')];
  const ids = cards.map((card) => card.id);
  expect(new Set(ids).size).toBe(2);
  expect(ids).toEqual([
    expect.stringMatching(/-same%2Dmessage-same-call$/),
    expect.stringMatching(/-same%2Dmessage-same-call$/),
  ]);
  await user.click(within(cards[1] as HTMLElement).getByRole('button', { name: 'Approve' }));
  expect(second).toHaveBeenCalledWith('same-call');
  expect(first).not.toHaveBeenCalled();
  rerender(
    <>
      <ChatParts
        parts={[{ ...call, status: 'succeeded' }]}
        messageId="same-message"
        onApprove={first}
      />
      <ChatParts parts={[call]} messageId="same-message" onApprove={second} />
    </>,
  );
  expect([...container.querySelectorAll('.ui-chat-tool-call')].map((card) => card.id)).toEqual(ids);
});
